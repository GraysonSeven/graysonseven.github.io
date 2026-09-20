import 'dart:convert';

enum ReviewExchangeDecision { pass, revise }

extension ReviewExchangeDecisionLabel on ReviewExchangeDecision {
  String get label => switch (this) {
        ReviewExchangeDecision.pass => 'PASS',
        ReviewExchangeDecision.revise => 'REVISE',
      };
}

class ImportedReviewPackage {
  const ImportedReviewPackage({
    required this.rawData,
    required this.clientboundVersion,
    required this.moduleId,
    required this.moduleTitle,
    required this.focus,
    required this.deliverable,
    required this.qualityGate,
    required this.submissionId,
    required this.revision,
    required this.submittedAt,
    required this.taskCompletion,
    required this.structuredEvidence,
    required this.scratchNotes,
    required this.previousReviewerFeedback,
  });

  static const format = 'clientbound-review-package';
  static const packageSchemaVersion = 1;

  final Map<String, dynamic> rawData;
  final String clientboundVersion;
  final int moduleId;
  final String moduleTitle;
  final String focus;
  final String deliverable;
  final String qualityGate;
  final String submissionId;
  final int revision;
  final DateTime submittedAt;
  final List<Map<String, dynamic>> taskCompletion;
  final Map<String, dynamic> structuredEvidence;
  final String scratchNotes;
  final List<Map<String, dynamic>> previousReviewerFeedback;

  factory ImportedReviewPackage.parse(String raw) {
    final decoded = jsonDecode(raw);
    if (decoded is! Map<String, dynamic>) {
      throw const FormatException('Review package must be a JSON object.');
    }
    return ImportedReviewPackage.fromData(decoded);
  }

  factory ImportedReviewPackage.fromData(Map<String, dynamic> data) {
    if (data['format'] != format) {
      throw const FormatException('This is not a Clientbound review package.');
    }
    if (data['packageSchemaVersion'] != packageSchemaVersion) {
      throw FormatException(
        'Unsupported review package schema: ${data['packageSchemaVersion']}.',
      );
    }

    final module = data['module'];
    final submission = data['submission'];
    final tasks = data['taskCompletion'];
    final evidence = data['structuredEvidence'];
    final previous = data['previousReviewerFeedback'];

    if (module is! Map<String, dynamic> ||
        submission is! Map<String, dynamic> ||
        tasks is! List ||
        evidence is! Map<String, dynamic> ||
        previous is! List ||
        data['scratchNotes'] is! String) {
      throw const FormatException('Review package is missing required sections.');
    }

    final moduleId = module['id'];
    final moduleTitle = module['title'];
    final focus = module['focus'];
    final deliverable = module['deliverable'];
    final qualityGate = module['qualityGate'];
    final submissionId = submission['id'];
    final revision = submission['revision'];
    final submittedAtRaw = submission['submittedAt'];
    final clientboundVersion = data['clientboundVersion'];

    if (moduleId is! int ||
        moduleId < 1 ||
        moduleId > 14 ||
        moduleTitle is! String ||
        moduleTitle.trim().isEmpty ||
        focus is! String ||
        deliverable is! String ||
        qualityGate is! String ||
        submissionId is! String ||
        submissionId.trim().isEmpty ||
        revision is! int ||
        revision < 1 ||
        submittedAtRaw is! String ||
        clientboundVersion is! String) {
      throw const FormatException('Review package metadata is invalid.');
    }

    final submittedAt = DateTime.tryParse(submittedAtRaw);
    if (submittedAt == null) {
      throw const FormatException('Review package submission time is invalid.');
    }

    final normalizedTasks = <Map<String, dynamic>>[];
    for (final task in tasks) {
      if (task is! Map) {
        throw const FormatException('Review package task data is invalid.');
      }
      normalizedTasks.add(Map<String, dynamic>.from(task));
    }

    final normalizedPrevious = <Map<String, dynamic>>[];
    for (final item in previous) {
      if (item is! Map) {
        throw const FormatException(
          'Review package feedback history is invalid.',
        );
      }
      normalizedPrevious.add(Map<String, dynamic>.from(item));
    }

    return ImportedReviewPackage(
      rawData: _cloneMap(data),
      clientboundVersion: clientboundVersion,
      moduleId: moduleId,
      moduleTitle: moduleTitle,
      focus: focus,
      deliverable: deliverable,
      qualityGate: qualityGate,
      submissionId: submissionId,
      revision: revision,
      submittedAt: submittedAt.toUtc(),
      taskCompletion: normalizedTasks,
      structuredEvidence: _cloneMap(evidence),
      scratchNotes: data['scratchNotes'] as String,
      previousReviewerFeedback: normalizedPrevious,
    );
  }

  String get normalizedJson =>
      const JsonEncoder.withIndent('  ').convert(rawData);
}

class ReviewDecisionPackage {
  const ReviewDecisionPackage({
    required this.submissionId,
    required this.moduleId,
    required this.revision,
    required this.decision,
    required this.feedback,
    required this.reviewedAt,
  });

  static const format = 'clientbound-review-decision';
  static const schemaVersion = 1;

  final String submissionId;
  final int moduleId;
  final int revision;
  final ReviewExchangeDecision decision;
  final String feedback;
  final DateTime reviewedAt;

  factory ReviewDecisionPackage.parse(String raw) {
    final decoded = jsonDecode(raw);
    if (decoded is! Map<String, dynamic>) {
      throw const FormatException('Review decision must be a JSON object.');
    }
    return ReviewDecisionPackage.fromData(decoded);
  }

  factory ReviewDecisionPackage.fromData(Map<String, dynamic> data) {
    if (data['format'] != format) {
      throw const FormatException('This is not a Clientbound review decision.');
    }
    if (data['schemaVersion'] != schemaVersion) {
      throw FormatException(
        'Unsupported review decision schema: ${data['schemaVersion']}.',
      );
    }

    final submissionId = data['submissionId'];
    final moduleId = data['moduleId'];
    final revision = data['revision'];
    final decisionRaw = data['decision'];
    final feedback = data['feedback'];
    final reviewedAtRaw = data['reviewedAt'];

    if (submissionId is! String ||
        submissionId.trim().isEmpty ||
        moduleId is! int ||
        moduleId < 1 ||
        moduleId > 14 ||
        revision is! int ||
        revision < 1 ||
        decisionRaw is! String ||
        feedback is! String ||
        reviewedAtRaw is! String) {
      throw const FormatException('Review decision metadata is invalid.');
    }

    ReviewExchangeDecision? decision;
    for (final value in ReviewExchangeDecision.values) {
      if (value.name == decisionRaw) {
        decision = value;
        break;
      }
    }
    if (decision == null) {
      throw const FormatException('Review decision value is invalid.');
    }

    final reviewedAt = DateTime.tryParse(reviewedAtRaw);
    if (reviewedAt == null) {
      throw const FormatException('Review decision time is invalid.');
    }

    return ReviewDecisionPackage(
      submissionId: submissionId,
      moduleId: moduleId,
      revision: revision,
      decision: decision,
      feedback: feedback,
      reviewedAt: reviewedAt.toUtc(),
    );
  }

  Map<String, dynamic> toData() => <String, dynamic>{
        'format': format,
        'schemaVersion': schemaVersion,
        'submissionId': submissionId,
        'moduleId': moduleId,
        'revision': revision,
        'decision': decision.name,
        'feedback': feedback,
        'reviewedAt': reviewedAt.toUtc().toIso8601String(),
      };

  String get json => const JsonEncoder.withIndent('  ').convert(toData());
}

Map<String, dynamic> _cloneMap(Map<String, dynamic> value) {
  final cloned = jsonDecode(jsonEncode(value));
  if (cloned is! Map<String, dynamic>) {
    throw const FormatException('Review exchange data is invalid.');
  }
  return cloned;
}
