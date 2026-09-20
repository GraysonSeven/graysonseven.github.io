import 'dart:convert';

import 'package:clientbound/course_catalog.dart';
import 'package:clientbound/progress_store.dart';
import 'package:clientbound/review_exchange.dart';
import 'package:clientbound/review_exchange_store.dart';
import 'package:clientbound/review_package.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  test('review package imports, persists, and produces a decision', () async {
    SharedPreferences.setMockInitialValues({});

    final learner = ProgressStore();
    await learner.load();
    await learner.setNotes(2, 'Learner notes.');
    await learner.toggleTask(2, 0);
    final submission = await learner.submitForReview(
      2,
      evidenceSnapshot: <String, dynamic>{
        'industry': 'Manufacturing',
        'geography': 'United States',
      },
    );

    final outbound = ReviewPackageBuilder.build(
      appVersion: '0.7.0+7',
      module: courseModules[1],
      submission: submission!,
      history: learner.reviewSubmissionsFor(2),
    );

    final reviewer = ReviewExchangeStore();
    await reviewer.load();
    final imported = await reviewer.importReviewPackage(outbound.json);

    expect(imported.moduleId, 2);
    expect(imported.revision, 1);
    expect(imported.submissionId, submission.id);
    expect(imported.structuredEvidence['industry'], 'Manufacturing');

    final reloaded = ReviewExchangeStore();
    await reloaded.load();
    expect(reloaded.records, hasLength(1));
    expect(reloaded.records.single.package.submissionId, submission.id);

    final decision = await reloaded.recordDecision(
      submission.id,
      decision: ReviewExchangeDecision.pass,
      feedback: 'Meets the quality gate.',
    );

    expect(decision.decision, ReviewExchangeDecision.pass);
    expect(
      ReviewDecisionPackage.parse(decision.json).submissionId,
      submission.id,
    );

    await learner.applyExternalReviewDecision(decision);

    expect(learner.stageFor(2), ModuleStage.passed);
    expect(
      learner.latestReviewSubmissionFor(2)!.decision,
      ReviewDecision.pass,
    );
    expect(
      learner.latestReviewSubmissionFor(2)!.reviewerFeedback,
      'Meets the quality gate.',
    );
  });

  test('external decision requires exact submission identity', () async {
    SharedPreferences.setMockInitialValues({});

    final learner = ProgressStore();
    await learner.load();
    final submission = await learner.submitForReview(
      4,
      evidenceSnapshot: <String, dynamic>{
        'serviceBrief': 'Proof package',
      },
    );

    final wrongRevision = ReviewDecisionPackage(
      submissionId: submission!.id,
      moduleId: 4,
      revision: 2,
      decision: ReviewExchangeDecision.pass,
      feedback: '',
      reviewedAt: DateTime.utc(2026, 9, 20),
    );

    await expectLater(
      learner.applyExternalReviewDecision(wrongRevision),
      throwsA(isA<FormatException>()),
    );
    expect(learner.stageFor(4), ModuleStage.readyForReview);

    final unknownSubmission = ReviewDecisionPackage(
      submissionId: 'unknown',
      moduleId: 4,
      revision: 1,
      decision: ReviewExchangeDecision.pass,
      feedback: '',
      reviewedAt: DateTime.utc(2026, 9, 20),
    );

    await expectLater(
      learner.applyExternalReviewDecision(unknownSubmission),
      throwsA(isA<FormatException>()),
    );
    expect(learner.stageFor(4), ModuleStage.readyForReview);
  });

  test('decision re-import is idempotent but conflicting decisions fail',
      () async {
    SharedPreferences.setMockInitialValues({});

    final learner = ProgressStore();
    await learner.load();
    final submission = await learner.submitForReview(
      3,
      evidenceSnapshot: <String, dynamic>{
        'coldEmail': 'Relevant first touch.',
      },
    );

    final pass = ReviewDecisionPackage(
      submissionId: submission!.id,
      moduleId: 3,
      revision: 1,
      decision: ReviewExchangeDecision.pass,
      feedback: 'Usable.',
      reviewedAt: DateTime.utc(2026, 9, 20, 10),
    );

    await learner.applyExternalReviewDecision(pass);
    await learner.applyExternalReviewDecision(pass);

    expect(learner.stageFor(3), ModuleStage.passed);
    expect(learner.reviewSubmissionsFor(3), hasLength(1));

    final conflict = ReviewDecisionPackage(
      submissionId: submission.id,
      moduleId: 3,
      revision: 1,
      decision: ReviewExchangeDecision.revise,
      feedback: 'Change it.',
      reviewedAt: DateTime.utc(2026, 9, 20, 11),
    );

    await expectLater(
      learner.applyExternalReviewDecision(conflict),
      throwsA(isA<FormatException>()),
    );
    expect(learner.stageFor(3), ModuleStage.passed);
  });

  test('review exchange rejects malformed and conflicting imports', () async {
    SharedPreferences.setMockInitialValues({});

    final store = ReviewExchangeStore();
    await store.load();

    await expectLater(
      store.importReviewPackage('{"format":"other"}'),
      throwsA(isA<FormatException>()),
    );

    final learner = ProgressStore();
    await learner.load();
    final submission = await learner.submitForReview(
      1,
      evidenceSnapshot: <String, dynamic>{'niche': 'Manufacturing'},
    );
    final package = ReviewPackageBuilder.build(
      appVersion: '0.7.0+7',
      module: courseModules.first,
      submission: submission!,
      history: learner.reviewSubmissionsFor(1),
    );

    await store.importReviewPackage(package.json);

    final changed = Map<String, dynamic>.from(package.data);
    final changedModule = Map<String, dynamic>.from(
      changed['module'] as Map<String, dynamic>,
    );
    changedModule['title'] = 'Tampered title';
    changed['module'] = changedModule;

    await expectLater(
      store.importReviewPackage(
        const JsonEncoder.withIndent('  ').convert(changed),
      ),
      throwsA(isA<FormatException>()),
    );
  });

  test('malformed review exchange storage recovers safely', () async {
    SharedPreferences.setMockInitialValues({
      'clientbound_review_exchange_v1': '{bad-json',
    });

    final store = ReviewExchangeStore();
    await store.load();

    expect(store.records, isEmpty);
    expect(store.recoveryWarning, isNotNull);
  });
}
