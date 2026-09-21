import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:clientbound/home_dashboard_model.dart';
import 'package:clientbound/progress_store.dart';
import 'package:clientbound/workspace_schema.dart';
import 'package:clientbound/workspace_store.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues(<String, Object>{});
  });

  test('fresh learner sees Module 1 and a concrete evidence action', () async {
    final progress = ProgressStore();
    final workspace = WorkspaceStore();
    await progress.load();
    await workspace.load();

    final model = HomeDashboardModel.build(progress, workspace);

    expect(model.currentModule.id, 1);
    expect(model.status, HomeModuleStatus.notStarted);
    expect(model.nextAction, contains('Target niche'));
    expect(model.pathModuleIds, <int>[1, 2]);
  });

  test('in-progress Module 2 reports completed lead rows', () async {
    final progress = ProgressStore();
    final workspace = WorkspaceStore();
    await progress.load();
    await workspace.load();

    await progress.recordPass(1);
    await progress.setStage(2, ModuleStage.inProgress);
    _fillModule2Header(workspace);
    _fillModule2Rows(workspace, completeRows: 6);

    final model = HomeDashboardModel.build(progress, workspace);

    expect(model.currentModule.id, 2);
    expect(model.status, HomeModuleStatus.working);
    expect(model.progressLabel, '6 of 10 10-lead four-proof audit rows complete');
    expect(model.nextAction, contains('row 7'));
    expect(model.milestones, contains('First module passed'));
  });

  test('review-ready evidence becomes ready to submit', () async {
    final progress = ProgressStore();
    final workspace = WorkspaceStore();
    await progress.load();
    await workspace.load();

    await progress.recordPass(1);
    await progress.setStage(2, ModuleStage.inProgress);
    _fillModule2Header(workspace);
    _fillModule2Rows(workspace, completeRows: 10);

    final model = HomeDashboardModel.build(progress, workspace);

    expect(model.status, HomeModuleStatus.readyToSubmit);
    expect(model.workspaceReady, isTrue);
    expect(model.nextAction, contains('submit it for review'));
  });

  test('submitted Module 2 is shown as awaiting review', () async {
    final progress = ProgressStore();
    final workspace = WorkspaceStore();
    await progress.load();
    await workspace.load();

    await progress.recordPass(1);
    await progress.setStage(2, ModuleStage.inProgress);
    _fillModule2Header(workspace);
    _fillModule2Rows(workspace, completeRows: 10);
    await progress.submitForReview(
      2,
      evidenceSnapshot: workspace.snapshotForModule(2),
    );

    final model = HomeDashboardModel.build(progress, workspace);

    expect(model.status, HomeModuleStatus.awaitingDecision);
    expect(model.nextAction, contains('submission is locked for review'));
  });

  test('REVISE surfaces reviewer feedback as the next action', () async {
    final progress = ProgressStore();
    final workspace = WorkspaceStore();
    await progress.load();
    await workspace.load();

    await progress.recordPass(1);
    await progress.setStage(2, ModuleStage.inProgress);
    _fillModule2Header(workspace);
    _fillModule2Rows(workspace, completeRows: 10);
    await progress.submitForReview(
      2,
      evidenceSnapshot: workspace.snapshotForModule(2),
    );
    await progress.returnForRevision(
      2,
      feedback: 'Replace the unresolved tenth lead.',
    );

    final model = HomeDashboardModel.build(progress, workspace);

    expect(model.status, HomeModuleStatus.revise);
    expect(model.reviewerFeedback, 'Replace the unresolved tenth lead.');
    expect(model.nextAction, contains('Replace the unresolved tenth lead.'));
  });

  test('PASS status derives from actual review state', () async {
    final progress = ProgressStore();
    final workspace = WorkspaceStore();
    await progress.load();
    await workspace.load();

    await progress.recordPass(2, feedback: 'Evidence accepted.');

    expect(
      HomeDashboardModel.statusForModule(progress, workspace, 2),
      HomeModuleStatus.passed,
    );
  });

  test('all 14 PASS modules produce cycle-complete Home state', () async {
    final progress = ProgressStore();
    final workspace = WorkspaceStore();
    await progress.load();
    await workspace.load();

    for (var moduleId = 1; moduleId <= 14; moduleId++) {
      await progress.recordPass(moduleId);
    }

    final model = HomeDashboardModel.build(progress, workspace);

    expect(model.status, HomeModuleStatus.courseComplete);
    expect(model.currentModule.id, 14);
    expect(model.milestones, contains('First acquisition cycle completed'));
  });
}

void _fillModule2Header(WorkspaceStore workspace) {
  workspace.setString(2, 'industry', 'Midwest manufacturing');
  workspace.setString(2, 'geography', 'US Midwest');
  workspace.setString(2, 'targetRoles', 'Operations managers');
}

void _fillModule2Rows(
  WorkspaceStore workspace, {
  required int completeRows,
}) {
  final field = moduleWorkspaceDefinitions[2]!
      .fields
      .firstWhere((item) => item.key == 'leadResearch');
  final columns = field.columns.map((column) => column.key).toList();
  workspace.ensureTableRows(2, field.key, columns, 10);

  for (var row = 0; row < completeRows; row++) {
    for (final column in columns) {
      workspace.setTableCell(
        2,
        field.key,
        row,
        column,
        'evidence-$row-$column',
      );
    }
  }
}
