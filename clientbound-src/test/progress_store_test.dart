import 'package:clientbound/progress_store.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  test('migrates V0.1 completed modules into PASS stage', () async {
    SharedPreferences.setMockInitialValues({
      'fcss_completed_modules_v1': ['1', '2'],
    });

    final store = ProgressStore();
    await store.load();

    expect(store.stageFor(1), ModuleStage.passed);
    expect(store.stageFor(2), ModuleStage.passed);
    expect(store.passedCount, 2);
    expect(store.nextModuleId, 3);
  });

  test('migrates V0.2 stage and notes into V0.3 model', () async {
    SharedPreferences.setMockInitialValues({
      'clientbound_module_stages_v2': '{"3":1}',
      'clientbound_module_notes_v2': '{"3":"Draft outreach"}',
    });

    final store = ProgressStore();
    await store.load();

    expect(store.stageFor(3), ModuleStage.inProgress);
    expect(store.notesFor(3), 'Draft outreach');
  });

  test('tracks tasks, notes, review and revision locally', () async {
    SharedPreferences.setMockInitialValues({});

    final store = ProgressStore();
    await store.load();
    await store.toggleTask(4, 0);
    await store.setNotes(4, 'Proof package needs a cleaner voice sample.');
    await store.setStage(4, ModuleStage.readyForReview);

    expect(store.taskDone(4, 0), isTrue);
    expect(store.completedTaskCount(4), 1);
    expect(store.stageFor(4), ModuleStage.readyForReview);
    expect(store.readyForReviewCount, 1);

    await store.returnForRevision(
      4,
      feedback: 'Make the voice sample more conversational.',
    );

    expect(store.stageFor(4), ModuleStage.inProgress);
    expect(store.feedbackFor(4), contains('conversational'));

    await store.recordPass(4, feedback: 'Usable in a real application.');

    expect(store.stageFor(4), ModuleStage.passed);
    expect(store.passedCount, 1);
    expect(store.feedbackFor(4), contains('real application'));
  });
}
