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

  test('stores module stage and local notes', () async {
    SharedPreferences.setMockInitialValues({});

    final store = ProgressStore();
    await store.load();
    await store.setStage(4, ModuleStage.readyForReview);
    await store.setNotes(4, 'Proof package needs a cleaner voice sample.');

    expect(store.stageFor(4), ModuleStage.readyForReview);
    expect(store.notesFor(4), contains('voice sample'));
    expect(store.activeCount, 1);
  });
}
