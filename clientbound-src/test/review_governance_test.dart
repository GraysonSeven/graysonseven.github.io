import 'package:clientbound/course_catalog.dart';
import 'package:clientbound/progress_store.dart';
import 'package:clientbound/review_package.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  test('review submissions preserve immutable revision history', () async {
    SharedPreferences.setMockInitialValues({});

    final progress = ProgressStore();
    await progress.load();
    await progress.setNotes(2, 'Research notes for the first review.');
    await progress.toggleTask(2, 0);
    await progress.toggleTask(2, 2);

    final firstEvidence = <String, dynamic>{
      'industry': 'Manufacturing',
      'leadResearch': <Map<String, String>>[
        <String, String>{
          'company': 'Nolte Precise Manufacturing',
          'companyProof': 'Verified company fit.',
        },
      ],
    };

    final first = await progress.submitForReview(
      2,
      evidenceSnapshot: firstEvidence,
    );

    expect(first, isNotNull);
    expect(first!.revision, 1);
    expect(progress.stageFor(2), ModuleStage.readyForReview);
    expect(first.completedTaskIndexes, <int>[0, 2]);

    firstEvidence['industry'] = 'Changed after submit';
    expect(
      progress.latestReviewSubmissionFor(2)!.evidenceSnapshot['industry'],
      'Manufacturing',
    );

    await progress.returnForRevision(
      2,
      feedback: 'Tighten the role and contact proof.',
    );

    final revised = progress.latestReviewSubmissionFor(2)!;
    expect(revised.decision, ReviewDecision.revise);
    expect(revised.reviewerFeedback, contains('contact proof'));
    expect(progress.stageFor(2), ModuleStage.inProgress);

    await progress.setNotes(2, 'Second pass with corrected proof.');
    final second = await progress.submitForReview(
      2,
      evidenceSnapshot: <String, dynamic>{
        'industry': 'Manufacturing',
        'leadResearch': <Map<String, String>>[
          <String, String>{
            'company': 'Nolte Precise Manufacturing',
            'companyProof': 'Verified company fit.',
            'roleProof': 'Verified relevant sales role.',
            'contactProof': 'Verified public contact route.',
            'reasonProof': 'Verified relevance reason.',
          },
        ],
      },
    );

    expect(second, isNotNull);
    expect(second!.revision, 2);
    expect(progress.reviewSubmissionsFor(2), hasLength(2));
    expect(
      progress.reviewSubmissionsFor(2).first.decision,
      ReviewDecision.revise,
    );

    await progress.recordPass(
      2,
      feedback: 'Evidence is reviewable and meets the gate.',
    );

    final history = progress.reviewSubmissionsFor(2);
    expect(history, hasLength(2));
    expect(history.first.decision, ReviewDecision.revise);
    expect(history.last.decision, ReviewDecision.pass);
    expect(history.last.reviewedAt, isNotNull);
    expect(progress.stageFor(2), ModuleStage.passed);
  });

  test('review package includes metadata, evidence, tasks, notes and feedback',
      () async {
    SharedPreferences.setMockInitialValues({});

    final progress = ProgressStore();
    await progress.load();
    await progress.setNotes(2, 'First review notes.');
    await progress.toggleTask(2, 0);
    await progress.submitForReview(
      2,
      evidenceSnapshot: <String, dynamic>{
        'industry': 'Manufacturing',
      },
    );
    await progress.returnForRevision(
      2,
      feedback: 'Add stronger proof.',
    );

    await progress.setNotes(2, 'Revised notes.');
    final current = await progress.submitForReview(
      2,
      evidenceSnapshot: <String, dynamic>{
        'industry': 'Manufacturing',
        'geography': 'United States',
      },
    );

    final package = ReviewPackageBuilder.build(
      appVersion: '0.8.0+8',
      module: courseModules[1],
      submission: current!,
      history: progress.reviewSubmissionsFor(2),
    );

    expect(package.data['format'], 'clientbound-review-package');
    expect(package.data['packageSchemaVersion'], 1);
    expect(package.data['clientboundVersion'], '0.8.0+8');

    final module = package.data['module'] as Map<String, dynamic>;
    expect(module['id'], 2);
    expect(module['title'], 'ICP & Lead Research');
    expect(module['qualityGate'], isNotEmpty);

    final evidence =
        package.data['structuredEvidence'] as Map<String, dynamic>;
    expect(evidence['industry'], 'Manufacturing');
    expect(package.data['scratchNotes'], 'Revised notes.');

    final tasks = package.data['taskCompletion'] as List<dynamic>;
    expect(
      tasks.cast<Map<String, dynamic>>().first['completed'],
      isTrue,
    );

    final previous =
        package.data['previousReviewerFeedback'] as List<dynamic>;
    expect(previous, hasLength(1));
    expect(
      (previous.first as Map<String, dynamic>)['feedback'],
      'Add stronger proof.',
    );

    expect(package.markdown, contains('# Clientbound Review Package'));
    expect(package.markdown, contains('Manufacturing'));
    expect(package.markdown, contains('Add stronger proof.'));
    expect(package.json, contains('"clientbound-review-package"'));
  });

  test('malformed review history recovers without corrupting progress',
      () async {
    SharedPreferences.setMockInitialValues({
      'clientbound_module_stages_v3': '{"2":1}',
      'clientbound_review_submissions_v4': '{bad-json',
    });

    final progress = ProgressStore();
    await progress.load();

    expect(progress.stageFor(2), ModuleStage.inProgress);
    expect(progress.reviewSubmissionsFor(2), isEmpty);
    expect(progress.recoveryWarning, isNotNull);
  });
}
