import 'course_catalog.dart';
import 'progress_store.dart';
import 'workspace_schema.dart';
import 'workspace_store.dart';

enum HomeModuleStatus {
  notStarted,
  working,
  readyToSubmit,
  awaitingDecision,
  revise,
  passed,
  courseComplete,
}

extension HomeModuleStatusLabel on HomeModuleStatus {
  String get label => switch (this) {
        HomeModuleStatus.notStarted => 'NOT STARTED',
        HomeModuleStatus.working => 'WORKING',
        HomeModuleStatus.readyToSubmit => 'READY TO SUBMIT',
        HomeModuleStatus.awaitingDecision => 'AWAITING REVIEW',
        HomeModuleStatus.revise => 'REVISE',
        HomeModuleStatus.passed => 'PASS',
        HomeModuleStatus.courseComplete => 'CYCLE COMPLETE',
      };
}

class HomeDashboardModel {
  const HomeDashboardModel({
    required this.currentModule,
    required this.status,
    required this.nextAction,
    required this.progressLabel,
    required this.reviewerFeedback,
    required this.recentActivity,
    required this.pathModuleIds,
    required this.milestones,
    required this.workspaceReady,
    required this.completedTasks,
    required this.totalTasks,
  });

  final CourseModule currentModule;
  final HomeModuleStatus status;
  final String nextAction;
  final String progressLabel;
  final String reviewerFeedback;
  final String recentActivity;
  final List<int> pathModuleIds;
  final List<String> milestones;
  final bool workspaceReady;
  final int completedTasks;
  final int totalTasks;

  bool get courseComplete => status == HomeModuleStatus.courseComplete;

  factory HomeDashboardModel.build(
    ProgressStore progress,
    WorkspaceStore workspace,
  ) {
    final allPassed = progress.passedCount == courseModules.length;
    final moduleId = allPassed ? courseModules.last.id : progress.nextModuleId;
    final module = courseModules[moduleId - 1];
    final status = allPassed
        ? HomeModuleStatus.courseComplete
        : statusForModule(progress, workspace, moduleId);
    final issues = workspace.readinessIssues(moduleId);
    final workspaceReady = issues.isEmpty;
    final completedTasks = progress.completedTaskCount(moduleId);
    final totalTasks = module.taskSteps.length;
    final latest = progress.latestReviewSubmissionFor(moduleId);
    final feedback = latest?.reviewerFeedback.trim().isNotEmpty == true
        ? latest!.reviewerFeedback.trim()
        : progress.feedbackFor(moduleId).trim();

    return HomeDashboardModel(
      currentModule: module,
      status: status,
      nextAction: _nextAction(
        status: status,
        module: module,
        issues: issues,
        progress: progress,
        feedback: feedback,
      ),
      progressLabel: _progressLabel(
        moduleId: moduleId,
        progress: progress,
        workspace: workspace,
      ),
      reviewerFeedback: feedback,
      recentActivity: _recentActivity(progress),
      pathModuleIds: _path(moduleId),
      milestones: _milestones(progress),
      workspaceReady: workspaceReady,
      completedTasks: completedTasks,
      totalTasks: totalTasks,
    );
  }

  static HomeModuleStatus statusForModule(
    ProgressStore progress,
    WorkspaceStore workspace,
    int moduleId,
  ) {
    final stage = progress.stageFor(moduleId);
    if (stage == ModuleStage.passed) return HomeModuleStatus.passed;

    final latest = progress.latestReviewSubmissionFor(moduleId);
    if (latest != null) {
      if (latest.decision == ReviewDecision.pending &&
          stage == ModuleStage.readyForReview) {
        return HomeModuleStatus.awaitingDecision;
      }
      if (latest.decision == ReviewDecision.revise &&
          stage == ModuleStage.inProgress) {
        return HomeModuleStatus.revise;
      }
      if (latest.decision == ReviewDecision.pass) {
        return HomeModuleStatus.passed;
      }
    }

    if (stage == ModuleStage.notStarted) {
      return HomeModuleStatus.notStarted;
    }

    if (workspace.isReadyForReview(moduleId)) {
      return HomeModuleStatus.readyToSubmit;
    }

    return HomeModuleStatus.working;
  }

  static String _nextAction({
    required HomeModuleStatus status,
    required CourseModule module,
    required List<String> issues,
    required ProgressStore progress,
    required String feedback,
  }) {
    switch (status) {
      case HomeModuleStatus.courseComplete:
        return 'Review the full cycle, keep what worked, and prepare the next evidence-producing acquisition cycle.';
      case HomeModuleStatus.awaitingDecision:
        return 'Your submission is locked for review. Await PASS or REVISE, or use Review Exchange for a trusted cross-device handoff.';
      case HomeModuleStatus.revise:
        return feedback.isEmpty
            ? 'Revise the current deliverable using reviewer feedback, then submit a new revision.'
            : 'Address reviewer feedback: $feedback';
      case HomeModuleStatus.readyToSubmit:
        return 'Your required structured evidence is complete. Check the module deliverable, then submit it for review.';
      case HomeModuleStatus.passed:
        return 'This module passed. Continue to the next unfinished module.';
      case HomeModuleStatus.notStarted:
      case HomeModuleStatus.working:
        if (issues.isNotEmpty) {
          return _friendlyIssue(issues.first);
        }
        for (var i = 0; i < module.taskSteps.length; i++) {
          if (!progress.taskDone(module.id, i)) {
            return 'Next task: ${module.taskSteps[i]}';
          }
        }
        return 'Review the deliverable and quality gate, then submit the module for review.';
    }
  }

  static String _friendlyIssue(String issue) {
    final normalized = issue.trim();
    if (normalized.endsWith(': required.')) {
      return 'Complete ${normalized.substring(0, normalized.length - 11)}.';
    }
    if (normalized.contains(': add at least ')) {
      final parts = normalized.split(': ');
      return 'Continue ${parts.first.toLowerCase()}: ${parts.skip(1).join(': ')}';
    }
    return 'Complete the next evidence requirement: $normalized';
  }

  static String _progressLabel({
    required int moduleId,
    required ProgressStore progress,
    required WorkspaceStore workspace,
  }) {
    final definition = moduleWorkspaceDefinitions[moduleId];
    if (definition != null) {
      WorkspaceFieldDefinition? focusTable;
      for (final field in definition.fields) {
        if (!field.required ||
            field.type != WorkspaceFieldType.table ||
            (field.expectedRows ?? 0) <= 1) {
          continue;
        }
        if (focusTable == null ||
            (field.expectedRows ?? 0) > (focusTable.expectedRows ?? 0)) {
          focusTable = field;
        }
      }

      if (focusTable != null) {
        final expected = focusTable.expectedRows!;
        final rows = workspace.tableValue(moduleId, focusTable.key);
        var complete = 0;
        for (final row in rows.take(expected)) {
          final rowComplete = focusTable.columns
              .where((column) => column.required)
              .every(
                (column) => (row[column.key] ?? '').trim().isNotEmpty,
              );
          if (rowComplete) complete++;
        }
        return '$complete of $expected ${focusTable.label.toLowerCase()} rows complete';
      }
    }

    final total = courseModules[moduleId - 1].taskSteps.length;
    final complete = progress.completedTaskCount(moduleId).clamp(0, total);
    return '$complete of $total module tasks checked';
  }

  static String _recentActivity(ProgressStore progress) {
    final recent = progress.recentlyTouchedModuleIds;
    if (recent.isEmpty) return 'No module activity yet.';
    final id = recent.first;
    final module = courseModules[id - 1];
    return 'Module $id · ${module.title} · ${progress.stageFor(id).label}';
  }

  static List<int> _path(int currentModuleId) {
    final ids = <int>[];
    if (currentModuleId > 1) ids.add(currentModuleId - 1);
    ids.add(currentModuleId);
    if (currentModuleId < courseModules.length) ids.add(currentModuleId + 1);
    return ids;
  }

  static List<String> _milestones(ProgressStore progress) {
    final items = <String>[];
    if (progress.passedCount >= 1) {
      items.add('First module passed');
    }
    if (progress.isCompleted(2)) {
      items.add('10-lead research gate passed');
    }
    if (progress.isCompleted(6)) {
      items.add('First live-outreach module passed');
    }
    if (progress.isCompleted(12)) {
      items.add('Discovery-preparation module passed');
    }
    if (progress.isCompleted(13)) {
      items.add('Paid-pilot conversion module passed');
    }
    if (progress.isCompleted(14)) {
      items.add('First acquisition cycle completed');
    }
    return items;
  }
}
