import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

enum ModuleStage { notStarted, inProgress, readyForReview, passed }

extension ModuleStageLabel on ModuleStage {
  String get label => switch (this) {
        ModuleStage.notStarted => 'Not started',
        ModuleStage.inProgress => 'In progress',
        ModuleStage.readyForReview => 'Ready for review',
        ModuleStage.passed => 'PASS',
      };
}

class ProgressStore extends ChangeNotifier {
  static const _legacyCompletedKey = 'fcss_completed_modules_v1';
  static const _stageKey = 'clientbound_module_stages_v3';
  static const _notesKey = 'clientbound_module_notes_v3';
  static const _tasksKey = 'clientbound_module_tasks_v3';
  static const _feedbackKey = 'clientbound_review_feedback_v3';
  static const _touchedKey = 'clientbound_last_touched_v3';

  Map<int, ModuleStage> _stages = <int, ModuleStage>{};
  Map<int, String> _notes = <int, String>{};
  Map<int, Set<int>> _taskChecks = <int, Set<int>>{};
  Map<int, String> _feedback = <int, String>{};
  Map<int, int> _lastTouched = <int, int>{};
  String? _recoveryWarning;

  Set<int> get completed => _stages.entries
      .where((entry) => entry.value == ModuleStage.passed)
      .map((entry) => entry.key)
      .toSet();

  int get passedCount => completed.length;

  int get activeCount => _stages.values
      .where(
        (stage) =>
            stage == ModuleStage.inProgress ||
            stage == ModuleStage.readyForReview,
      )
      .length;

  int get readyForReviewCount => _stages.values
      .where((stage) => stage == ModuleStage.readyForReview)
      .length;

  double get ratio => passedCount / 14;

  String? get recoveryWarning => _recoveryWarning;

  bool isCompleted(int moduleId) => stageFor(moduleId) == ModuleStage.passed;

  ModuleStage stageFor(int moduleId) =>
      _stages[moduleId] ?? ModuleStage.notStarted;

  String notesFor(int moduleId) => _notes[moduleId] ?? '';

  String feedbackFor(int moduleId) => _feedback[moduleId] ?? '';

  bool taskDone(int moduleId, int taskIndex) =>
      _taskChecks[moduleId]?.contains(taskIndex) ?? false;

  int completedTaskCount(int moduleId) => _taskChecks[moduleId]?.length ?? 0;

  List<int> get recentlyTouchedModuleIds {
    final entries = _lastTouched.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    return entries.map((entry) => entry.key).toList(growable: false);
  }

  int get nextModuleId {
    for (var id = 1; id <= 14; id++) {
      if (stageFor(id) != ModuleStage.passed) return id;
    }
    return 14;
  }

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    var recovered = false;

    final stageRaw =
        prefs.getString(_stageKey) ??
        prefs.getString('clientbound_module_stages_v2');

    if (stageRaw != null && stageRaw.isNotEmpty) {
      try {
        _stages = _decodeStages(stageRaw);
      } catch (_) {
        recovered = true;
        await _preserveCorrupt(prefs, 'stages', stageRaw);
        _stages = <int, ModuleStage>{};
      }
    } else {
      final legacy =
          prefs.getStringList(_legacyCompletedKey) ?? const <String>[];
      for (final raw in legacy) {
        final id = int.tryParse(raw);
        if (id != null && _validModule(id)) {
          _stages[id] = ModuleStage.passed;
        }
      }
    }

    final notesRaw =
        prefs.getString(_notesKey) ??
        prefs.getString('clientbound_module_notes_v2');
    final feedbackRaw = prefs.getString(_feedbackKey);
    final touchedRaw = prefs.getString(_touchedKey);
    final tasksRaw = prefs.getString(_tasksKey);

    try {
      _notes = _decodeStringMap(notesRaw);
    } catch (_) {
      recovered = true;
      if (notesRaw != null) await _preserveCorrupt(prefs, 'notes', notesRaw);
      _notes = <int, String>{};
    }

    try {
      _feedback = _decodeStringMap(feedbackRaw);
    } catch (_) {
      recovered = true;
      if (feedbackRaw != null) {
        await _preserveCorrupt(prefs, 'feedback', feedbackRaw);
      }
      _feedback = <int, String>{};
    }

    try {
      _lastTouched = _decodeIntMap(touchedRaw);
    } catch (_) {
      recovered = true;
      if (touchedRaw != null) {
        await _preserveCorrupt(prefs, 'touched', touchedRaw);
      }
      _lastTouched = <int, int>{};
    }

    try {
      _taskChecks = _decodeSetMap(tasksRaw);
    } catch (_) {
      recovered = true;
      if (tasksRaw != null) await _preserveCorrupt(prefs, 'tasks', tasksRaw);
      _taskChecks = <int, Set<int>>{};
    }

    if (recovered) {
      _recoveryWarning =
          'Clientbound recovered from damaged local learning data. A preserved copy was kept locally for diagnosis.';
    }

    await _saveAll(prefs);
    notifyListeners();
  }

  Map<String, dynamic> exportData() => <String, dynamic>{
        'stages': <String, int>{
          for (final entry in _stages.entries)
            '${entry.key}': entry.value.index,
        },
        'notes': <String, String>{
          for (final entry in _notes.entries) '${entry.key}': entry.value,
        },
        'tasks': <String, List<int>>{
          for (final entry in _taskChecks.entries)
            '${entry.key}': (entry.value.toList()..sort()),
        },
        'feedback': <String, String>{
          for (final entry in _feedback.entries)
            '${entry.key}': entry.value,
        },
        'lastTouched': <String, int>{
          for (final entry in _lastTouched.entries)
            '${entry.key}': entry.value,
        },
      };

  Future<void> importData(Map<String, dynamic> data) async {
    final stagesRaw = jsonEncode(data['stages'] ?? <String, dynamic>{});
    final notesRaw = jsonEncode(data['notes'] ?? <String, dynamic>{});
    final tasksRaw = jsonEncode(data['tasks'] ?? <String, dynamic>{});
    final feedbackRaw = jsonEncode(data['feedback'] ?? <String, dynamic>{});
    final touchedRaw = jsonEncode(data['lastTouched'] ?? <String, dynamic>{});

    final stages = _decodeStages(stagesRaw);
    final notes = _decodeStringMap(notesRaw);
    final tasks = _decodeSetMap(tasksRaw);
    final feedback = _decodeStringMap(feedbackRaw);
    final touched = _decodeIntMap(touchedRaw);

    _stages = stages;
    _notes = notes;
    _taskChecks = tasks;
    _feedback = feedback;
    _lastTouched = touched;
    _recoveryWarning = null;

    final prefs = await SharedPreferences.getInstance();
    await _saveAll(prefs);
    notifyListeners();
  }

  Future<void> setStage(int moduleId, ModuleStage stage) async {
    if (!_validModule(moduleId)) return;

    if (stage == ModuleStage.notStarted) {
      _stages.remove(moduleId);
    } else {
      _stages[moduleId] = stage;
    }
    _touch(moduleId);
    notifyListeners();
    await _persist();
  }

  Future<void> setCompleted(int moduleId, bool value) {
    return setStage(
      moduleId,
      value ? ModuleStage.passed : ModuleStage.notStarted,
    );
  }

  Future<void> toggleTask(int moduleId, int taskIndex) async {
    if (!_validModule(moduleId) || taskIndex < 0) return;
    final checked = _taskChecks.putIfAbsent(moduleId, () => <int>{});
    if (!checked.add(taskIndex)) {
      checked.remove(taskIndex);
    }
    if (checked.isEmpty) {
      _taskChecks.remove(moduleId);
    }
    if (stageFor(moduleId) == ModuleStage.notStarted) {
      _stages[moduleId] = ModuleStage.inProgress;
    }
    _touch(moduleId);
    notifyListeners();
    await _persist();
  }

  Future<void> setNotes(int moduleId, String value) async {
    if (!_validModule(moduleId)) return;

    if (value.trim().isEmpty) {
      _notes.remove(moduleId);
    } else {
      _notes[moduleId] = value;
    }
    if (stageFor(moduleId) == ModuleStage.notStarted &&
        value.trim().isNotEmpty) {
      _stages[moduleId] = ModuleStage.inProgress;
    }
    _touch(moduleId);
    notifyListeners();
    await _persist();
  }

  Future<void> recordPass(int moduleId, {String feedback = ''}) async {
    if (!_validModule(moduleId)) return;
    _stages[moduleId] = ModuleStage.passed;
    if (feedback.trim().isNotEmpty) {
      _feedback[moduleId] = feedback.trim();
    }
    _touch(moduleId);
    notifyListeners();
    await _persist();
  }

  Future<void> returnForRevision(
    int moduleId, {
    required String feedback,
  }) async {
    if (!_validModule(moduleId)) return;
    _stages[moduleId] = ModuleStage.inProgress;
    _feedback[moduleId] = feedback.trim().isEmpty
        ? 'Revise the current deliverable and resubmit for review.'
        : feedback.trim();
    _touch(moduleId);
    notifyListeners();
    await _persist();
  }

  Future<void> reset() async {
    _stages = <int, ModuleStage>{};
    _notes = <int, String>{};
    _taskChecks = <int, Set<int>>{};
    _feedback = <int, String>{};
    _lastTouched = <int, int>{};
    _recoveryWarning = null;
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    for (final key in <String>[
      _stageKey,
      _notesKey,
      _tasksKey,
      _feedbackKey,
      _touchedKey,
      _legacyCompletedKey,
      'clientbound_module_stages_v2',
      'clientbound_module_notes_v2',
    ]) {
      await prefs.remove(key);
    }
  }

  bool _validModule(int id) => id >= 1 && id <= 14;

  void _touch(int moduleId) {
    _lastTouched[moduleId] = DateTime.now().millisecondsSinceEpoch;
  }

  Future<void> _persist() async {
    final prefs = await SharedPreferences.getInstance();
    await _saveAll(prefs);
  }

  Future<void> _saveAll(SharedPreferences prefs) async {
    await prefs.setString(_stageKey, jsonEncode(exportData()['stages']));
    await prefs.setString(_notesKey, jsonEncode(exportData()['notes']));
    await prefs.setString(_tasksKey, jsonEncode(exportData()['tasks']));
    await prefs.setString(_feedbackKey, jsonEncode(exportData()['feedback']));
    await prefs.setString(
      _touchedKey,
      jsonEncode(exportData()['lastTouched']),
    );
  }

  Map<int, ModuleStage> _decodeStages(String raw) {
    final decoded = jsonDecode(raw);
    if (decoded is! Map<String, dynamic>) {
      throw const FormatException('Module stages are invalid.');
    }
    final result = <int, ModuleStage>{};
    for (final entry in decoded.entries) {
      final id = int.tryParse(entry.key);
      final index = entry.value is int ? entry.value as int : null;
      if (id == null || !_validModule(id)) continue;
      if (index == null ||
          index < 0 ||
          index >= ModuleStage.values.length) {
        throw const FormatException('Module stage index is invalid.');
      }
      result[id] = ModuleStage.values[index];
    }
    return result;
  }

  Map<int, String> _decodeStringMap(String? raw) {
    if (raw == null || raw.isEmpty) return <int, String>{};
    final decoded = jsonDecode(raw);
    if (decoded is! Map<String, dynamic>) {
      throw const FormatException('String map is invalid.');
    }
    final result = <int, String>{};
    for (final entry in decoded.entries) {
      final id = int.tryParse(entry.key);
      if (id == null || !_validModule(id)) continue;
      if (entry.value is! String) {
        throw const FormatException('String map value is invalid.');
      }
      result[id] = entry.value as String;
    }
    return result;
  }

  Map<int, int> _decodeIntMap(String? raw) {
    if (raw == null || raw.isEmpty) return <int, int>{};
    final decoded = jsonDecode(raw);
    if (decoded is! Map<String, dynamic>) {
      throw const FormatException('Integer map is invalid.');
    }
    final result = <int, int>{};
    for (final entry in decoded.entries) {
      final id = int.tryParse(entry.key);
      if (id == null || !_validModule(id)) continue;
      if (entry.value is! int) {
        throw const FormatException('Integer map value is invalid.');
      }
      result[id] = entry.value as int;
    }
    return result;
  }

  Map<int, Set<int>> _decodeSetMap(String? raw) {
    if (raw == null || raw.isEmpty) return <int, Set<int>>{};
    final decoded = jsonDecode(raw);
    if (decoded is! Map<String, dynamic>) {
      throw const FormatException('Task map is invalid.');
    }
    final result = <int, Set<int>>{};
    for (final entry in decoded.entries) {
      final id = int.tryParse(entry.key);
      if (id == null || !_validModule(id)) continue;
      if (entry.value is! List) {
        throw const FormatException('Task list is invalid.');
      }
      final values = <int>{};
      for (final value in entry.value as List<dynamic>) {
        if (value is! int || value < 0) {
          throw const FormatException('Task index is invalid.');
        }
        values.add(value);
      }
      result[id] = values;
    }
    return result;
  }

  Future<void> _preserveCorrupt(
    SharedPreferences prefs,
    String section,
    String raw,
  ) {
    return prefs.setString(
      'clientbound_recovered_progress_${section}_${DateTime.now().millisecondsSinceEpoch}',
      raw,
    );
  }
}
