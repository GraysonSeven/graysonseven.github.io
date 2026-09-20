import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'workspace_schema.dart';

class WorkspaceStore extends ChangeNotifier {
  static const _key = 'clientbound_workspaces_v1';

  Map<int, Map<String, dynamic>> _modules =
      <int, Map<String, dynamic>>{};
  Timer? _persistTimer;
  String? _recoveryWarning;

  String? get recoveryWarning => _recoveryWarning;

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null || raw.isEmpty) {
      notifyListeners();
      return;
    }

    try {
      _modules = _decodeModules(raw);
    } catch (_) {
      _recoveryWarning =
          'Clientbound recovered from damaged structured workspace data. A preserved copy was kept locally.';
      await prefs.setString(
        'clientbound_recovered_workspaces_${DateTime.now().millisecondsSinceEpoch}',
        raw,
      );
      await prefs.remove(_key);
      _modules = <int, Map<String, dynamic>>{};
    }

    notifyListeners();
  }

  String stringValue(int moduleId, String fieldKey) {
    final value = _modules[moduleId]?[fieldKey];
    return value is String ? value : '';
  }

  List<Map<String, String>> tableValue(
    int moduleId,
    String fieldKey,
  ) {
    final value = _modules[moduleId]?[fieldKey];
    if (value is! List) return <Map<String, String>>[];

    final rows = <Map<String, String>>[];
    for (final row in value) {
      if (row is Map<String, String>) {
        rows.add(Map<String, String>.from(row));
      } else if (row is Map) {
        rows.add(<String, String>{
          for (final entry in row.entries)
            entry.key.toString(): entry.value?.toString() ?? '',
        });
      }
    }
    return rows;
  }

  void setString(int moduleId, String fieldKey, String value) {
    final module = _modules.putIfAbsent(
      moduleId,
      () => <String, dynamic>{},
    );
    module[fieldKey] = value;
    _schedulePersist();
    notifyListeners();
  }

  void addTableRow(
    int moduleId,
    String fieldKey,
    Iterable<String> columnKeys,
  ) {
    final rows = tableValue(moduleId, fieldKey);
    rows.add(<String, String>{
      for (final key in columnKeys) key: '',
    });
    _setTable(moduleId, fieldKey, rows);
  }

  void removeTableRow(int moduleId, String fieldKey, int rowIndex) {
    final rows = tableValue(moduleId, fieldKey);
    if (rowIndex < 0 || rowIndex >= rows.length) return;
    rows.removeAt(rowIndex);
    _setTable(moduleId, fieldKey, rows);
  }

  void setTableCell(
    int moduleId,
    String fieldKey,
    int rowIndex,
    String columnKey,
    String value,
  ) {
    final rows = tableValue(moduleId, fieldKey);
    if (rowIndex < 0 || rowIndex >= rows.length) return;
    rows[rowIndex][columnKey] = value;
    _setTable(moduleId, fieldKey, rows);
  }

  List<String> readinessIssues(int moduleId) {
    final definition = moduleWorkspaceDefinitions[moduleId];
    if (definition == null) return const <String>[];

    final issues = <String>[];
    for (final field in definition.fields) {
      if (!field.required) continue;

      if (field.type == WorkspaceFieldType.table) {
        final rows = tableValue(moduleId, field.key);
        final expected = field.expectedRows ?? 1;
        if (rows.length < expected) {
          issues.add(
            '${field.label}: add at least $expected row(s).',
          );
          continue;
        }

        for (var rowIndex = 0; rowIndex < rows.length; rowIndex++) {
          final row = rows[rowIndex];
          final missing = field.columns
              .where(
                (column) =>
                    (row[column.key] ?? '').trim().isEmpty,
              )
              .map((column) => column.label)
              .toList();
          if (missing.isNotEmpty) {
            issues.add(
              '${field.label} row ${rowIndex + 1}: complete ${missing.join(', ')}.',
            );
          }
        }
        continue;
      }

      if (stringValue(moduleId, field.key).trim().isEmpty) {
        issues.add('${field.label}: required.');
      }
    }
    return issues;
  }

  bool isReadyForReview(int moduleId) =>
      readinessIssues(moduleId).isEmpty;

  Map<String, dynamic> exportData() => <String, dynamic>{
        'modules': <String, dynamic>{
          for (final entry in _modules.entries)
            '${entry.key}': _cloneModule(entry.value),
        },
      };

  Future<void> importData(Map<String, dynamic> data) async {
    final rawModules = data['modules'];
    if (rawModules is! Map) {
      throw const FormatException('Workspace backup is invalid.');
    }

    _modules = _decodeModules(jsonEncode(rawModules));
    _recoveryWarning = null;
    await flush();
    notifyListeners();
  }

  Future<void> reset() async {
    _persistTimer?.cancel();
    _modules = <int, Map<String, dynamic>>{};
    _recoveryWarning = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
    notifyListeners();
  }

  Future<void> flush() async {
    _persistTimer?.cancel();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      _key,
      jsonEncode(<String, dynamic>{
        for (final entry in _modules.entries)
          '${entry.key}': _cloneModule(entry.value),
      }),
    );
  }

  void _setTable(
    int moduleId,
    String fieldKey,
    List<Map<String, String>> rows,
  ) {
    final module = _modules.putIfAbsent(
      moduleId,
      () => <String, dynamic>{},
    );
    module[fieldKey] = rows;
    _schedulePersist();
    notifyListeners();
  }

  void _schedulePersist() {
    _persistTimer?.cancel();
    _persistTimer = Timer(
      const Duration(milliseconds: 450),
      () => unawaited(flush()),
    );
  }

  Map<int, Map<String, dynamic>> _decodeModules(String raw) {
    final decoded = jsonDecode(raw);
    if (decoded is! Map) {
      throw const FormatException('Workspace root is invalid.');
    }

    final result = <int, Map<String, dynamic>>{};
    for (final entry in decoded.entries) {
      final id = int.tryParse(entry.key.toString());
      if (id == null || id < 1 || id > 14 || entry.value is! Map) {
        continue;
      }

      final module = <String, dynamic>{};
      for (final field in (entry.value as Map).entries) {
        final key = field.key.toString();
        final value = field.value;
        if (value is String) {
          module[key] = value;
          continue;
        }
        if (value is List) {
          final rows = <Map<String, String>>[];
          for (final row in value) {
            if (row is! Map) {
              throw const FormatException(
                'Workspace table row is invalid.',
              );
            }
            rows.add(<String, String>{
              for (final cell in row.entries)
                cell.key.toString(): cell.value?.toString() ?? '',
            });
          }
          module[key] = rows;
          continue;
        }
        throw const FormatException('Workspace field type is invalid.');
      }
      result[id] = module;
    }
    return result;
  }

  Map<String, dynamic> _cloneModule(
    Map<String, dynamic> module,
  ) {
    return <String, dynamic>{
      for (final entry in module.entries)
        entry.key: entry.value is List
            ? (entry.value as List)
                .map(
                  (row) => <String, String>{
                    for (final cell in (row as Map).entries)
                      cell.key.toString():
                          cell.value?.toString() ?? '',
                  },
                )
                .toList()
            : entry.value,
    };
  }
}

class WorkspaceScope extends InheritedNotifier<WorkspaceStore> {
  const WorkspaceScope({
    super.key,
    required WorkspaceStore store,
    required super.child,
  }) : super(notifier: store);

  static WorkspaceStore of(BuildContext context) {
    final scope =
        context.dependOnInheritedWidgetOfExactType<WorkspaceScope>();
    assert(scope != null, 'WorkspaceScope is missing.');
    return scope!.notifier!;
  }
}
