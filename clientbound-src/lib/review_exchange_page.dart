import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'progress_store.dart';
import 'review_exchange.dart';
import 'review_exchange_file_service.dart';
import 'review_exchange_store.dart';

class ReviewExchangePage extends StatelessWidget {
  const ReviewExchangePage({
    super.key,
    required this.progress,
    required this.store,
  });

  final ProgressStore progress;
  final ReviewExchangeStore store;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: Listenable.merge(<Listenable>[progress, store]),
      builder: (context, _) => Scaffold(
        appBar: AppBar(title: const Text('Review Exchange')),
        body: ListView(
          padding: const EdgeInsets.all(22),
          children: [
            Text(
              'OFFLINE REVIEW HANDOFF',
              style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    color: Theme.of(context).colorScheme.primary,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.2,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              'Move review decisions between devices without accounts.',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.w900,
                  ),
            ),
            const SizedBox(height: 10),
            const Text(
              'Exchange files are trust-based local JSON. Clientbound verifies package structure and exact submission identity, but it does not authenticate who created a decision.',
              style: TextStyle(color: Colors.white60, height: 1.45),
            ),
            const SizedBox(height: 18),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                FilledButton.icon(
                  onPressed: () => _importLearnerPackageFile(context),
                  icon: const Icon(Icons.file_open_outlined),
                  label: const Text('Import package file'),
                ),
                OutlinedButton.icon(
                  onPressed: () => _importDecisionFile(context),
                  icon: const Icon(Icons.file_open_outlined),
                  label: const Text('Import decision file'),
                ),
                TextButton.icon(
                  onPressed: () => _importLearnerPackage(context),
                  icon: const Icon(Icons.content_paste_rounded),
                  label: const Text('Paste package JSON'),
                ),
                TextButton.icon(
                  onPressed: () => _importDecision(context),
                  icon: const Icon(Icons.content_paste_go_rounded),
                  label: const Text('Paste decision JSON'),
                ),
              ],
            ),
            const SizedBox(height: 24),
            Text(
              'Instructor inbox',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w900,
                  ),
            ),
            const SizedBox(height: 10),
            if (store.records.isEmpty)
              const Card(
                child: Padding(
                  padding: EdgeInsets.all(18),
                  child: Text(
                    'No imported learner packages yet. Import a Clientbound review JSON file or paste the package JSON.',
                    style: TextStyle(color: Colors.white70, height: 1.45),
                  ),
                ),
              )
            else
              for (final record in store.records) ...[
                _ImportedReviewCard(
                  record: record,
                  store: store,
                ),
                const SizedBox(height: 12),
              ],
          ],
        ),
      ),
    );
  }

  Future<void> _importLearnerPackageFile(BuildContext context) async {
    try {
      final raw = await ReviewExchangeFileService.pickJsonText(
        dialogTitle: 'Choose learner review package',
      );
      if (raw == null) return;
      final package = await store.importReviewPackage(raw);
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Imported Module ${package.moduleId}, revision ${package.revision} from file.',
          ),
        ),
      );
    } catch (error) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Review package file rejected: $error')),
      );
    }
  }

  Future<void> _importDecisionFile(BuildContext context) async {
    try {
      final raw = await ReviewExchangeFileService.pickJsonText(
        dialogTitle: 'Choose reviewer decision',
      );
      if (raw == null) return;
      final decision = ReviewDecisionPackage.parse(raw);
      await progress.applyExternalReviewDecision(decision);
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Module ${decision.moduleId} revision ${decision.revision}: ${decision.decision.label}.',
          ),
        ),
      );
    } catch (error) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Review decision file rejected: $error')),
      );
    }
  }

  Future<void> _importLearnerPackage(BuildContext context) async {
    final raw = await _jsonDialog(
      context,
      title: 'Import learner review package',
      hint: 'Paste clientbound-review-package JSON here.',
      action: 'Import package',
    );
    if (raw == null) return;

    try {
      final package = await store.importReviewPackage(raw);
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Imported Module ${package.moduleId}, revision ${package.revision}.',
          ),
        ),
      );
    } catch (error) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Review package rejected: $error')),
      );
    }
  }

  Future<void> _importDecision(BuildContext context) async {
    final raw = await _jsonDialog(
      context,
      title: 'Import reviewer decision',
      hint: 'Paste clientbound-review-decision JSON here.',
      action: 'Apply decision',
    );
    if (raw == null) return;

    try {
      final decision = ReviewDecisionPackage.parse(raw);
      await progress.applyExternalReviewDecision(decision);
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Module ${decision.moduleId} revision ${decision.revision}: ${decision.decision.label}.',
          ),
        ),
      );
    } catch (error) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Review decision rejected: $error')),
      );
    }
  }

  Future<String?> _jsonDialog(
    BuildContext context, {
    required String title,
    required String hint,
    required String action,
  }) async {
    final controller = TextEditingController();
    final accepted = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: SizedBox(
          width: 680,
          child: TextField(
            controller: controller,
            minLines: 10,
            maxLines: 18,
            decoration: InputDecoration(hintText: hint),
          ),
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

    final value = accepted == true ? controller.text : null;
    controller.dispose();
    return value;
  }
}

class _ImportedReviewCard extends StatelessWidget {
  const _ImportedReviewCard({
    required this.record,
    required this.store,
  });

  final ReviewExchangeRecord record;
  final ReviewExchangeStore store;

  @override
  Widget build(BuildContext context) {
    final package = record.package;
    final decision = record.decision;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'MODULE ${package.moduleId} · REVISION ${package.revision}',
              style: TextStyle(
                color: Theme.of(context).colorScheme.primary,
                fontWeight: FontWeight.w900,
                fontSize: 11,
                letterSpacing: 1,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              package.moduleTitle,
              style: const TextStyle(
                fontSize: 19,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Submitted ${package.submittedAt.toLocal().toIso8601String()}',
              style: const TextStyle(color: Colors.white54),
            ),
            const SizedBox(height: 4),
            Text(
              'Source ${package.clientboundVersion} · Submission ${package.submissionId}',
              style: const TextStyle(
                color: Colors.white38,
                fontSize: 12,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              package.qualityGate,
              style: const TextStyle(color: Colors.white70, height: 1.45),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Icon(
                  decision == null
                      ? Icons.pending_actions_outlined
                      : decision.decision == ReviewExchangeDecision.pass
                          ? Icons.check_circle_outline
                          : Icons.replay_rounded,
                  size: 18,
                ),
                const SizedBox(width: 8),
                Text(
                  decision == null
                      ? 'Decision pending'
                      : '${decision.decision.label}: ${decision.feedback.isEmpty ? 'No feedback' : decision.feedback}',
                  style: const TextStyle(color: Colors.white70),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                OutlinedButton.icon(
                  onPressed: () => _inspect(context),
                  icon: const Icon(Icons.visibility_outlined),
                  label: const Text('Inspect evidence'),
                ),
                FilledButton.icon(
                  onPressed: () => _decide(
                    context,
                    ReviewExchangeDecision.pass,
                  ),
                  icon: const Icon(Icons.check_circle_outline),
                  label: const Text('PASS'),
                ),
                OutlinedButton.icon(
                  onPressed: () => _decide(
                    context,
                    ReviewExchangeDecision.revise,
                  ),
                  icon: const Icon(Icons.replay_rounded),
                  label: const Text('REVISE'),
                ),
                if (decision != null) ...[
                  OutlinedButton.icon(
                    onPressed: () => _saveDecisionFile(context, decision),
                    icon: const Icon(Icons.download_outlined),
                    label: const Text('Save decision file'),
                  ),
                  OutlinedButton.icon(
                    onPressed: () => _copyDecision(context, decision),
                    icon: const Icon(Icons.copy_all_rounded),
                    label: const Text('Copy decision JSON'),
                  ),
                ],
                TextButton.icon(
                  onPressed: () => store.remove(package.submissionId),
                  icon: const Icon(Icons.delete_outline_rounded),
                  label: const Text('Remove'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _inspect(BuildContext context) {
    final package = record.package;
    final prettyEvidence =
        const JsonEncoder.withIndent('  ').convert(package.structuredEvidence);
    return showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(
          'Module ${package.moduleId} · Revision ${package.revision}',
        ),
        content: SizedBox(
          width: 760,
          child: SingleChildScrollView(
            child: SelectableText(
              'SUBMISSION ID\n${package.submissionId}\n\n'
              'SOURCE VERSION\n${package.clientboundVersion}\n\n'
              'DELIVERABLE\n${package.deliverable}\n\n'
              'QUALITY GATE\n${package.qualityGate}\n\n'
              'SCRATCH NOTES\n${package.scratchNotes.trim().isEmpty ? '—' : package.scratchNotes.trim()}\n\n'
              'STRUCTURED EVIDENCE\n$prettyEvidence',
              style: const TextStyle(height: 1.45),
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  Future<void> _decide(
    BuildContext context,
    ReviewExchangeDecision decision,
  ) async {
    final controller = TextEditingController(
      text: record.decision?.feedback ?? '',
    );
    final accepted = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(
          '${decision.label} · Module ${record.package.moduleId}',
        ),
        content: TextField(
          controller: controller,
          minLines: 3,
          maxLines: 7,
          decoration: InputDecoration(
            hintText: decision == ReviewExchangeDecision.pass
                ? 'Optional instructor feedback...'
                : 'State the single biggest weakness and correction required.',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text('Record ${decision.label}'),
          ),
        ],
      ),
    );

    if (accepted == true) {
      await store.recordDecision(
        record.package.submissionId,
        decision: decision,
        feedback: controller.text,
      );
    }
    controller.dispose();
  }

  Future<void> _saveDecisionFile(
    BuildContext context,
    ReviewDecisionPackage decision,
  ) async {
    try {
      final saved = await ReviewExchangeFileService.saveJson(
        contents: decision.json,
        filename: ReviewExchangeFileService.decisionFilename(
          moduleId: decision.moduleId,
          revision: decision.revision,
          decision: decision.decision.name,
        ),
        dialogTitle: 'Save reviewer decision',
      );
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            saved
                ? 'Review decision file saved.'
                : 'Review decision save canceled.',
          ),
        ),
      );
    } catch (error) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not save review decision: $error')),
      );
    }
  }

  Future<void> _copyDecision(
    BuildContext context,
    ReviewDecisionPackage decision,
  ) async {
    await Clipboard.setData(ClipboardData(text: decision.json));
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Review decision JSON copied.')),
    );
  }
}
