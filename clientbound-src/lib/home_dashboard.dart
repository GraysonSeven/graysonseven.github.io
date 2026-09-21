import 'package:flutter/material.dart';

import 'course_catalog.dart';
import 'home_dashboard_model.dart';
import 'progress_store.dart';
import 'workspace_store.dart';

const _homeInk = Color(0xFF07111F);
const _homePanel = Color(0xFF0E1B2D);
const _homePanelSoft = Color(0xFF14243A);
const _homeAccent = Color(0xFF6EA8FE);
const _homeSuccess = Color(0xFF50D890);
const _homeWarning = Color(0xFFFFC857);

class HomeDashboard extends StatelessWidget {
  const HomeDashboard({
    super.key,
    required this.progress,
    required this.workspace,
    required this.onOpenCourse,
    required this.onOpenReview,
    required this.onOpenToolkit,
    required this.onOpenModule,
  });

  final ProgressStore progress;
  final WorkspaceStore workspace;
  final VoidCallback onOpenCourse;
  final VoidCallback onOpenReview;
  final VoidCallback onOpenToolkit;
  final ValueChanged<CourseModule> onOpenModule;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: Listenable.merge(<Listenable>[progress, workspace]),
      builder: (context, _) {
        final model = HomeDashboardModel.build(progress, workspace);
        return ColoredBox(
          color: _homeInk,
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(22, 24, 22, 40),
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 1180),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const _HomeHeader(),
                    const SizedBox(height: 22),
                    _NextActionCard(
                      model: model,
                      onOpenModule: onOpenModule,
                      onOpenReview: onOpenReview,
                    ),
                    const SizedBox(height: 14),
                    LayoutBuilder(
                      builder: (context, constraints) {
                        final stacked = constraints.maxWidth < 760;
                        if (stacked) {
                          return Column(
                            children: [
                              _ReviewStatusCard(model: model),
                              const SizedBox(height: 14),
                              _RecentActivityCard(model: model),
                            ],
                          );
                        }
                        return Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(child: _ReviewStatusCard(model: model)),
                            const SizedBox(width: 14),
                            Expanded(child: _RecentActivityCard(model: model)),
                          ],
                        );
                      },
                    ),
                    const SizedBox(height: 24),
                    _SectionTitle(
                      title: 'Your learning path',
                      action: 'View all 14 modules',
                      onAction: onOpenCourse,
                    ),
                    const SizedBox(height: 10),
                    _LearningPathCard(
                      model: model,
                      progress: progress,
                      onOpenModule: onOpenModule,
                    ),
                    const SizedBox(height: 24),
                    LayoutBuilder(
                      builder: (context, constraints) {
                        final stacked = constraints.maxWidth < 820;
                        if (stacked) {
                          return Column(
                            children: [
                              _MilestonesCard(model: model),
                              const SizedBox(height: 14),
                              _LiveOpportunityCard(
                                onOpenToolkit: onOpenToolkit,
                              ),
                            ],
                          );
                        }
                        return Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(child: _MilestonesCard(model: model)),
                            const SizedBox(width: 14),
                            Expanded(
                              child: _LiveOpportunityCard(
                                onOpenToolkit: onOpenToolkit,
                              ),
                            ),
                          ],
                        );
                      },
                    ),
                    const SizedBox(height: 24),
                    LayoutBuilder(
                      builder: (context, constraints) {
                        final stacked = constraints.maxWidth < 720;
                        if (stacked) {
                          return Column(
                            children: [
                              _CourseProgressCard(progress: progress),
                              const SizedBox(height: 14),
                              const _CommunityCard(),
                            ],
                          );
                        }
                        return Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: _CourseProgressCard(progress: progress),
                            ),
                            const SizedBox(width: 14),
                            const Expanded(child: _CommunityCard()),
                          ],
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _HomeHeader extends StatelessWidget {
  const _HomeHeader();

  @override
  Widget build(BuildContext context) {
    return const Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'CLIENTBOUND',
          style: TextStyle(
            color: _homeAccent,
            fontWeight: FontWeight.w900,
            letterSpacing: 1.3,
            fontSize: 12,
          ),
        ),
        SizedBox(height: 8),
        Text(
          'Know the next move.',
          style: TextStyle(
            fontSize: 34,
            height: 1.05,
            fontWeight: FontWeight.w900,
          ),
        ),
        SizedBox(height: 9),
        Text(
          'Your Home screen prioritizes the next evidence-producing action, not dashboard noise.',
          style: TextStyle(
            color: Colors.white70,
            height: 1.5,
            fontSize: 15,
          ),
        ),
      ],
    );
  }
}

class _NextActionCard extends StatelessWidget {
  const _NextActionCard({
    required this.model,
    required this.onOpenModule,
    required this.onOpenReview,
  });

  final HomeDashboardModel model;
  final ValueChanged<CourseModule> onOpenModule;
  final VoidCallback onOpenReview;

  @override
  Widget build(BuildContext context) {
    final reviewAction = model.status == HomeModuleStatus.awaitingDecision;
    final actionLabel = model.courseComplete
        ? 'Open cycle review'
        : reviewAction
            ? 'Open Review'
            : 'Continue Module ${model.currentModule.id}';

    return _HomePanel(
      padding: const EdgeInsets.all(24),
      borderColor: _statusColor(model.status).withValues(alpha: .45),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 10,
            runSpacing: 8,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              _StatusChip(status: model.status),
              Text(
                'Module ${model.currentModule.id} · ${model.currentModule.title}',
                style: const TextStyle(
                  color: Colors.white70,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            model.courseComplete ? 'Your acquisition cycle is complete.' : 'What you should do now',
            style: const TextStyle(
              fontSize: 25,
              height: 1.12,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 9),
          Text(
            model.nextAction,
            style: const TextStyle(
              color: Colors.white70,
              height: 1.5,
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 15),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _InfoPill(
                icon: Icons.track_changes_rounded,
                text: model.progressLabel,
              ),
              const SizedBox(height: 8),
              _InfoPill(
                icon: Icons.task_alt_outlined,
                text:
                    '${model.completedTasks}/${model.totalTasks} module tasks',
              ),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: _homePanelSoft,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Text(
              'Quality gate: ${model.currentModule.passGate}',
              style: const TextStyle(
                color: Colors.white70,
                height: 1.45,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const SizedBox(height: 18),
          FilledButton.icon(
            onPressed: reviewAction
                ? onOpenReview
                : () => onOpenModule(model.currentModule),
            icon: Icon(
              reviewAction
                  ? Icons.fact_check_outlined
                  : Icons.arrow_forward_rounded,
            ),
            label: Text(actionLabel),
          ),
        ],
      ),
    );
  }
}

class _ReviewStatusCard extends StatelessWidget {
  const _ReviewStatusCard({required this.model});

  final HomeDashboardModel model;

  @override
  Widget build(BuildContext context) {
    final feedback = model.reviewerFeedback;
    return _HomePanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _CardTitle(
            icon: Icons.verified_outlined,
            title: 'Current module status',
          ),
          const SizedBox(height: 14),
          _StatusChip(status: model.status),
          const SizedBox(height: 12),
          Text(
            model.workspaceReady
                ? 'Structured evidence: complete'
                : 'Structured evidence: still needs work',
            style: const TextStyle(
              color: Colors.white70,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            '${model.completedTasks} of ${model.totalTasks} task checks completed',
            style: const TextStyle(color: Colors.white54),
          ),
          if (feedback.isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: _homeWarning.withValues(alpha: .08),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: _homeWarning.withValues(alpha: .25),
                ),
              ),
              child: Text(
                'Reviewer: $feedback',
                style: const TextStyle(color: Colors.white70, height: 1.4),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _RecentActivityCard extends StatelessWidget {
  const _RecentActivityCard({required this.model});

  final HomeDashboardModel model;

  @override
  Widget build(BuildContext context) {
    return _HomePanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _CardTitle(
            icon: Icons.history_rounded,
            title: 'Resume where you stopped',
          ),
          const SizedBox(height: 14),
          Text(
            model.recentActivity,
            style: const TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Clientbound keeps this activity on your device and uses it only to restore your learning context.',
            style: TextStyle(color: Colors.white54, height: 1.45),
          ),
        ],
      ),
    );
  }
}

class _LearningPathCard extends StatelessWidget {
  const _LearningPathCard({
    required this.model,
    required this.progress,
    required this.onOpenModule,
  });

  final HomeDashboardModel model;
  final ProgressStore progress;
  final ValueChanged<CourseModule> onOpenModule;

  @override
  Widget build(BuildContext context) {
    return _HomePanel(
      padding: const EdgeInsets.all(12),
      child: Column(
        children: [
          for (var i = 0; i < model.pathModuleIds.length; i++) ...[
            _PathRow(
              module: courseModules[model.pathModuleIds[i] - 1],
              stage: progress.stageFor(model.pathModuleIds[i]),
              current:
                  model.pathModuleIds[i] == model.currentModule.id,
              onTap: onOpenModule,
            ),
            if (i != model.pathModuleIds.length - 1)
              const Divider(height: 1, color: Colors.white10),
          ],
        ],
      ),
    );
  }
}

class _PathRow extends StatelessWidget {
  const _PathRow({
    required this.module,
    required this.stage,
    required this.current,
    required this.onTap,
  });

  final CourseModule module;
  final ModuleStage stage;
  final bool current;
  final ValueChanged<CourseModule> onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      onTap: () => onTap(module),
      leading: CircleAvatar(
        backgroundColor: current
            ? _homeAccent.withValues(alpha: .16)
            : Colors.white.withValues(alpha: .06),
        child: Text(
          '${module.id}',
          style: TextStyle(
            color: current ? _homeAccent : Colors.white70,
            fontWeight: FontWeight.w900,
          ),
        ),
      ),
      title: Text(
        module.title,
        style: TextStyle(
          fontWeight: current ? FontWeight.w900 : FontWeight.w700,
        ),
      ),
      subtitle: Text(
        current ? 'CURRENT · ${stage.label}' : stage.label,
        style: TextStyle(
          color: current ? _homeAccent : Colors.white54,
          fontWeight: FontWeight.w700,
          fontSize: 12,
        ),
      ),
      trailing: const Icon(Icons.chevron_right_rounded),
    );
  }
}

class _MilestonesCard extends StatelessWidget {
  const _MilestonesCard({required this.model});

  final HomeDashboardModel model;

  @override
  Widget build(BuildContext context) {
    return _HomePanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _CardTitle(
            icon: Icons.emoji_events_outlined,
            title: 'Evidence-backed milestones',
          ),
          const SizedBox(height: 13),
          if (model.milestones.isEmpty)
            const Text(
              'Your first milestone appears after a real module passes review.',
              style: TextStyle(color: Colors.white54, height: 1.45),
            )
          else
            for (final milestone in model.milestones)
              Padding(
                padding: const EdgeInsets.only(bottom: 9),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(
                      Icons.check_circle_rounded,
                      color: _homeSuccess,
                      size: 18,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        milestone,
                        style: const TextStyle(color: Colors.white70),
                      ),
                    ),
                  ],
                ),
              ),
        ],
      ),
    );
  }
}

class _LiveOpportunityCard extends StatelessWidget {
  const _LiveOpportunityCard({required this.onOpenToolkit});

  final VoidCallback onOpenToolkit;

  @override
  Widget build(BuildContext context) {
    return _HomePanel(
      borderColor: _homeAccent.withValues(alpha: .3),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _CardTitle(
            icon: Icons.bolt_rounded,
            title: 'I have a live prospect/client situation',
          ),
          const SizedBox(height: 10),
          const Text(
            'Real opportunities outrank planned lessons. Stabilize the live situation first, then return to coursework.',
            style: TextStyle(color: Colors.white70, height: 1.45),
          ),
          const SizedBox(height: 12),
          const Wrap(
            spacing: 7,
            runSpacing: 7,
            children: [
              Chip(label: Text('Reply')),
              Chip(label: Text('Call')),
              Chip(label: Text('Objection')),
              Chip(label: Text('Discovery')),
              Chip(label: Text('Follow-up')),
            ],
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: onOpenToolkit,
            icon: const Icon(Icons.folder_open_outlined),
            label: const Text('Open live-situation tools'),
          ),
        ],
      ),
    );
  }
}

class _CourseProgressCard extends StatelessWidget {
  const _CourseProgressCard({required this.progress});

  final ProgressStore progress;

  @override
  Widget build(BuildContext context) {
    final percent = (progress.ratio * 100).round();
    return _HomePanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _CardTitle(
            icon: Icons.track_changes_rounded,
            title: 'Course progress',
          ),
          const SizedBox(height: 13),
          Text(
            '$percent%',
            style: const TextStyle(
              fontSize: 30,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: LinearProgressIndicator(
              value: progress.ratio,
              minHeight: 9,
              backgroundColor: Colors.white10,
              color: _homeSuccess,
            ),
          ),
          const SizedBox(height: 9),
          Text(
            '${progress.passedCount} of ${courseModules.length} modules passed',
            style: const TextStyle(color: Colors.white60),
          ),
        ],
      ),
    );
  }
}

class _CommunityCard extends StatelessWidget {
  const _CommunityCard();

  @override
  Widget build(BuildContext context) {
    return const _HomePanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _CardTitle(
            icon: Icons.forum_outlined,
            title: 'Practice board',
          ),
          SizedBox(height: 13),
          Text(
            'Use Practice for anonymized objections, outreach drafts, call recovery, and wins. In this zero-cost release it remains private to this device.',
            style: TextStyle(color: Colors.white60, height: 1.5),
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({
    required this.title,
    required this.action,
    required this.onAction,
  });

  final String title;
  final String action;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            title,
            style: const TextStyle(fontSize: 21, fontWeight: FontWeight.w900),
          ),
        ),
        TextButton(onPressed: onAction, child: Text(action)),
      ],
    );
  }
}

class _CardTitle extends StatelessWidget {
  const _CardTitle({required this.icon, required this.title});

  final IconData icon;
  final String title;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: _homeAccent, size: 21),
        const SizedBox(width: 9),
        Expanded(
          child: Text(
            title,
            style: const TextStyle(
              fontWeight: FontWeight.w900,
              fontSize: 17,
            ),
          ),
        ),
      ],
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});

  final HomeModuleStatus status;

  @override
  Widget build(BuildContext context) {
    final color = _statusColor(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 7),
      decoration: BoxDecoration(
        color: color.withValues(alpha: .12),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: .35)),
      ),
      child: Text(
        status.label,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.w900,
          fontSize: 11,
          letterSpacing: .7,
        ),
      ),
    );
  }
}

class _InfoPill extends StatelessWidget {
  const _InfoPill({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: .06),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: Colors.white60),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                color: Colors.white70,
                fontWeight: FontWeight.w700,
                fontSize: 12,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _HomePanel extends StatelessWidget {
  const _HomePanel({
    required this.child,
    this.padding = const EdgeInsets.all(18),
    this.borderColor,
  });

  final Widget child;
  final EdgeInsets padding;
  final Color? borderColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(
        color: _homePanel,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: borderColor ?? const Color(0xFF1D2E44)),
      ),
      child: child,
    );
  }
}

Color _statusColor(HomeModuleStatus status) => switch (status) {
      HomeModuleStatus.notStarted => Colors.white54,
      HomeModuleStatus.working => _homeAccent,
      HomeModuleStatus.readyToSubmit => _homeSuccess,
      HomeModuleStatus.awaitingDecision => _homeWarning,
      HomeModuleStatus.revise => _homeWarning,
      HomeModuleStatus.passed => _homeSuccess,
      HomeModuleStatus.courseComplete => _homeSuccess,
    };
