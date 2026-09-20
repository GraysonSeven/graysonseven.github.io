import 'dart:convert';

import 'package:clientbound/app_settings_store.dart';
import 'package:clientbound/backup_service.dart';
import 'package:clientbound/community_store.dart';
import 'package:clientbound/progress_store.dart';
import 'package:clientbound/workspace_store.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  test('schema 2 backup round trip restores structured workspace', () async {
    SharedPreferences.setMockInitialValues({});

    final progress = ProgressStore();
    final community = CommunityStore();
    final settings = AppSettingsStore();
    final workspace = WorkspaceStore();

    await progress.load();
    await community.load();
    await settings.load();
    await workspace.load();

    await progress.setStage(2, ModuleStage.inProgress);
    await progress.toggleTask(2, 0);
    await progress.setNotes(2, 'Lead research evidence');
    workspace.setString(2, 'industry', 'Manufacturing');
    workspace.addTableRow(
      2,
      'leadResearch',
      const <String>['company', 'reasonProof'],
    );
    workspace.setTableCell(
      2,
      'leadResearch',
      0,
      'company',
      'Nolte Precise Manufacturing',
    );
    workspace.setTableCell(
      2,
      'leadResearch',
      0,
      'reasonProof',
      'Uses precision manufacturing services.',
    );
    await workspace.flush();

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
      workspace: workspace,
      appVersion: '0.7.0+7',
    );

    final json = backup.createBackupJson();
    final decoded = jsonDecode(json) as Map<String, dynamic>;
    expect(decoded['schemaVersion'], 2);

    await progress.reset();
    await workspace.reset();
    await community.resetToSeed();
    await settings.restartOnboarding();

    await backup.restoreBackupJson(json);

    expect(progress.stageFor(2), ModuleStage.inProgress);
    expect(progress.taskDone(2, 0), isTrue);
    expect(progress.notesFor(2), 'Lead research evidence');
    expect(workspace.stringValue(2, 'industry'), 'Manufacturing');
    expect(
      workspace.tableValue(2, 'leadResearch').single['company'],
      'Nolte Precise Manufacturing',
    );
    expect(
      community.posts.any((post) => post.title == 'Research check'),
      isTrue,
    );
    expect(settings.onboardingComplete, isTrue);
  });

  test('V0.4 schema 1 backup remains restorable', () async {
    SharedPreferences.setMockInitialValues({});

    final progress = ProgressStore();
    final community = CommunityStore();
    final settings = AppSettingsStore();
    final workspace = WorkspaceStore();
    await progress.load();
    await community.load();
    await settings.load();
    await workspace.load();

    workspace.setString(1, 'niche', 'Will be replaced');
    await workspace.flush();

    final backup = BackupService(
      progress: progress,
      community: community,
      settings: settings,
      workspace: workspace,
      appVersion: '0.7.0+7',
    );

    final legacy = jsonEncode(<String, dynamic>{
      'format': 'clientbound-backup',
      'schemaVersion': 1,
      'appVersion': '0.4.0+4',
      'exportedAt': '2026-09-20T00:00:00Z',
      'progress': progress.exportData(),
      'community': community.exportData(),
      'settings': settings.exportData(),
    });

    await backup.restoreBackupJson(legacy);

    expect(workspace.stringValue(1, 'niche'), isEmpty);
  });

  test('backup rejects non-Clientbound payloads without mutation', () async {
    SharedPreferences.setMockInitialValues({});

    final progress = ProgressStore();
    final community = CommunityStore();
    final settings = AppSettingsStore();
    final workspace = WorkspaceStore();
    await progress.load();
    await community.load();
    await settings.load();
    await workspace.load();

    await progress.setNotes(1, 'Keep me');
    workspace.setString(1, 'niche', 'Keep this too');

    final backup = BackupService(
      progress: progress,
      community: community,
      settings: settings,
      workspace: workspace,
      appVersion: '0.7.0+7',
    );

    await expectLater(
      backup.restoreBackupJson('{"format":"other"}'),
      throwsA(isA<FormatException>()),
    );
    expect(progress.notesFor(1), 'Keep me');
    expect(workspace.stringValue(1, 'niche'), 'Keep this too');
  });

  test('schema 2 backup preserves review submission history', () async {
    SharedPreferences.setMockInitialValues({});

    final progress = ProgressStore();
    final community = CommunityStore();
    final settings = AppSettingsStore();
    final workspace = WorkspaceStore();
    await progress.load();
    await community.load();
    await settings.load();
    await workspace.load();

    await progress.setNotes(3, 'Outreach system review notes.');
    await progress.toggleTask(3, 0);
    await progress.submitForReview(
      3,
      evidenceSnapshot: <String, dynamic>{
        'coldEmail': 'Short truthful first-touch email.',
      },
    );
    await progress.returnForRevision(
      3,
      feedback: 'Make the CTA lower-friction.',
    );

    final backup = BackupService(
      progress: progress,
      community: community,
      settings: settings,
      workspace: workspace,
      appVersion: '0.7.0+7',
    );
    final json = backup.createBackupJson();

    await progress.reset();
    expect(progress.reviewSubmissionsFor(3), isEmpty);

    await backup.restoreBackupJson(json);

    final history = progress.reviewSubmissionsFor(3);
    expect(history, hasLength(1));
    expect(history.single.decision, ReviewDecision.revise);
    expect(history.single.reviewerFeedback, 'Make the CTA lower-friction.');
    expect(history.single.learnerNotesSnapshot, contains('review notes'));
    expect(history.single.completedTaskIndexes, <int>[0]);
  });

  test('V0.6 schema 2 backup without review history remains restorable',
      () async {
    SharedPreferences.setMockInitialValues({});

    final progress = ProgressStore();
    final community = CommunityStore();
    final settings = AppSettingsStore();
    final workspace = WorkspaceStore();
    await progress.load();
    await community.load();
    await settings.load();
    await workspace.load();

    final legacyProgress =
        Map<String, dynamic>.from(progress.exportData())
          ..remove('reviewSubmissions');

    final backup = BackupService(
      progress: progress,
      community: community,
      settings: settings,
      workspace: workspace,
      appVersion: '0.7.0+7',
    );

    final legacy = jsonEncode(<String, dynamic>{
      'format': 'clientbound-backup',
      'schemaVersion': 2,
      'appVersion': '0.6.0+6',
      'exportedAt': '2026-09-20T00:00:00Z',
      'progress': legacyProgress,
      'community': community.exportData(),
      'settings': settings.exportData(),
      'workspace': workspace.exportData(),
    });

    await backup.restoreBackupJson(legacy);

    expect(progress.reviewSubmissionsFor(1), isEmpty);
    expect(progress.recoveryWarning, isNull);
  });

}
