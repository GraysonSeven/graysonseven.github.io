import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'review_exchange.dart';

enum ModuleStage { notStarted, inProgress, readyForReview, passed }

extension ModuleStageLabel on ModuleStage {
  String get label => switch (this) {
        ModuleStage.notStarted => 'Not started',
        ModuleStage.inProgress => 'In progress',
        ModuleStage.readyForReview => 'Ready for review',
        ModuleStage.passed => 'PASS',
      };
}

enum ReviewDecision { pending, pass, revise }

extension ReviewDecisionLabel on ReviewDecision {
  String get label => switch (this) {
        ReviewDecision.pending => 'Pending review',
        ReviewDecision.pass => 'PASS',
        ReviewDecision.revise => 'REVISE',
      };
}

@immutable
class ReviewSubmission {
  const ReviewSubmission({
    required this.id,
    required this.moduleId,
    required this.submittedAtMs,
    required this.revision,
    required this.evidenceSnapshot,
    required this.learnerNotesSnapshot,
    required this.completedTaskIndexes,
    this.decision = ReviewDecision.pending,
    this.reviewerFeedback = '',
    this.reviewedAtMs,
  });

  final String id;
  final int moduleId;
  final int submittedAtMs;
  final int revision;
  final Map<String, dynamic> evidenceSnapshot;
  final String learnerNotesSnapshot;
  final List<int> completedTaskIndexes;
  final ReviewDecision decision;
  final String reviewerFeedback;
  final int? reviewedAtMs;

  DateTime get submittedAt =>
      DateTime.fromMillisecondsSinceEpoch(submittedAtMs, isUtc: true);

  DateTime? get reviewedAt => reviewedAtMs == null
      ? null
      : DateTime.fromMillisecondsSinceEpoch(reviewedAtMs!, isUtc: true);

  ReviewSubmission copyWith({
    ReviewDecision? decision,
    String? reviewerFeedback,
    int? reviewedAtMs,
  }) {
    return ReviewSubmission(
      id: id,
      moduleId: moduleId,
      submittedAtMs: submittedAtMs,
      revision: revision,
      evidenceSnapshot: _cloneJsonMap(evidenceSnapshot),
      learnerNotesSnapshot: learnerNotesSnapshot,
      completedTaskIndexes: List<int>.from(completedTaskIndexes),
      decision: decision ?? this.decision,
      reviewerFeedback: reviewerFeedback ?? this.reviewerFeedback,
      reviewedAtMs: reviewedAtMs ?? this.reviewedAtMs,
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'moduleId': moduleId,
        'submittedAtMs': submittedAtMs,
        'revision': revision,
        'evidenceSnapshot': _cloneJsonMap(evidenceSnapshot),
        'learnerNotesSnapshot': learnerNotesSnapshot,
        'completedTaskIndexes': List<int>.from(completedTaskIndexes),
        'decision': decision.name,
        'reviewerFeedback': reviewerFeedback,
        'reviewedAtMs': reviewedAtMs,
      };

  factory ReviewSubmission.fromJson(Map<String, dynamic> data) {
    final id = data['id'];
    final moduleId = data['moduleId'];
    final submittedAtMs = data['submittedAtMs'];
    final revision = data['revision'];
    final evidence = data['evidenceSnapshot'];
    final notes = data['learnerNotesSnapshot'];
    final taskIndexes = data['completedTaskIndexes'];
    final decisionName = data['decision'];
    final feedback = data['reviewerFeedback'];
    final reviewedAtMs = data['reviewedAtMs'];

    if (id is! String ||
        id.trim().isEmpty ||
        moduleId is! int ||
        submittedAtMs is! int ||
        revision is! int ||
        revision < 1 ||
        evidence is! Map ||
        notes is! String ||
        taskIndexes is! List ||
        decisionName is! String ||
        feedback is! String ||
        (reviewedAtMs != null && reviewedAtMs is! int)) {
      throw const FormatException('Review submission is invalid.');
    }

    final indexes = <int>[];
    for (final value in taskIndexes) {
      if (value is! int || value < 0) {
        throw const FormatException('Review task snapshot is invalid.');
      }
      indexes.add(value);
    }

    ReviewDecision? decision;
    for (final value in ReviewDecision.values) {
      if (value.name == decisionName) {
        decision = value;
        break;
      }
    }
    if (decision == null) {
      throw const FormatException('Review decision is invalid.');
    }

    return ReviewSubmission(
      id: id,
      moduleId: moduleId,
      submittedAtMs: submittedAtMs,
      revision: revision,
      evidenceSnapshot: _cloneJsonMap(
        Map<String, dynamic>.from(evidence),
      ),
      learnerNotesSnapshot: notes,
      completedTaskIndexes: indexes,
      decision: decision,
      reviewerFeedback: feedback,
      reviewedAtMs: reviewedAtMs as int?,
    );
  }
}

Map<String, dynamic> _cloneJsonMap(Map<String, dynamic> value) {
  final decoded = jsonDecode(jsonEncode(value));
  if (decoded is! Map<String, dynamic>) {
    throw const FormatException('Review evidence snapshot is invalid.');
  }
  return decoded;
}

class ProgressStore extends ChangeNotifier {
  static const _legacyCompletedKey = 'fcss_completed_modules_v1';
  static const _stageKey = 'clientbound_module_stages_v3';
  static const _notesKey = 'clientbound_module_notes_v3';
  static const _tasksKey = 'clientbound_module_tasks_v3';
  static const _feedbackKey = 'clientbound_review_feedback_v3';
  static const _touchedKey = 'clientbound_last_touched_v3';
  static const _reviewSubmissionsKey = 'clientbound_review_submissions_v4';

  Map<int, ModuleStage> _stages = <int, ModuleStage>{};
  Map<int, String> _notes = <int, String>{};
  Map<int, Set<int>> _taskChecks = <int, Set<int>>{};
  Map<int, String> _feedback = <int, String>{};
  Map<int, int> _lastTouched = <int, int>{};
  List<ReviewSubmission> _reviewSubmissions = <ReviewSubmission>[];
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
    final reviewSubmissionsRaw = prefs.getString(_reviewSubmissionsKey);

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

    try {
      _reviewSubmissions = _decodeReviewSubmissions(reviewSubmissionsRaw);
    } catch (_) {
      recovered = true;
      if (reviewSubmissionsRaw != null) {
        await _preserveCorrupt(
          prefs,
          'review_submissions',
          reviewSubmissionsRaw,
        );
      }
      _reviewSubmissions = <ReviewSubmission>[];
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
        'reviewSubmissions':
            _reviewSubmissions.map((item) => item.toJson()).toList(),
      };

  Future<void> importData(Map<String, dynamic> data) async {
    final stagesRaw = jsonEncode(data['stages'] ?? <String, dynamic>{});
    final notesRaw = jsonEncode(data['notes'] ?? <String, dynamic>{});
    final tasksRaw = jsonEncode(data['tasks'] ?? <String, dynamic>{});
    final feedbackRaw = jsonEncode(data['feedback'] ?? <String, dynamic>{});
    final touchedRaw = jsonEncode(data['lastTouched'] ?? <String, dynamic>{});
    final reviewSubmissionsRaw =
        jsonEncode(data['reviewSubmissions'] ?? <dynamic>[]);

    final stages = _decodeStages(stagesRaw);
    final notes = _decodeStringMap(notesRaw);
    final tasks = _decodeSetMap(tasksRaw);
    final feedback = _decodeStringMap(feedbackRaw);
    final touched = _decodeIntMap(touchedRaw);
    final reviewSubmissions =
        _decodeReviewSubmissions(reviewSubmissionsRaw);

    _stages = stages;
    _notes = notes;
    _taskChecks = tasks;
    _feedback = feedback;
    _lastTouched = touched;
    _reviewSubmissions = reviewSubmissions;
    _recoveryWarning = null;

    final prefs = await SharedPreferences.getInstance();
    await _saveAll(prefs);
    notifyListeners();
  }

  List<ReviewSubmission> reviewSubmissionsFor(int moduleId) {
    return _reviewSubmissions
        .where((item) => item.moduleId == moduleId)
        .map(
          (item) => ReviewSubmission.fromJson(item.toJson()),
        )
        .toList(growable: false);
  }

  ReviewSubmission? latestReviewSubmissionFor(int moduleId) {
    final items = _reviewSubmissions
        .where((item) => item.moduleId == moduleId)
        .toList();
    if (items.isEmpty) return null;
    items.sort((a, b) => a.revision.compareTo(b.revision));
    return ReviewSubmission.fromJson(items.last.toJson());
  }

  Future<ReviewSubmission?> submitForReview(
    int moduleId, {
    required Map<String, dynamic> evidenceSnapshot,
  }) async {
    if (!_validModule(moduleId)) return null;

    final revision = reviewSubmissionsFor(moduleId).length + 1;
    final now = DateTime.now().toUtc().millisecondsSinceEpoch;
    final tasks = (_taskChecks[moduleId]?.toList() ?? <int>[])..sort();

    final submission = ReviewSubmission(
      id: 'module-$moduleId-r$revision-$now',
      moduleId: moduleId,
      submittedAtMs: now,
      revision: revision,
      evidenceSnapshot: _cloneJsonMap(evidenceSnapshot),
      learnerNotesSnapshot: notesFor(moduleId),
      completedTaskIndexes: tasks,
    );

    _reviewSubmissions.add(submission);
    _stages[moduleId] = ModuleStage.readyForReview;
    _touch(moduleId);
    notifyListeners();
    await _persist();
    return ReviewSubmission.fromJson(submission.toJson());
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
    final normalizedFeedback = feedback.trim();
    _recordReviewDecision(
      moduleId,
      decision: ReviewDecision.pass,
      feedback: normalizedFeedback,
    );
    _stages[moduleId] = ModuleStage.passed;
    if (normalizedFeedback.isNotEmpty) {
      _feedback[moduleId] = normalizedFeedback;
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
    final normalizedFeedback = feedback.trim().isEmpty
        ? 'Revise the current deliverable and resubmit for review.'
        : feedback.trim();
    _recordReviewDecision(
      moduleId,
      decision: ReviewDecision.revise,
      feedback: normalizedFeedback,
    );
    _stages[moduleId] = ModuleStage.inProgress;
    _feedback[moduleId] = normalizedFeedback;
    _touch(moduleId);
    notifyListeners();
    await _persist();
  }

  void _recordReviewDecision(
    int moduleId, {
    required ReviewDecision decision,
    required String feedback,
  }) {
    final now = DateTime.now().toUtc().millisecondsSinceEpoch;
    var index = -1;
    for (var i = _reviewSubmissions.length - 1; i >= 0; i--) {
      final item = _reviewSubmissions[i];
      if (item.moduleId == moduleId &&
          item.decision == ReviewDecision.pending) {
        index = i;
        break;
      }
    }

    if (index == -1) {
      final revision = reviewSubmissionsFor(moduleId).length + 1;
      final tasks = (_taskChecks[moduleId]?.toList() ?? <int>[])..sort();
      _reviewSubmissions.add(
        ReviewSubmission(
          id: 'module-$moduleId-r$revision-legacy-$now',
          moduleId: moduleId,
          submittedAtMs: now,
          revision: revision,
          evidenceSnapshot: const <String, dynamic>{},
          learnerNotesSnapshot: notesFor(moduleId),
          completedTaskIndexes: tasks,
          decision: decision,
          reviewerFeedback: feedback,
          reviewedAtMs: now,
        ),
      );
      return;
    }

    _reviewSubmissions[index] = _reviewSubmissions[index].copyWith(
      decision: decision,
      reviewerFeedback: feedback,
      reviewedAtMs: now,
    );
  }

  Future<void> applyExternalReviewDecision(
    ReviewDecisionPackage package,
  ) async {
    if (!_validModule(package.moduleId)) {
      throw const FormatException('Review decision module is invalid.');
    }

    final index = _reviewSubmissions.indexWhere(
      (item) => item.id == package.submissionId,
    );
    if (index == -1) {
      throw const FormatException(
        'No matching local review submission was found.',
      );
    }

    final submission = _reviewSubmissions[index];
    if (submission.moduleId != package.moduleId ||
        submission.revision != package.revision) {
      throw const FormatException(
        'Review decision does not match the local submission revision.',
      );
    }

    final mappedDecision =
        package.decision == ReviewExchangeDecision.pass
            ? ReviewDecision.pass
            : ReviewDecision.revise;
    final normalizedFeedback =
        mappedDecision == ReviewDecision.revise &&
                package.feedback.trim().isEmpty
            ? 'Revise the current deliverable and resubmit for review.'
            : package.feedback.trim();

    if (submission.decision != ReviewDecision.pending) {
      if (submission.decision == mappedDecision &&
          submission.reviewerFeedback == normalizedFeedback) {
        return;
      }
      throw const FormatException(
        'This submission already has a different review decision.',
      );
    }

    _reviewSubmissions[index] = submission.copyWith(
      decision: mappedDecision,
      reviewerFeedback: normalizedFeedback,
      reviewedAtMs: package.reviewedAt.millisecondsSinceEpoch,
    );

    if (mappedDecision == ReviewDecision.pass) {
      _stages[package.moduleId] = ModuleStage.passed;
      if (normalizedFeedback.isNotEmpty) {
        _feedback[package.moduleId] = normalizedFeedback;
      }
    } else {
      _stages[package.moduleId] = ModuleStage.inProgress;
      _feedback[package.moduleId] = normalizedFeedback;
    }

    _touch(package.moduleId);
    notifyListeners();
    await _persist();
  }

  Future<void> reset() async {
    _stages = <int, ModuleStage>{};
    _notes = <int, String>{};
    _taskChecks = <int, Set<int>>{};
    _feedback = <int, String>{};
    _lastTouched = <int, int>{};
    _reviewSubmissions = <ReviewSubmission>[];
    _recoveryWarning = null;
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    for (final key in <String>[
      _stageKey,
      _notesKey,
      _tasksKey,
      _feedbackKey,
      _touchedKey,
      _reviewSubmissionsKey,
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
    await prefs.setString(
      _reviewSubmissionsKey,
      jsonEncode(exportData()['reviewSubmissions']),
    );
  }

  List<ReviewSubmission> _decodeReviewSubmissions(String? raw) {
    if (raw == null || raw.isEmpty) return <ReviewSubmission>[];
    final decoded = jsonDecode(raw);
    if (decoded is! List) {
      throw const FormatException('Review submission history is invalid.');
    }

    final result = <ReviewSubmission>[];
    final revisionsByModule = <int, int>{};
    for (final value in decoded) {
      if (value is! Map) {
        throw const FormatException('Review submission entry is invalid.');
      }
      final submission = ReviewSubmission.fromJson(
        Map<String, dynamic>.from(value),
      );
      if (!_validModule(submission.moduleId)) {
        continue;
      }
      final previousRevision = revisionsByModule[submission.moduleId] ?? 0;
      if (submission.revision <= previousRevision) {
        throw const FormatException(
          'Review submission revisions are invalid.',
        );
      }
      revisionsByModule[submission.moduleId] = submission.revision;
      result.add(submission);
    }
    return result;
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
