import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'course_catalog.dart';
import 'progress_store.dart';
import 'review_exchange_page.dart';
import 'review_exchange_store.dart';
import 'review_package.dart';
import 'workspace_store.dart';

class ReviewPage extends StatelessWidget {
  const ReviewPage({
    super.key,
    required this.progress,
    required this.workspace,
    required this.reviewExchange,
    required this.appVersion,
  });

  final ProgressStore progress;
  final WorkspaceStore workspace;
  final ReviewExchangeStore reviewExchange;
  final String appVersion;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: progress,
      builder: (context, _) {
        final ready = courseModules
            .where(
              (module) =>
                  progress.stageFor(module.id) == ModuleStage.readyForReview,
            )
            .toList();
        final active = courseModules
            .where(
              (module) =>
                  progress.stageFor(module.id) == ModuleStage.inProgress,
            )
            .toList();

        return ListView(
          padding: const EdgeInsets.all(22),
          children: [
            Text(
              'REVIEW',
              style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    color: Theme.of(context).colorScheme.primary,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.2,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              'Instructor review queue',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.w900,
                  ),
            ),
            const SizedBox(height: 8),
            const Text(
              'This is the local reviewer boundary for PASS / REVISE decisions. It does not claim secure multi-user authorization; it keeps learner submission and reviewer decisions separate without a paid backend.',
              style: TextStyle(color: Colors.white60, height: 1.45),
            ),
            const SizedBox(height: 14),
            Align(
              alignment: Alignment.centerLeft,
              child: OutlinedButton.icon(
                onPressed: () => Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => ReviewExchangePage(
                      progress: progress,
                      store: reviewExchange,
                    ),
                  ),
                ),
                icon: const Icon(Icons.swap_horiz_rounded),
                label: const Text('Open Review Exchange'),
              ),
            ),
            const SizedBox(height: 20),
            _SummaryCard(
              ready: ready.length,
              active: active.length,
              passed: progress.passedCount,
            ),
            const SizedBox(height: 20),
            if (ready.isEmpty)
              const Card(
                child: Padding(
                  padding: EdgeInsets.all(20),
                  child: Text(
                    'Nothing is ready for review yet. Complete a module deliverable and submit it from the Classroom.',
                    style: TextStyle(color: Colors.white70, height: 1.45),
                  ),
                ),
              )
            else
              for (final module in ready) ...[
                _ReviewCard(
                  module: module,
                  progress: progress,
                  workspace: workspace,
                  appVersion: appVersion,
                ),
                const SizedBox(height: 12),
              ],
            if (active.isNotEmpty) ...[
              const SizedBox(height: 16),
              Text(
                'In progress / returned for revision',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w900,
                    ),
              ),
              const SizedBox(height: 10),
              for (final module in active)
                Card(
                  child: ListTile(
                    title: Text(
                      'Module ${module.id} · ${module.title}',
                      style: const TextStyle(fontWeight: FontWeight.w800),
                    ),
                    subtitle: Text(
                      progress.feedbackFor(module.id).isEmpty
                          ? 'No review feedback yet.'
                          : progress.feedbackFor(module.id),
                    ),
                    trailing: Text(
                      '${progress.completedTaskCount(module.id)}/${module.taskSteps.length}',
                    ),
                  ),
                ),
            ],
          ],
        );
      },
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({
    required this.ready,
    required this.active,
    required this.passed,
  });

  final int ready;
  final int active;
  final int passed;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Wrap(
          spacing: 24,
          runSpacing: 14,
          children: [
            _Metric(label: 'Ready', value: ready),
            _Metric(label: 'Active', value: active),
            _Metric(label: 'Passed', value: passed),
          ],
        ),
      ),
    );
  }
}

class _Metric extends StatelessWidget {
  const _Metric({required this.label, required this.value});

  final String label;
  final int value;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 100,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '$value',
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w900,
            ),
          ),
          Text(label, style: const TextStyle(color: Colors.white54)),
        ],
      ),
    );
  }
}

class _ReviewCard extends StatelessWidget {
  const _ReviewCard({
    required this.module,
    required this.progress,
    required this.workspace,
    required this.appVersion,
  });

  final CourseModule module;
  final ProgressStore progress;
  final WorkspaceStore workspace;
  final String appVersion;

  @override
  Widget build(BuildContext context) {
    final history = progress.reviewSubmissionsFor(module.id);
    final submission = progress.latestReviewSubmissionFor(module.id);
    final evidence = submission?.evidenceSnapshot ??
        workspace.snapshotForModule(module.id);
    final complete = submission != null
        ? true
        : workspace.readinessIssues(module.id).isEmpty;
    final previousFeedback = history
        .where((item) => item.reviewerFeedback.trim().isNotEmpty)
        .toList();
    final evidenceSummary = _evidenceSummary(evidence);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'MODULE ${module.id}',
              style: TextStyle(
                color: Theme.of(context).colorScheme.primary,
                fontWeight: FontWeight.w900,
                fontSize: 11,
                letterSpacing: 1,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              module.title,
              style: const TextStyle(
                fontSize: 19,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 10,
              runSpacing: 8,
              children: [
                _ReviewChip(
                  icon: Icons.history_rounded,
                  label: submission == null
                      ? 'Legacy ready state'
                      : 'Revision ${submission.revision}',
                ),
                _ReviewChip(
                  icon: complete
                      ? Icons.verified_outlined
                      : Icons.error_outline_rounded,
                  label: complete ? 'Complete' : 'Incomplete',
                ),
                _ReviewChip(
                  icon: Icons.task_alt_outlined,
                  label:
                      '${progress.completedTaskCount(module.id)}/${module.taskSteps.length} tasks',
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              submission == null
                  ? 'Submission time: legacy V0.6 state — the current local evidence will be snapshotted before a reviewer decision.'
                  : 'Submitted: ${submission.submittedAt.toLocal().toIso8601String()}',
              style: const TextStyle(color: Colors.white54),
            ),
            const SizedBox(height: 10),
            Text(
              'Evidence: $evidenceSummary',
              style: const TextStyle(color: Colors.white70),
            ),
            const SizedBox(height: 14),
            const Text(
              'Quality gate',
              style: TextStyle(fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 5),
            Text(
              module.passGate,
              style: const TextStyle(color: Colors.white70, height: 1.45),
            ),
            if (previousFeedback.isNotEmpty) ...[
              const SizedBox(height: 14),
              const Text(
                'Previous feedback',
                style: TextStyle(fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 5),
              Text(
                previousFeedback.last.reviewerFeedback,
                style: const TextStyle(color: Colors.white70, height: 1.45),
              ),
            ],
            if (!complete) ...[
              const SizedBox(height: 14),
              Text(
                'This legacy queue item is no longer complete in the current workspace. Return to the Classroom and resubmit before PASS.',
                style: TextStyle(
                  color: Theme.of(context).colorScheme.error,
                  height: 1.45,
                ),
              ),
            ],
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                OutlinedButton.icon(
                  onPressed: () => _copyPackage(
                    context,
                    asJson: false,
                  ),
                  icon: const Icon(Icons.copy_all_rounded),
                  label: const Text('Copy Review Package'),
                ),
                OutlinedButton.icon(
                  onPressed: () => _copyPackage(
                    context,
                    asJson: true,
                  ),
                  icon: const Icon(Icons.data_object_rounded),
                  label: const Text('Copy JSON'),
                ),
                FilledButton.icon(
                  onPressed: complete ? () => _pass(context) : null,
                  icon: const Icon(Icons.check_circle_outline),
                  label: const Text('PASS'),
                ),
                OutlinedButton.icon(
                  onPressed: () => _revise(context),
                  icon: const Icon(Icons.replay_rounded),
                  label: const Text('REVISE'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _evidenceSummary(Map<String, dynamic> evidence) {
    if (evidence.isEmpty) return 'no structured snapshot';
    var textFields = 0;
    var tableRows = 0;
    for (final value in evidence.values) {
      if (value is String && value.trim().isNotEmpty) {
        textFields++;
      } else if (value is List) {
        tableRows += value.length;
      }
    }
    return '$textFields text field(s), $tableRows table row(s)';
  }

  ReviewSubmission _packageSubmission() {
    final existing = progress.latestReviewSubmissionFor(module.id);
    if (existing != null) return existing;

    final now = DateTime.now().toUtc().millisecondsSinceEpoch;
    final completed = <int>[
      for (var i = 0; i < module.taskSteps.length; i++)
        if (progress.taskDone(module.id, i)) i,
    ];

    return ReviewSubmission(
      id: 'legacy-preview-module-${module.id}-$now',
      moduleId: module.id,
      submittedAtMs: now,
      revision: progress.reviewSubmissionsFor(module.id).length + 1,
      evidenceSnapshot: workspace.snapshotForModule(module.id),
      learnerNotesSnapshot: progress.notesFor(module.id),
      completedTaskIndexes: completed,
    );
  }

  ReviewPackage _package() {
    final history = progress.reviewSubmissionsFor(module.id);
    return ReviewPackageBuilder.build(
      appVersion: appVersion,
      module: module,
      submission: _packageSubmission(),
      history: history,
    );
  }

  Future<void> _copyPackage(
    BuildContext context, {
    required bool asJson,
  }) async {
    final package = _package();
    await Clipboard.setData(
      ClipboardData(text: asJson ? package.json : package.markdown),
    );
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          asJson
              ? 'Review package JSON copied.'
              : 'Review package Markdown copied.',
        ),
      ),
    );
  }

  Future<void> _ensureAuditableSubmission() async {
    if (progress.latestReviewSubmissionFor(module.id) != null) return;
    await progress.submitForReview(
      module.id,
      evidenceSnapshot: workspace.snapshotForModule(module.id),
    );
  }

  Future<void> _pass(BuildContext context) async {
    await _ensureAuditableSubmission();
    if (!context.mounted) return;

    final controller = TextEditingController();
    final accepted = await _feedbackDialog(
      context,
      title: 'Pass Module ${module.id}',
      controller: controller,
      hint: 'Optional instructor feedback...',
      action: 'Record PASS',
    );
    if (accepted == true) {
      await progress.recordPass(module.id, feedback: controller.text);
    }
    controller.dispose();
  }

  Future<void> _revise(BuildContext context) async {
    await _ensureAuditableSubmission();
    if (!context.mounted) return;

    final controller = TextEditingController(
      text: progress.feedbackFor(module.id),
    );
    final accepted = await _feedbackDialog(
      context,
      title: 'Return Module ${module.id} for revision',
      controller: controller,
      hint: 'State the single biggest weakness and required correction.',
      action: 'Return for revision',
    );
    if (accepted == true) {
      await progress.returnForRevision(
        module.id,
        feedback: controller.text,
      );
    }
    controller.dispose();
  }

  Future<bool?> _feedbackDialog(
    BuildContext context, {
    required String title,
    required TextEditingController controller,
    required String hint,
    required String action,
  }) {
    return showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: TextField(
          controller: controller,
          minLines: 3,
          maxLines: 7,
          decoration: InputDecoration(hintText: hint),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(action),
          ),
        ],
      ),
    );
  }
}

class _ReviewChip extends StatelessWidget {
  const _ReviewChip({
    required this.icon,
    required this.label,
  });

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: .06),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: Colors.white12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 15, color: Colors.white60),
          const SizedBox(width: 6),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 12,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}
