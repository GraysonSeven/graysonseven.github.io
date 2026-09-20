import 'package:clientbound/app_settings_store.dart';
import 'package:clientbound/backup_service.dart';
import 'package:clientbound/community_store.dart';
import 'package:clientbound/progress_store.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  test('backup round trip restores local Clientbound state', () async {
    SharedPreferences.setMockInitialValues({});

    final progress = ProgressStore();
    final community = CommunityStore();
    final settings = AppSettingsStore();

    await progress.load();
    await community.load();
    await settings.load();

    await progress.setStage(2, ModuleStage.inProgress);
    await progress.toggleTask(2, 0);
    await progress.setNotes(2, 'Lead research evidence');
    await community.addPost(
      category: 'Practice',
      title: 'Research check',
      body: 'Verify all four proof types.',
    );
    await settings.completeOnboarding();

    final backup = BackupService(
      progress: progress,
      community: community,
      settings: settings,
      appVersion: '0.4.0+4',
    );

    final json = backup.createBackupJson();

    await progress.reset();
    await community.resetToSeed();
    await settings.restartOnboarding();

    await backup.restoreBackupJson(json);

    expect(progress.stageFor(2), ModuleStage.inProgress);
    expect(progress.taskDone(2, 0), isTrue);
    expect(progress.notesFor(2), 'Lead research evidence');
    expect(
      community.posts.any((post) => post.title == 'Research check'),
      isTrue,
    );
    expect(settings.onboardingComplete, isTrue);
  });

  test('backup rejects non-Clientbound payloads without mutation', () async {
    SharedPreferences.setMockInitialValues({});

    final progress = ProgressStore();
    final community = CommunityStore();
    final settings = AppSettingsStore();
    await progress.load();
    await community.load();
    await settings.load();

    await progress.setNotes(1, 'Keep me');

    final backup = BackupService(
      progress: progress,
      community: community,
      settings: settings,
      appVersion: '0.4.0+4',
    );

    await expectLater(
      backup.restoreBackupJson('{"format":"other"}'),
      throwsA(isA<FormatException>()),
    );
    expect(progress.notesFor(1), 'Keep me');
  });
}
