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
  static const _stageKey = 'clientbound_module_stages_v2';
  static const _notesKey = 'clientbound_module_notes_v2';

  Map<int, ModuleStage> _stages = <int, ModuleStage>{};
  Map<int, String> _notes = <int, String>{};

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

  double get ratio => passedCount / 14;

  bool isCompleted(int moduleId) => stageFor(moduleId) == ModuleStage.passed;

  ModuleStage stageFor(int moduleId) =>
      _stages[moduleId] ?? ModuleStage.notStarted;

  String notesFor(int moduleId) => _notes[moduleId] ?? '';

  int get nextModuleId {
    for (var id = 1; id <= 14; id++) {
      if (stageFor(id) != ModuleStage.passed) return id;
    }
    return 14;
  }

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    final stageJson = prefs.getString(_stageKey);

    if (stageJson != null && stageJson.isNotEmpty) {
      final decoded = jsonDecode(stageJson) as Map<String, dynamic>;
      _stages = <int, ModuleStage>{};
      for (final entry in decoded.entries) {
        final id = int.tryParse(entry.key);
        final index = entry.value is int ? entry.value as int : null;
        if (id != null &&
            id >= 1 &&
            id <= 14 &&
            index != null &&
            index >= 0 &&
            index < ModuleStage.values.length) {
          _stages[id] = ModuleStage.values[index];
        }
      }
    } else {
      final legacy =
          prefs.getStringList(_legacyCompletedKey) ?? const <String>[];
      for (final raw in legacy) {
        final id = int.tryParse(raw);
        if (id != null && id >= 1 && id <= 14) {
          _stages[id] = ModuleStage.passed;
        }
      }
      if (_stages.isNotEmpty) {
        await _saveStages(prefs);
      }
    }

    final notesJson = prefs.getString(_notesKey);
    if (notesJson != null && notesJson.isNotEmpty) {
      final decoded = jsonDecode(notesJson) as Map<String, dynamic>;
      _notes = <int, String>{};
      for (final entry in decoded.entries) {
        final id = int.tryParse(entry.key);
        if (id != null &&
            id >= 1 &&
            id <= 14 &&
            entry.value is String) {
          _notes[id] = entry.value as String;
        }
      }
    }

    notifyListeners();
  }

  Future<void> setStage(int moduleId, ModuleStage stage) async {
    if (moduleId < 1 || moduleId > 14) return;

    if (stage == ModuleStage.notStarted) {
      _stages.remove(moduleId);
    } else {
      _stages[moduleId] = stage;
    }
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    await _saveStages(prefs);
  }

  Future<void> setCompleted(int moduleId, bool value) {
    return setStage(
      moduleId,
      value ? ModuleStage.passed : ModuleStage.notStarted,
    );
  }

  Future<void> setNotes(int moduleId, String value) async {
    if (moduleId < 1 || moduleId > 14) return;

    if (value.trim().isEmpty) {
      _notes.remove(moduleId);
    } else {
      _notes[moduleId] = value;
    }
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    final encoded = <String, String>{
      for (final entry in _notes.entries) '${entry.key}': entry.value,
    };
    await prefs.setString(_notesKey, jsonEncode(encoded));
  }

  Future<void> reset() async {
    _stages = <int, ModuleStage>{};
    _notes = <int, String>{};
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_stageKey);
    await prefs.remove(_notesKey);
    await prefs.remove(_legacyCompletedKey);
  }

  Future<void> _saveStages(SharedPreferences prefs) async {
    final encoded = <String, int>{
      for (final entry in _stages.entries) '${entry.key}': entry.value.index,
    };
    await prefs.setString(_stageKey, jsonEncode(encoded));
  }
}
