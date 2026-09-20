import 'package:flutter/material.dart';

import 'course_catalog.dart';
import 'progress_store.dart';

class ReviewPage extends StatelessWidget {
  const ReviewPage({super.key, required this.progress});

  final ProgressStore progress;

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
              'This local workspace models the PASS / REVISE process without any paid backend. A module should reach this queue only when its real deliverable is ready.',
              style: TextStyle(color: Colors.white60, height: 1.45),
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
                    'Nothing is ready for review yet. Complete a module deliverable and mark it Ready for review.',
                    style: TextStyle(color: Colors.white70, height: 1.45),
                  ),
                ),
              )
            else
              for (final module in ready) ...[
                _ReviewCard(module: module, progress: progress),
                const SizedBox(height: 12),
              ],
            if (active.isNotEmpty) ...[
              const SizedBox(height: 16),
              Text(
                'In progress',
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
  const _ReviewCard({required this.module, required this.progress});

  final CourseModule module;
  final ProgressStore progress;

  @override
  Widget build(BuildContext context) {
    final notes = progress.notesFor(module.id);
    final tasks = progress.completedTaskCount(module.id);
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
            const SizedBox(height: 8),
            Text(
              'Tasks: $tasks/${module.taskSteps.length}',
              style: const TextStyle(color: Colors.white54),
            ),
            if (notes.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(
                notes,
                maxLines: 5,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(color: Colors.white70, height: 1.45),
              ),
            ],
            const SizedBox(height: 14),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                FilledButton.icon(
                  onPressed: () => _pass(context),
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

  Future<void> _pass(BuildContext context) async {
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
