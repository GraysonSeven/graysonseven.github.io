import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import 'app_settings_store.dart';
import 'community_hub_page.dart';
import 'community_store.dart';
import 'course_catalog.dart';
import 'module_workspace_card.dart';
import 'more_page.dart';
import 'onboarding_page.dart';
import 'progress_store.dart';
import 'review_exchange_store.dart';
import 'review_page.dart';
import 'settings_page.dart';
import 'toolkit_page.dart';
import 'update_store.dart';
import 'workspace_schema.dart';
import 'workspace_store.dart';

const _ink = Color(0xFF07111F);
const _panel = Color(0xFF0E1B2D);
const _panelSoft = Color(0xFF14243A);
const _accent = Color(0xFF6EA8FE);
const _success = Color(0xFF50D890);
const _warning = Color(0xFFFFC857);

Color _stageColor(ModuleStage stage) => switch (stage) {
      ModuleStage.notStarted => Colors.white38,
      ModuleStage.inProgress => _accent,
      ModuleStage.readyForReview => _warning,
      ModuleStage.passed => _success,
    };

IconData _stageIcon(ModuleStage stage) => switch (stage) {
      ModuleStage.notStarted => Icons.circle_outlined,
      ModuleStage.inProgress => Icons.play_circle_outline_rounded,
      ModuleStage.readyForReview => Icons.rate_review_outlined,
      ModuleStage.passed => Icons.check_circle_rounded,
    };

class ClientboundApp extends StatelessWidget {
  const ClientboundApp({
    super.key,
    required this.progress,
    required this.community,
    required this.settings,
    required this.updates,
    required this.workspace,
    required this.reviewExchange,
    required this.appVersion,
  });

  final ProgressStore progress;
  final CommunityStore community;
  final AppSettingsStore settings;
  final UpdateStore updates;
  final WorkspaceStore workspace;
  final ReviewExchangeStore reviewExchange;
  final String appVersion;

  @override
  Widget build(BuildContext context) {
    final scheme = ColorScheme.fromSeed(
      seedColor: _accent,
      brightness: Brightness.dark,
      surface: _panel,
    );

    return AnimatedBuilder(
      animation: settings,
      builder: (context, _) => WorkspaceScope(
        store: workspace,
        child: MaterialApp(
          debugShowCheckedModeBanner: false,
          title: 'Clientbound',
          theme: ThemeData(
            useMaterial3: true,
            brightness: Brightness.dark,
            scaffoldBackgroundColor: _ink,
            colorScheme: scheme,
            cardTheme: const CardThemeData(
              color: _panel,
              elevation: 0,
              margin: EdgeInsets.zero,
            ),
            inputDecorationTheme: const InputDecorationTheme(
              filled: true,
              fillColor: _panelSoft,
              border: OutlineInputBorder(borderSide: BorderSide.none),
            ),
          ),
          home: settings.onboardingComplete
              ? AppShell(
                  progress: progress,
                  community: community,
                  settings: settings,
                  updates: updates,
                  workspace: workspace,
                  reviewExchange: reviewExchange,
                  appVersion: appVersion,
                )
              : OnboardingPage(
                  onComplete: settings.completeOnboarding,
                ),
        ),
      ),
    );
  }
}

class AppShell extends StatefulWidget {
  const AppShell({
    super.key,
    required this.progress,
    required this.community,
    required this.settings,
    required this.updates,
    required this.workspace,
    required this.reviewExchange,
    required this.appVersion,
  });

  final ProgressStore progress;
  final CommunityStore community;
  final AppSettingsStore settings;
  final UpdateStore updates;
  final WorkspaceStore workspace;
  final ReviewExchangeStore reviewExchange;
  final String appVersion;

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _index = 0;

  static const _desktopLabels = <String>[
    'Home',
    'Classroom',
    'Practice',
    'Toolkit',
    'Review',
    'Settings',
  ];

  static const _desktopIcons = <IconData>[
    Icons.home_outlined,
    Icons.school_outlined,
    Icons.forum_outlined,
    Icons.folder_outlined,
    Icons.fact_check_outlined,
    Icons.settings_outlined,
  ];

  static const _mobileLabels = <String>[
    'Home',
    'Learn',
    'Practice',
    'Toolkit',
    'More',
  ];

  static const _mobileIcons = <IconData>[
    Icons.home_outlined,
    Icons.school_outlined,
    Icons.forum_outlined,
    Icons.folder_outlined,
    Icons.more_horiz_rounded,
  ];

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: widget.progress,
      builder: (context, _) => LayoutBuilder(
        builder: (context, constraints) {
          final wide = constraints.maxWidth >= 900;

          void openReview() {
            if (wide) {
              setState(() => _index = 4);
              return;
            }
            Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => ReviewPage(
                  progress: widget.progress,
                  workspace: widget.workspace,
                  reviewExchange: widget.reviewExchange,
                  appVersion: widget.appVersion,
                ),
              ),
            );
          }

          final home = HomePage(
            progress: widget.progress,
            onOpenCourse: () => setState(() => _index = 1),
            onOpenReview: openReview,
          );

          final desktopPages = <Widget>[
            home,
            CoursePage(progress: widget.progress),
            CommunityHubPage(store: widget.community),
            const ToolkitPage(),
            ReviewPage(
              progress: widget.progress,
              workspace: widget.workspace,
              reviewExchange: widget.reviewExchange,
              appVersion: widget.appVersion,
            ),
            SettingsPage(
              progress: widget.progress,
              community: widget.community,
              settings: widget.settings,
              updates: widget.updates,
              workspace: widget.workspace,
              reviewExchange: widget.reviewExchange,
              appVersion: widget.appVersion,
            ),
          ];

          final mobilePages = <Widget>[
            home,
            CoursePage(progress: widget.progress),
            CommunityHubPage(store: widget.community),
            const ToolkitPage(),
            MorePage(
              progress: widget.progress,
              community: widget.community,
              settings: widget.settings,
              updates: widget.updates,
              workspace: widget.workspace,
              reviewExchange: widget.reviewExchange,
              appVersion: widget.appVersion,
            ),
          ];

          final desktopIndex = _index.clamp(0, desktopPages.length - 1);
          final mobileIndex = _index >= 4 ? 4 : _index;

          return Scaffold(
            body: SafeArea(
              child: Row(
                children: [
                  if (wide)
                    _SideNav(
                      index: desktopIndex,
                      labels: _desktopLabels,
                      icons: _desktopIcons,
                      onSelected: (value) =>
                          setState(() => _index = value),
                    ),
                  Expanded(
                    child: wide
                        ? desktopPages[desktopIndex]
                        : mobilePages[mobileIndex],
                  ),
                ],
              ),
            ),
            bottomNavigationBar: wide
                ? null
                : NavigationBar(
                    selectedIndex: mobileIndex,
                    onDestinationSelected: (value) =>
                        setState(() => _index = value),
                    destinations: List.generate(
                      _mobileLabels.length,
                      (i) => NavigationDestination(
                        icon: Icon(_mobileIcons[i]),
                        selectedIcon: Icon(
                          _mobileIcons[i],
                          color: _accent,
                        ),
                        label: _mobileLabels[i],
                      ),
                    ),
                  ),
          );
        },
      ),
    );
  }
}

class _SideNav extends StatelessWidget {
  const _SideNav({
    required this.index,
    required this.labels,
    required this.icons,
    required this.onSelected,
  });

  final int index;
  final List<String> labels;
  final List<IconData> icons;
  final ValueChanged<int> onSelected;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 232,
      decoration: const BoxDecoration(
        color: Color(0xFF091625),
        border: Border(right: BorderSide(color: Color(0xFF1D2E44))),
      ),
      padding: const EdgeInsets.fromLTRB(18, 22, 18, 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _Brand(),
          const SizedBox(height: 34),
          for (var i = 0; i < labels.length; i++)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: _NavButton(
                selected: index == i,
                icon: icons[i],
                label: labels[i],
                onTap: () => onSelected(i),
              ),
            ),
          const Spacer(),
          const Text(
            'Execution first.\nEvidence over guesswork.',
            style: TextStyle(color: Colors.white54, height: 1.45, fontSize: 12),
          ),
        ],
      ),
    );
  }
}

class _Brand extends StatelessWidget {
  const _Brand();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [_accent, Color(0xFF8B7CFF)]),
            borderRadius: BorderRadius.circular(13),
          ),
          child: const Icon(Icons.arrow_outward_rounded, color: Colors.white),
        ),
        const SizedBox(width: 12),
        const Expanded(
          child: Text(
            'CLIENTBOUND',
            style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: .7, height: 1.05),
          ),
        ),
      ],
    );
  }
}

class _NavButton extends StatelessWidget {
  const _NavButton({
    required this.selected,
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final bool selected;
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? _accent.withValues(alpha: .14) : Colors.transparent,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(
            children: [
              Icon(icon, color: selected ? _accent : Colors.white60, size: 21),
              const SizedBox(width: 12),
              Text(
                label,
                style: TextStyle(
                  color: selected ? Colors.white : Colors.white70,
                  fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class HomePage extends StatelessWidget {
  const HomePage({
    super.key,
    required this.progress,
    required this.onOpenCourse,
    required this.onOpenReview,
  });

  final ProgressStore progress;
  final VoidCallback onOpenCourse;
  final VoidCallback onOpenReview;

  @override
  Widget build(BuildContext context) {
    final next = courseModules[progress.nextModuleId - 1];
    return _PageFrame(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _PageHeader(
            eyebrow: 'CLIENTBOUND',
            title: 'Learn sales. Win clients.',
            subtitle: 'Build real sales skill through execution, proof, feedback, and live market experience.',
          ),
          const SizedBox(height: 24),
          LayoutBuilder(
            builder: (context, c) {
              final stacked = c.maxWidth < 760;
              if (stacked) {
                return Column(
                  children: [
                    _ContinueCard(module: next, progress: progress),
                    const SizedBox(height: 16),
                    _ProgressCard(progress: progress),
                  ],
                );
              }
              return Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Expanded(flex: 2, child: _ContinueCard(module: next, progress: progress)),
                  const SizedBox(width: 16),
                  Expanded(child: _ProgressCard(progress: progress)),
                ],
              );
            },
          ),
          const SizedBox(height: 18),
          _ActionCenter(
            progress: progress,
            onOpenReview: onOpenReview,
          ),
          const SizedBox(height: 28),
          Row(
            children: [
              const Expanded(
                child: Text(
                  'Your classroom',
                  style: TextStyle(fontSize: 21, fontWeight: FontWeight.w800),
                ),
              ),
              TextButton(
                onPressed: onOpenCourse,
                child: const Text('View all 14 modules'),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _ModulePreview(progress: progress),
          const SizedBox(height: 28),
          const _CommunityTeaser(),
        ],
      ),
    );
  }
}

class _ActionCenter extends StatelessWidget {
  const _ActionCenter({
    required this.progress,
    required this.onOpenReview,
  });

  final ProgressStore progress;
  final VoidCallback onOpenReview;

  @override
  Widget build(BuildContext context) {
    final recent = progress.recentlyTouchedModuleIds;
    final recentId = recent.isEmpty ? null : recent.first;
    final recentTitle = recentId == null
        ? 'No workspace activity yet'
        : 'Module $recentId · ${courseModules[recentId - 1].title}';

    return _Panel(
      padding: const EdgeInsets.all(20),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final compact = constraints.maxWidth < 680;
          final metrics = <Widget>[
            _ActionMetric(
              icon: Icons.play_circle_outline_rounded,
              value: progress.activeCount,
              label: 'Active',
            ),
            _ActionMetric(
              icon: Icons.rate_review_outlined,
              value: progress.readyForReviewCount,
              label: 'Ready for review',
            ),
            _ActionMetric(
              icon: Icons.history_rounded,
              valueText: recentTitle,
              label: 'Recent workspace',
            ),
          ];

          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Action center',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 14),
              if (compact)
                Column(
                  children: [
                    for (final metric in metrics) ...[
                      metric,
                      const SizedBox(height: 10),
                    ],
                  ],
                )
              else
                Row(
                  children: [
                    for (var i = 0; i < metrics.length; i++) ...[
                      Expanded(child: metrics[i]),
                      if (i != metrics.length - 1)
                        const SizedBox(width: 10),
                    ],
                  ],
                ),
              if (progress.readyForReviewCount > 0) ...[
                const SizedBox(height: 12),
                FilledButton.icon(
                  onPressed: onOpenReview,
                  icon: const Icon(Icons.fact_check_outlined),
                  label: Text(
                    'Review ${progress.readyForReviewCount} ready module(s)',
                  ),
                ),
              ],
            ],
          );
        },
      ),
    );
  }
}

class _ActionMetric extends StatelessWidget {
  const _ActionMetric({
    required this.icon,
    this.value,
    this.valueText,
    required this.label,
  });

  final IconData icon;
  final int? value;
  final String? valueText;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: _panelSoft,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          Icon(icon, color: _accent),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  valueText ?? '${value ?? 0}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 16,
                  ),
                ),
                Text(
                  label,
                  style: const TextStyle(
                    color: Colors.white54,
                    fontSize: 12,
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

class _ContinueCard extends StatelessWidget {
  const _ContinueCard({required this.module, required this.progress});

  final CourseModule module;
  final ProgressStore progress;

  @override
  Widget build(BuildContext context) {
    final done = progress.completed.length == 14;
    return _Panel(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            done ? 'CYCLE COMPLETE' : 'CONTINUE LEARNING',
            style: const TextStyle(color: _accent, fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 1.2),
          ),
          const SizedBox(height: 12),
          Text(
            done ? 'Review your evidence and start the next cycle.' : 'Module ${module.id} · ${module.title}',
            style: const TextStyle(fontSize: 25, height: 1.1, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 10),
          Text(
            done ? 'Keep what worked, change one weak point, and replenish the pipeline.' : module.tagline,
            style: const TextStyle(color: Colors.white70, height: 1.45),
          ),
          const Spacer(),
          const SizedBox(height: 20),
          FilledButton.icon(
            onPressed: () => _openModule(context, module, progress),
            icon: const Icon(Icons.arrow_forward_rounded),
            label: Text(done ? 'Open review module' : 'Open module'),
          ),
        ],
      ),
    );
  }
}

class _ProgressCard extends StatelessWidget {
  const _ProgressCard({required this.progress});

  final ProgressStore progress;

  @override
  Widget build(BuildContext context) {
    final percent = (progress.ratio * 100).round();
    return _Panel(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.track_changes_rounded, color: _success, size: 30),
          const SizedBox(height: 18),
          Text('$percent%', style: const TextStyle(fontSize: 34, fontWeight: FontWeight.w900)),
          const Text('Course PASS progress', style: TextStyle(color: Colors.white60)),
          const SizedBox(height: 16),
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: LinearProgressIndicator(
              value: progress.ratio,
              minHeight: 9,
              backgroundColor: Colors.white10,
              color: _success,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            '${progress.passedCount} of 14 modules passed',
            style: const TextStyle(color: Colors.white70, fontSize: 13),
          ),
        ],
      ),
    );
  }
}

class _ModulePreview extends StatelessWidget {
  const _ModulePreview({required this.progress});

  final ProgressStore progress;

  @override
  Widget build(BuildContext context) {
    final visible = courseModules.take(4).toList();
    return LayoutBuilder(
      builder: (context, c) {
        final columns = c.maxWidth >= 1000 ? 4 : c.maxWidth >= 620 ? 2 : 1;
        final width = (c.maxWidth - ((columns - 1) * 14)) / columns;
        return Wrap(
          spacing: 14,
          runSpacing: 14,
          children: [
            for (final module in visible)
              SizedBox(width: width, child: _ModuleCard(module: module, progress: progress)),
          ],
        );
      },
    );
  }
}

class CoursePage extends StatelessWidget {
  const CoursePage({super.key, required this.progress});

  final ProgressStore progress;

  @override
  Widget build(BuildContext context) {
    return _PageFrame(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _PageHeader(
            eyebrow: 'CLASSROOM',
            title: 'First Client Sales System',
            subtitle: 'Clientbound\'s 14-module execution path from offer foundation to a real first-client acquisition cycle.',
          ),
          const SizedBox(height: 24),
          LayoutBuilder(
            builder: (context, c) {
              final columns = c.maxWidth >= 1050 ? 3 : c.maxWidth >= 660 ? 2 : 1;
              final width = (c.maxWidth - ((columns - 1) * 14)) / columns;
              return Wrap(
                spacing: 14,
                runSpacing: 14,
                children: [
                  for (final module in courseModules)
                    SizedBox(width: width, child: _ModuleCard(module: module, progress: progress)),
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}

class _ModuleCard extends StatelessWidget {
  const _ModuleCard({required this.module, required this.progress});

  final CourseModule module;
  final ProgressStore progress;

  @override
  Widget build(BuildContext context) {
    final stage = progress.stageFor(module.id);
    final stageColor = _stageColor(stage);
    return _Panel(
      onTap: () => _openModule(context, module, progress),
      padding: const EdgeInsets.all(19),
      child: SizedBox(
        height: 222,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: stageColor.withValues(alpha: .14),
                    borderRadius: BorderRadius.circular(11),
                  ),
                  child: Icon(
                    stage == ModuleStage.notStarted ? module.icon : _stageIcon(stage),
                    color: stage == ModuleStage.notStarted ? _accent : stageColor,
                    size: 21,
                  ),
                ),
                const Spacer(),
                Text(
                  '${module.id.toString().padLeft(2, '0')} / 14',
                  style: const TextStyle(
                    color: Colors.white38,
                    fontWeight: FontWeight.w700,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 17),
            Text(
              module.title,
              style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18),
            ),
            const SizedBox(height: 8),
            Text(
              module.tagline,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Colors.white60,
                height: 1.4,
                fontSize: 13,
              ),
            ),
            const Spacer(),
            Row(
              children: [
                Icon(_stageIcon(stage), size: 15, color: stageColor),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    stage.label.toUpperCase(),
                    style: TextStyle(
                      color: stageColor,
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      letterSpacing: .7,
                    ),
                  ),
                ),
                Icon(
                  Icons.arrow_forward_rounded,
                  size: 18,
                  color: Colors.white.withValues(alpha: .45),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class ModuleDetailPage extends StatefulWidget {
  const ModuleDetailPage({
    super.key,
    required this.module,
    required this.progress,
  });

  final CourseModule module;
  final ProgressStore progress;

  @override
  State<ModuleDetailPage> createState() => _ModuleDetailPageState();
}

class _ModuleDetailPageState extends State<ModuleDetailPage> {
  late final TextEditingController _notesController;
  Timer? _notesSaveTimer;
  String _notesSaveState = 'Saved locally';

  CourseModule get module => widget.module;
  ProgressStore get progress => widget.progress;

  @override
  void initState() {
    super.initState();
    _notesController = TextEditingController(text: progress.notesFor(module.id));
  }

  @override
  void dispose() {
    _notesSaveTimer?.cancel();
    unawaited(progress.setNotes(module.id, _notesController.text));
    _notesController.dispose();
    super.dispose();
  }

  void _scheduleNotesSave() {
    _notesSaveTimer?.cancel();
    setState(() => _notesSaveState = 'Saving…');
    _notesSaveTimer = Timer(
      const Duration(milliseconds: 650),
      _saveNotes,
    );
  }

  Future<void> _saveNotes() async {
    _notesSaveTimer?.cancel();
    await progress.setNotes(module.id, _notesController.text);
    if (!mounted) return;
    setState(() => _notesSaveState = 'Saved locally');
  }

  Future<void> _confirmResetState() async {
    final accepted = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reset module state?'),
        content: const Text(
          'This changes the module back to Not started. '
          'Your structured workspace and notes are kept.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Reset state'),
          ),
        ],
      ),
    );

    if (accepted == true) {
      await progress.setStage(module.id, ModuleStage.notStarted);
    }
  }

  Future<bool> _validateStructuredWorkspace(
    WorkspaceStore workspace,
  ) async {
    final issues = workspace.readinessIssues(module.id);
    if (issues.isEmpty) {
      await workspace.flush();
      return true;
    }

    if (!mounted) return false;
    await showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Workspace is not review-ready'),
        content: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 620),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Complete the required structured evidence before moving this module forward.',
                ),
                const SizedBox(height: 14),
                for (final issue in issues)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(
                          Icons.error_outline_rounded,
                          size: 18,
                          color: _warning,
                        ),
                        const SizedBox(width: 8),
                        Expanded(child: Text(issue)),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ),
        actions: [
          FilledButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Continue working'),
          ),
        ],
      ),
    );
    return false;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _ink,
      appBar: AppBar(
        backgroundColor: _ink,
        title: Text('Module ${module.id}'),
      ),
      body: AnimatedBuilder(
        animation: progress,
        builder: (context, _) {
          final stage = progress.stageFor(module.id);
          final stageColor = _stageColor(stage);
          final workspace = WorkspaceScope.of(context);
          return ListView(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 36),
            children: [
              Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 860),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            module.focus.toUpperCase(),
                            style: const TextStyle(
                              color: _accent,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1.2,
                            ),
                          ),
                          const Spacer(),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 11,
                              vertical: 7,
                            ),
                            decoration: BoxDecoration(
                              color: stageColor.withValues(alpha: .12),
                              borderRadius: BorderRadius.circular(999),
                              border: Border.all(
                                color: stageColor.withValues(alpha: .35),
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  _stageIcon(stage),
                                  size: 15,
                                  color: stageColor,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  stage.label,
                                  style: TextStyle(
                                    color: stageColor,
                                    fontWeight: FontWeight.w800,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Text(
                        module.title,
                        style: const TextStyle(
                          fontSize: 38,
                          height: 1.03,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        module.tagline,
                        style: const TextStyle(
                          fontSize: 17,
                          color: Colors.white70,
                          height: 1.45,
                        ),
                      ),
                      const SizedBox(height: 24),
                      _Panel(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Row(
                              children: [
                                Icon(
                                  Icons.auto_stories_outlined,
                                  color: _accent,
                                ),
                                SizedBox(width: 10),
                                Text(
                                  'Learn',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w900,
                                    fontSize: 18,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 14),
                            for (
                              var i = 0;
                              i < module.lessonPoints.length;
                              i++
                            ) ...[
                              _NumberedLine(
                                number: i + 1,
                                text: module.lessonPoints[i],
                              ),
                              if (i != module.lessonPoints.length - 1)
                                const SizedBox(height: 11),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),
                      _Panel(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Row(
                              children: [
                                Icon(Icons.task_alt_outlined, color: _success),
                                SizedBox(width: 10),
                                Text(
                                  'Do',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w900,
                                    fontSize: 18,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 14),
                            for (
                              var i = 0;
                              i < module.taskSteps.length;
                              i++
                            )
                              CheckboxListTile(
                                contentPadding: EdgeInsets.zero,
                                controlAffinity:
                                    ListTileControlAffinity.leading,
                                value: progress.taskDone(module.id, i),
                                onChanged: (_) =>
                                    progress.toggleTask(module.id, i),
                                title: Text(
                                  module.taskSteps[i],
                                  style: const TextStyle(
                                    color: Colors.white70,
                                    height: 1.4,
                                  ),
                                ),
                              ),
                            const SizedBox(height: 16),
                            Text(
                              'Deliverable: ${module.deliverable}',
                              style: const TextStyle(
                                color: Colors.white70,
                                height: 1.45,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),
                      _InfoBlock(
                        title: 'Quality gate',
                        icon: Icons.verified_outlined,
                        body: module.passGate,
                      ),
                      if (moduleWorkspaceDefinitions.containsKey(module.id)) ...[
                        const SizedBox(height: 14),
                        ModuleWorkspaceCard(moduleId: module.id),
                      ],
                      const SizedBox(height: 14),
                      _Panel(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Row(
                              children: [
                                Icon(Icons.edit_note_rounded, color: _warning),
                                SizedBox(width: 10),
                                Text(
                                  'Scratch notes',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w900,
                                    fontSize: 18,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            const Text(
                              'Use this for free-form research, draft wording, questions, feedback, and the single biggest weakness. Structured module evidence belongs in the workspace above.',
                              style: TextStyle(
                                color: Colors.white60,
                                height: 1.45,
                              ),
                            ),
                            const SizedBox(height: 14),
                            TextField(
                              controller: _notesController,
                              minLines: 5,
                              maxLines: 10,
                              onChanged: (_) => _scheduleNotesSave(),
                              decoration: const InputDecoration(
                                hintText:
                                    'Write your working notes for this module...',
                                alignLabelWithHint: true,
                              ),
                            ),
                            const SizedBox(height: 10),
                            Row(
                              children: [
                                Icon(
                                  _notesSaveState == 'Saving…'
                                      ? Icons.sync_rounded
                                      : Icons.cloud_done_outlined,
                                  size: 16,
                                  color: Colors.white54,
                                ),
                                const SizedBox(width: 7),
                                Text(
                                  _notesSaveState,
                                  style: const TextStyle(
                                    color: Colors.white54,
                                    fontSize: 12,
                                  ),
                                ),
                                const Spacer(),
                                TextButton.icon(
                                  onPressed: _saveNotes,
                                  icon: const Icon(
                                    Icons.save_outlined,
                                    size: 17,
                                  ),
                                  label: const Text('Save now'),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),
                      _Panel(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Module state',
                              style: TextStyle(
                                fontWeight: FontWeight.w900,
                                fontSize: 18,
                              ),
                            ),
                            const SizedBox(height: 8),
                            const Text(
                              'Submit the module for review when the real deliverable is complete. Only the Review workspace can record PASS or REVISE; filling the worksheet alone is not a pass.',
                              style: TextStyle(
                                color: Colors.white70,
                                height: 1.5,
                              ),
                            ),
                            const SizedBox(height: 16),
                            Wrap(
                              spacing: 10,
                              runSpacing: 10,
                              children: [
                                OutlinedButton.icon(
                                  onPressed: () => progress.setStage(
                                    module.id,
                                    ModuleStage.inProgress,
                                  ),
                                  icon: const Icon(Icons.play_arrow_rounded),
                                  label: const Text('Start / continue'),
                                ),
                                OutlinedButton.icon(
                                  onPressed: stage == ModuleStage.readyForReview ||
                                          stage == ModuleStage.passed
                                      ? null
                                      : () async {
                                          if (await _validateStructuredWorkspace(
                                            workspace,
                                          )) {
                                            await _saveNotes();
                                            await progress.submitForReview(
                                              module.id,
                                              evidenceSnapshot: workspace
                                                  .snapshotForModule(module.id),
                                            );
                                          }
                                        },
                                  icon: const Icon(Icons.rate_review_outlined),
                                  label: Text(
                                    stage == ModuleStage.readyForReview
                                        ? 'Submitted for review'
                                        : 'Ready for review',
                                  ),
                                ),
                                TextButton(
                                  onPressed: _confirmResetState,
                                  child: const Text('Reset state'),
                                ),
                              ],
                            ),
                            const SizedBox(height: 14),
                            OutlinedButton.icon(
                              onPressed: () => _openAsset(
                                context,
                                module.worksheetAsset,
                              ),
                              icon: const Icon(
                                Icons.picture_as_pdf_outlined,
                              ),
                              label: const Text('Open execution worksheet'),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),
                      const _InfoBlock(
                        title: 'Execution rule',
                        icon: Icons.bolt_outlined,
                        body:
                            'Do the real deliverable, review the single biggest weakness, repair it, then use the skill. Real replies, interviews, and client conversations take priority over hypothetical exercises.',
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _NumberedLine extends StatelessWidget {
  const _NumberedLine({required this.number, required this.text});

  final int number;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 26,
          height: 26,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: _accent.withValues(alpha: .12),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            '$number',
            style: const TextStyle(
              color: _accent,
              fontWeight: FontWeight.w900,
              fontSize: 12,
            ),
          ),
        ),
        const SizedBox(width: 11),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(top: 2),
            child: Text(
              text,
              style: const TextStyle(
                color: Colors.white70,
                height: 1.45,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _CommunityTeaser extends StatelessWidget {
  const _CommunityTeaser();

  @override
  Widget build(BuildContext context) {
    return const _Panel(
      padding: EdgeInsets.all(22),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.groups_2_outlined, color: _warning, size: 34),
          SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Clientbound Community', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
                SizedBox(height: 7),
                Text(
                  'A focused space for questions, wins, objection practice, anonymized outreach review, and instructor feedback.',
                  style: TextStyle(color: Colors.white60, height: 1.45),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PageFrame extends StatelessWidget {
  const _PageFrame({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(22, 26, 22, 42),
      children: [
        Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1180),
            child: child,
          ),
        ),
      ],
    );
  }
}

class _PageHeader extends StatelessWidget {
  const _PageHeader({required this.eyebrow, required this.title, required this.subtitle});

  final String eyebrow;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          eyebrow,
          style: const TextStyle(color: _accent, fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 1.3),
        ),
        const SizedBox(height: 10),
        Text(title, style: const TextStyle(fontSize: 34, height: 1.05, fontWeight: FontWeight.w900)),
        const SizedBox(height: 11),
        ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 760),
          child: Text(subtitle, style: const TextStyle(color: Colors.white60, height: 1.5, fontSize: 15)),
        ),
      ],
    );
  }
}

class _InfoBlock extends StatelessWidget {
  const _InfoBlock({required this.title, required this.icon, required this.body});

  final String title;
  final IconData icon;
  final String body;

  @override
  Widget build(BuildContext context) {
    return _Panel(
      padding: const EdgeInsets.all(20),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: _accent),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 17)),
                const SizedBox(height: 7),
                Text(body, style: const TextStyle(color: Colors.white70, height: 1.5)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Panel extends StatelessWidget {
  const _Panel({required this.child, this.padding = const EdgeInsets.all(16), this.onTap});

  final Widget child;
  final EdgeInsets padding;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final content = Container(
      padding: padding,
      decoration: BoxDecoration(
        color: _panel,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFF1B3049)),
      ),
      child: child,
    );
    if (onTap == null) return content;
    return Material(
      color: Colors.transparent,
      child: InkWell(borderRadius: BorderRadius.circular(20), onTap: onTap, child: content),
    );
  }
}

void _openModule(BuildContext context, CourseModule module, ProgressStore progress) {
  Navigator.of(context).push(
    MaterialPageRoute<void>(
      builder: (_) => ModuleDetailPage(module: module, progress: progress),
    ),
  );
}

Future<void> _openAsset(BuildContext context, String assetPath) async {
  final Uri uri;
  if (kIsWeb) {
    uri = Uri.base.resolve('assets/$assetPath');
  } else {
    uri = Uri.parse('https://graysonseven.github.io/clientbound/assets/$assetPath');
  }

  final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
  if (!ok && context.mounted) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Could not open this resource.')),
    );
  }
}
