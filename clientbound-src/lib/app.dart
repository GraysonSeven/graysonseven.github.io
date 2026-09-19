import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import 'course_catalog.dart';
import 'progress_store.dart';

const _ink = Color(0xFF07111F);
const _panel = Color(0xFF0E1B2D);
const _panelSoft = Color(0xFF14243A);
const _accent = Color(0xFF6EA8FE);
const _success = Color(0xFF50D890);
const _warning = Color(0xFFFFC857);

class ClientboundApp extends StatelessWidget {
  const ClientboundApp({super.key, required this.progress});

  final ProgressStore progress;

  @override
  Widget build(BuildContext context) {
    final scheme = ColorScheme.fromSeed(
      seedColor: _accent,
      brightness: Brightness.dark,
      surface: _panel,
    );
    return MaterialApp(
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
      home: AppShell(progress: progress),
    );
  }
}

class AppShell extends StatefulWidget {
  const AppShell({super.key, required this.progress});

  final ProgressStore progress;

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _index = 0;

  static const _labels = ['Home', 'Classroom', 'Community', 'Toolkit'];
  static const _icons = [
    Icons.home_outlined,
    Icons.school_outlined,
    Icons.forum_outlined,
    Icons.folder_outlined,
  ];

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: widget.progress,
      builder: (context, _) {
        final pages = <Widget>[
          HomePage(progress: widget.progress, onOpenCourse: () => setState(() => _index = 1)),
          CoursePage(progress: widget.progress),
          const CommunityPage(),
          const ResourcesPage(),
        ];

        return LayoutBuilder(
          builder: (context, constraints) {
            final wide = constraints.maxWidth >= 900;
            return Scaffold(
              body: SafeArea(
                child: Row(
                  children: [
                    if (wide)
                      _SideNav(
                        index: _index,
                        labels: _labels,
                        icons: _icons,
                        onSelected: (value) => setState(() => _index = value),
                      ),
                    Expanded(child: pages[_index]),
                  ],
                ),
              ),
              bottomNavigationBar: wide
                  ? null
                  : NavigationBar(
                      selectedIndex: _index,
                      onDestinationSelected: (value) => setState(() => _index = value),
                      destinations: List.generate(
                        _labels.length,
                        (i) => NavigationDestination(
                          icon: Icon(_icons[i]),
                          selectedIcon: Icon(_icons[i], color: _accent),
                          label: _labels[i],
                        ),
                      ),
                    ),
            );
          },
        );
      },
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
      color: selected ? _accent.withOpacity(.14) : Colors.transparent,
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
  const HomePage({super.key, required this.progress, required this.onOpenCourse});

  final ProgressStore progress;
  final VoidCallback onOpenCourse;

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
          const SizedBox(height: 28),
          Row(
            children: [
              const Expanded(
                child: Text('Your classroom', style: TextStyle(fontSize: 21, fontWeight: FontWeight.w800)),
              ),
              TextButton(onPressed: onOpenCourse, child: const Text('View all 14 modules')),
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
          const Text('Course progress', style: TextStyle(color: Colors.white60)),
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
            '${progress.completed.length} of 14 modules completed',
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
    final complete = progress.isCompleted(module.id);
    return _Panel(
      onTap: () => _openModule(context, module, progress),
      padding: const EdgeInsets.all(19),
      child: SizedBox(
        height: 210,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: complete ? _success.withOpacity(.16) : _accent.withOpacity(.14),
                    borderRadius: BorderRadius.circular(11),
                  ),
                  child: Icon(
                    complete ? Icons.check_rounded : module.icon,
                    color: complete ? _success : _accent,
                    size: 21,
                  ),
                ),
                const Spacer(),
                Text(
                  '${module.id.toString().padLeft(2, '0')} / 14',
                  style: const TextStyle(color: Colors.white38, fontWeight: FontWeight.w700, fontSize: 12),
                ),
              ],
            ),
            const SizedBox(height: 17),
            Text(module.title, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
            const SizedBox(height: 8),
            Text(
              module.tagline,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: Colors.white60, height: 1.4, fontSize: 13),
            ),
            const Spacer(),
            Row(
              children: [
                Text(
                  module.focus.toUpperCase(),
                  style: const TextStyle(color: _accent, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: .9),
                ),
                const Spacer(),
                Icon(Icons.arrow_forward_rounded, size: 18, color: Colors.white.withOpacity(.45)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class ModuleDetailPage extends StatelessWidget {
  const ModuleDetailPage({super.key, required this.module, required this.progress});

  final CourseModule module;
  final ProgressStore progress;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _ink,
      appBar: AppBar(backgroundColor: _ink, title: Text('Module ${module.id}')),
      body: AnimatedBuilder(
        animation: progress,
        builder: (context, _) {
          final complete = progress.isCompleted(module.id);
          return ListView(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 36),
            children: [
              Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 860),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        module.focus.toUpperCase(),
                        style: const TextStyle(color: _accent, fontWeight: FontWeight.w900, letterSpacing: 1.2),
                      ),
                      const SizedBox(height: 10),
                      Text(module.title, style: const TextStyle(fontSize: 38, height: 1.03, fontWeight: FontWeight.w900)),
                      const SizedBox(height: 12),
                      Text(module.tagline, style: const TextStyle(fontSize: 17, color: Colors.white70, height: 1.45)),
                      const SizedBox(height: 24),
                      _InfoBlock(title: 'Required deliverable', icon: Icons.inventory_2_outlined, body: module.deliverable),
                      const SizedBox(height: 14),
                      _InfoBlock(title: 'Quality gate', icon: Icons.verified_outlined, body: module.passGate),
                      const SizedBox(height: 14),
                      _Panel(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Execution rule', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 17)),
                            const SizedBox(height: 8),
                            const Text(
                              'Do the real deliverable, review the single biggest weakness, repair it, then use the skill. A checked box is not proof of competence.',
                              style: TextStyle(color: Colors.white70, height: 1.5),
                            ),
                            const SizedBox(height: 18),
                            Wrap(
                              spacing: 10,
                              runSpacing: 10,
                              children: [
                                OutlinedButton.icon(
                                  onPressed: () => _openAsset(context, module.worksheetAsset),
                                  icon: const Icon(Icons.picture_as_pdf_outlined),
                                  label: const Text('Open worksheet'),
                                ),
                                FilledButton.icon(
                                  onPressed: () => progress.setCompleted(module.id, !complete),
                                  icon: Icon(complete ? Icons.undo_rounded : Icons.check_circle_outline),
                                  label: Text(complete ? 'Mark incomplete' : 'Mark completed'),
                                ),
                              ],
                            ),
                          ],
                        ),
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

class CommunityPage extends StatelessWidget {
  const CommunityPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const _PageFrame(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _PageHeader(
            eyebrow: 'COMMUNITY',
            title: 'The Clientbound community.',
            subtitle: 'Questions, wins, practice, feedback, and real sales conversations in one focused learning community.',
          ),
          SizedBox(height: 24),
          _CommunityPost(
            badge: 'SYSTEM',
            title: 'How this community will work',
            body: 'Post real questions, share anonymized outreach examples, practice objections, report wins, and get feedback. No fake case studies, spam, or confidential client information.',
          ),
          SizedBox(height: 14),
          _CommunityPost(
            badge: 'INSTRUCTOR',
            title: 'Real opportunities outrank lessons',
            body: 'If a prospect replies, an interview appears, or a client asks a question, handle the live opportunity first. Return to the module after the opportunity is stabilized.',
          ),
          SizedBox(height: 14),
          _CommunityPost(
            badge: 'NEXT RELEASE',
            title: 'Cloud community',
            body: 'Firebase authentication, synced progress, posts, comments, reactions, announcements, and moderation will turn this preview into the full Skool-style community layer.',
          ),
        ],
      ),
    );
  }
}

class ResourcesPage extends StatelessWidget {
  const ResourcesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return _PageFrame(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _PageHeader(
            eyebrow: 'TOOLKIT',
            title: 'Your sales toolkit',
            subtitle: 'Use the smallest useful resource for the task in front of you. The web release can open bundled PDFs directly.',
          ),
          const SizedBox(height: 24),
          _ResourceTile(
            icon: Icons.menu_book_outlined,
            title: 'Complete course',
            subtitle: 'The First Client Sales System reference PDF',
            onTap: () => _openAsset(context, 'The-First-Client-Sales-System.pdf'),
          ),
          const SizedBox(height: 12),
          for (final module in courseModules) ...[
            _ResourceTile(
              icon: module.icon,
              title: 'Module ${module.id}: ${module.title}',
              subtitle: 'Execution worksheet PDF',
              onTap: () => _openAsset(context, module.worksheetAsset),
            ),
            const SizedBox(height: 12),
          ],
        ],
      ),
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

class _CommunityPost extends StatelessWidget {
  const _CommunityPost({required this.badge, required this.title, required this.body});

  final String badge;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return _Panel(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(badge, style: const TextStyle(color: _accent, fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 1)),
          const SizedBox(height: 8),
          Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
          const SizedBox(height: 8),
          Text(body, style: const TextStyle(color: Colors.white70, height: 1.5)),
        ],
      ),
    );
  }
}

class _ResourceTile extends StatelessWidget {
  const _ResourceTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return _Panel(
      onTap: onTap,
      padding: const EdgeInsets.all(18),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(color: _accent.withOpacity(.12), borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: _accent),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.w800)),
                const SizedBox(height: 3),
                Text(subtitle, style: const TextStyle(color: Colors.white54, fontSize: 12)),
              ],
            ),
          ),
          const Icon(Icons.open_in_new_rounded, size: 18, color: Colors.white38),
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
