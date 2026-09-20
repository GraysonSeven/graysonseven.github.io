import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

import 'course_catalog.dart';

class ToolkitPage extends StatelessWidget {
  const ToolkitPage({super.key});

  static const _tools = <({String title, String category, String content})>[
    (
      title: 'Offer Builder',
      category: 'Positioning',
      content:
          'I help [type of company] get more [desired outcome] by [specific service / mechanism].\n\nCheck: one market, one buyer, bounded scope, no unsupported promise.',
    ),
    (
      title: 'Four-Proof Lead Check',
      category: 'Research',
      content:
          '1. Company proof — account fits the ICP.\n2. Role proof — contact has plausible responsibility.\n3. Contact proof — legitimate route exists; never guess.\n4. Reason proof — account-specific relevance supported by evidence.',
    ),
    (
      title: 'Cold Outreach Skeleton',
      category: 'Outreach',
      content:
          'Observation: one verified reason this company is relevant.\nRelevance: why that may matter.\nCapability: what you can honestly help with.\nAsk: one low-friction next step.\n\nDo not fake familiarity or invent a problem.',
    ),
    (
      title: 'Off-Script Recovery',
      category: 'Calling',
      content:
          '1. Acknowledge what they actually said.\n2. Answer the question if you can.\n3. If you cannot, say so clearly.\n4. Ask one relevant question.\n5. Return to the next useful step—not blindly to the script.',
    ),
    (
      title: 'Discovery Prep',
      category: 'Discovery',
      content:
          'Before the call: what they sell, who they sell to, likely sales motion, one verified observation, three priority questions, one useful artifact, and the desired next step.',
    ),
    (
      title: 'Paid Pilot Frame',
      category: 'Conversion',
      content:
          'Problem → objective → bounded scope → deliverables → client responsibilities → process/funnel metrics → duration → compensation → review point.\n\nNever guarantee outcomes outside your control.',
    ),
    (
      title: 'Weekly Review',
      category: 'Metrics',
      content:
          'Track accounts researched, prospects added, touches, follow-ups, replies, positive interest, qualified opportunities, meetings booked/held, objections, one experiment, and next actions.',
    ),
    (
      title: 'Acquisition Tracker Fields',
      category: 'Pipeline',
      content:
          'Company · website · lane · contact · role · contact route · fit score · priority · status · first touch · last touch · next action · next-action date · source URL · reply/outcome · notes.',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(22),
      children: [
        Text(
          'TOOLKIT',
          style: Theme.of(context).textTheme.labelLarge?.copyWith(
                color: Theme.of(context).colorScheme.primary,
                fontWeight: FontWeight.w900,
                letterSpacing: 1.2,
              ),
        ),
        const SizedBox(height: 8),
        Text(
          'Use the smallest tool that helps the next real task.',
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.w900,
              ),
        ),
        const SizedBox(height: 8),
        const Text(
          'Copy working frameworks directly or open the full course and execution worksheets.',
          style: TextStyle(color: Colors.white60, height: 1.45),
        ),
        const SizedBox(height: 20),
        Text(
          'Working tools',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w900,
              ),
        ),
        const SizedBox(height: 10),
        for (final tool in _tools) ...[
          Card(
            child: ListTile(
              contentPadding: const EdgeInsets.all(16),
              title: Text(
                tool.title,
                style: const TextStyle(fontWeight: FontWeight.w800),
              ),
              subtitle: Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text(tool.category),
              ),
              trailing: const Icon(Icons.arrow_forward_rounded),
              onTap: () => _showTool(context, tool),
            ),
          ),
          const SizedBox(height: 10),
        ],
        const SizedBox(height: 18),
        Text(
          'Resource library',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w900,
              ),
        ),
        const SizedBox(height: 10),
        Card(
          child: ListTile(
            contentPadding: const EdgeInsets.all(16),
            leading: const Icon(Icons.menu_book_outlined),
            title: const Text(
              'Complete First Client Sales System',
              style: TextStyle(fontWeight: FontWeight.w800),
            ),
            subtitle: const Text('Reference course PDF'),
            trailing: const Icon(Icons.open_in_new_rounded),
            onTap: () => _openResource(
              context,
              'The-First-Client-Sales-System.pdf',
            ),
          ),
        ),
        const SizedBox(height: 10),
        for (final module in courseModules) ...[
          Card(
            child: ListTile(
              contentPadding: const EdgeInsets.all(16),
              leading: Icon(module.icon),
              title: Text(
                'Module ${module.id}: ${module.title}',
                style: const TextStyle(fontWeight: FontWeight.w800),
              ),
              subtitle: const Text('Execution worksheet PDF'),
              trailing: const Icon(Icons.open_in_new_rounded),
              onTap: () => _openResource(
                context,
                module.worksheetAsset,
              ),
            ),
          ),
          const SizedBox(height: 10),
        ],
      ],
    );
  }

  void _showTool(
    BuildContext context,
    ({String title, String category, String content}) tool,
  ) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(22, 4, 22, 28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                tool.category.toUpperCase(),
                style: TextStyle(
                  color: Theme.of(context).colorScheme.primary,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1,
                  fontSize: 11,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                tool.title,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w900,
                    ),
              ),
              const SizedBox(height: 14),
              SelectableText(
                tool.content,
                style: const TextStyle(height: 1.55),
              ),
              const SizedBox(height: 18),
              FilledButton.icon(
                onPressed: () async {
                  await Clipboard.setData(
                    ClipboardData(text: tool.content),
                  );
                  if (context.mounted) {
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Copied to clipboard.')),
                    );
                  }
                },
                icon: const Icon(Icons.copy_rounded),
                label: const Text('Copy'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _openResource(
    BuildContext context,
    String path,
  ) async {
    final uri = kIsWeb
        ? Uri.base.resolve('assets/$path')
        : Uri.parse(
            'https://graysonseven.github.io/clientbound/assets/$path',
          );
    final opened = await launchUrl(
      uri,
      mode: LaunchMode.externalApplication,
    );
    if (!opened && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open this resource.')),
      );
    }
  }
}
