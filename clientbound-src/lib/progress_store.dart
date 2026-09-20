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

    final stageJson =
        prefs.getString(_stageKey) ?? prefs.getString('clientbound_module_stages_v2');
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
    }

    _notes = _decodeStringMap(
      prefs.getString(_notesKey) ?? prefs.getString('clientbound_module_notes_v2'),
    );
    _feedback = _decodeStringMap(prefs.getString(_feedbackKey));
    _lastTouched = _decodeIntMap(prefs.getString(_touchedKey));
    _taskChecks = _decodeSetMap(prefs.getString(_tasksKey));

    if (_stages.isNotEmpty) {
      await _saveAll(prefs);
    }
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

    final prefs = await SharedPreferences.getInstance();
    await _saveAll(prefs);
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

    final prefs = await SharedPreferences.getInstance();
    await _saveAll(prefs);
  }

  Future<void> setNotes(int moduleId, String value) async {
    if (!_validModule(moduleId)) return;

    if (value.trim().isEmpty) {
      _notes.remove(moduleId);
    } else {
      _notes[moduleId] = value;
    }
    if (stageFor(moduleId) == ModuleStage.notStarted && value.trim().isNotEmpty) {
      _stages[moduleId] = ModuleStage.inProgress;
    }
    _touch(moduleId);
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    await _saveAll(prefs);
  }

  Future<void> recordPass(int moduleId, {String feedback = ''}) async {
    if (!_validModule(moduleId)) return;
    _stages[moduleId] = ModuleStage.passed;
    if (feedback.trim().isNotEmpty) {
      _feedback[moduleId] = feedback.trim();
    }
    _touch(moduleId);
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    await _saveAll(prefs);
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

    final prefs = await SharedPreferences.getInstance();
    await _saveAll(prefs);
  }

  Future<void> reset() async {
    _stages = <int, ModuleStage>{};
    _notes = <int, String>{};
    _taskChecks = <int, Set<int>>{};
    _feedback = <int, String>{};
    _lastTouched = <int, int>{};
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

  Future<void> _saveAll(SharedPreferences prefs) async {
    await prefs.setString(
      _stageKey,
      jsonEncode(<String, int>{
        for (final entry in _stages.entries)
          '${entry.key}': entry.value.index,
      }),
    );
    await prefs.setString(
      _notesKey,
      jsonEncode(<String, String>{
        for (final entry in _notes.entries) '${entry.key}': entry.value,
      }),
    );
    await prefs.setString(
      _tasksKey,
      jsonEncode(<String, List<int>>{
        for (final entry in _taskChecks.entries)
          '${entry.key}': (entry.value.toList()..sort()),
      }),
    );
    await prefs.setString(
      _feedbackKey,
      jsonEncode(<String, String>{
        for (final entry in _feedback.entries) '${entry.key}': entry.value,
      }),
    );
    await prefs.setString(
      _touchedKey,
      jsonEncode(<String, int>{
        for (final entry in _lastTouched.entries)
          '${entry.key}': entry.value,
      }),
    );
  }

  Map<int, String> _decodeStringMap(String? raw) {
    if (raw == null || raw.isEmpty) return <int, String>{};
    final decoded = jsonDecode(raw) as Map<String, dynamic>;
    return <int, String>{
      for (final entry in decoded.entries)
        if (int.tryParse(entry.key) case final int id)
          if (_validModule(id) && entry.value is String)
            id: entry.value as String,
    };
  }

  Map<int, int> _decodeIntMap(String? raw) {
    if (raw == null || raw.isEmpty) return <int, int>{};
    final decoded = jsonDecode(raw) as Map<String, dynamic>;
    return <int, int>{
      for (final entry in decoded.entries)
        if (int.tryParse(entry.key) case final int id)
          if (_validModule(id) && entry.value is int)
            id: entry.value as int,
    };
  }

  Map<int, Set<int>> _decodeSetMap(String? raw) {
    if (raw == null || raw.isEmpty) return <int, Set<int>>{};
    final decoded = jsonDecode(raw) as Map<String, dynamic>;
    final result = <int, Set<int>>{};
    for (final entry in decoded.entries) {
      final id = int.tryParse(entry.key);
      if (id == null || !_validModule(id) || entry.value is! List) continue;
      result[id] = (entry.value as List)
          .whereType<int>()
          .where((index) => index >= 0)
          .toSet();
    }
    return result;
  }
}
