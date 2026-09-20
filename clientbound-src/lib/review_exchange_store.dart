import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'review_exchange.dart';

@immutable
class ReviewExchangeRecord {
  const ReviewExchangeRecord({
    required this.package,
    this.decision,
  });

  final ImportedReviewPackage package;
  final ReviewDecisionPackage? decision;

  ReviewExchangeRecord copyWith({
    ReviewDecisionPackage? decision,
  }) {
    return ReviewExchangeRecord(
      package: package,
      decision: decision ?? this.decision,
    );
  }

  Map<String, dynamic> toData() => <String, dynamic>{
        'package': package.rawData,
        'decision': decision?.toData(),
      };

  factory ReviewExchangeRecord.fromData(Map<String, dynamic> data) {
    final packageRaw = data['package'];
    final decisionRaw = data['decision'];
    if (packageRaw is! Map) {
      throw const FormatException('Imported review record is invalid.');
    }

    final package = ImportedReviewPackage.fromData(
      Map<String, dynamic>.from(packageRaw),
    );

    ReviewDecisionPackage? decision;
    if (decisionRaw != null) {
      if (decisionRaw is! Map) {
        throw const FormatException('Imported review decision is invalid.');
      }
      decision = ReviewDecisionPackage.fromData(
        Map<String, dynamic>.from(decisionRaw),
      );
      if (decision.submissionId != package.submissionId ||
          decision.moduleId != package.moduleId ||
          decision.revision != package.revision) {
        throw const FormatException(
          'Imported decision does not match its review package.',
        );
      }
    }

    return ReviewExchangeRecord(
      package: package,
      decision: decision,
    );
  }
}

class ReviewExchangeStore extends ChangeNotifier {
  static const _key = 'clientbound_review_exchange_v1';

  final Map<String, ReviewExchangeRecord> _records =
      <String, ReviewExchangeRecord>{};
  String? _recoveryWarning;

  String? get recoveryWarning => _recoveryWarning;

  List<ReviewExchangeRecord> get records {
    final values = _records.values.toList();
    values.sort(
      (a, b) => b.package.submittedAt.compareTo(a.package.submittedAt),
    );
    return List<ReviewExchangeRecord>.unmodifiable(values);
  }

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null || raw.isEmpty) {
      notifyListeners();
      return;
    }

    try {
      final decoded = jsonDecode(raw);
      if (decoded is! List) {
        throw const FormatException('Review exchange storage is invalid.');
      }
      _records.clear();
      for (final value in decoded) {
        if (value is! Map) {
          throw const FormatException('Review exchange record is invalid.');
        }
        final record = ReviewExchangeRecord.fromData(
          Map<String, dynamic>.from(value),
        );
        _records[record.package.submissionId] = record;
      }
    } catch (_) {
      _recoveryWarning =
          'Clientbound recovered from damaged review-exchange data. A preserved copy was kept locally.';
      await prefs.setString(
        'clientbound_recovered_review_exchange_${DateTime.now().millisecondsSinceEpoch}',
        raw,
      );
      await prefs.remove(_key);
      _records.clear();
    }

    notifyListeners();
  }

  Future<ImportedReviewPackage> importReviewPackage(String raw) async {
    final package = ImportedReviewPackage.parse(raw);
    final existing = _records[package.submissionId];

    if (existing != null &&
        existing.package.normalizedJson != package.normalizedJson) {
      throw const FormatException(
        'A different package already uses this submission ID.',
      );
    }

    _records[package.submissionId] =
        existing ?? ReviewExchangeRecord(package: package);
    _recoveryWarning = null;
    await _persist();
    notifyListeners();
    return package;
  }

  ReviewExchangeRecord? recordFor(String submissionId) =>
      _records[submissionId];

  Future<ReviewDecisionPackage> recordDecision(
    String submissionId, {
    required ReviewExchangeDecision decision,
    required String feedback,
  }) async {
    final record = _records[submissionId];
    if (record == null) {
      throw const FormatException('Imported review package was not found.');
    }

    final normalizedFeedback =
        decision == ReviewExchangeDecision.revise && feedback.trim().isEmpty
            ? 'Revise the current deliverable and resubmit for review.'
            : feedback.trim();

    final package = ReviewDecisionPackage(
      submissionId: record.package.submissionId,
      moduleId: record.package.moduleId,
      revision: record.package.revision,
      decision: decision,
      feedback: normalizedFeedback,
      reviewedAt: DateTime.now().toUtc(),
    );

    _records[submissionId] = record.copyWith(decision: package);
    await _persist();
    notifyListeners();
    return package;
  }

  Future<void> remove(String submissionId) async {
    if (_records.remove(submissionId) == null) return;
    await _persist();
    notifyListeners();
  }

  Map<String, dynamic> exportData() => <String, dynamic>{
        'records': records.map((record) => record.toData()).toList(),
      };

  Future<void> importData(Map<String, dynamic> data) async {
    final rawRecords = data['records'];
    if (rawRecords is! List) {
      throw const FormatException('Review exchange backup is invalid.');
    }

    final next = <String, ReviewExchangeRecord>{};
    for (final value in rawRecords) {
      if (value is! Map) {
        throw const FormatException('Review exchange backup record is invalid.');
      }
      final record = ReviewExchangeRecord.fromData(
        Map<String, dynamic>.from(value),
      );
      next[record.package.submissionId] = record;
    }

    _records
      ..clear()
      ..addAll(next);
    _recoveryWarning = null;
    await _persist();
    notifyListeners();
  }

  Future<void> reset() async {
    _records.clear();
    _recoveryWarning = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
    notifyListeners();
  }

  Future<void> _persist() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      _key,
      jsonEncode(records.map((record) => record.toData()).toList()),
    );
  }
}
