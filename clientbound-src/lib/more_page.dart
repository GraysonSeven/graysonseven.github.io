import 'package:flutter/material.dart';

import 'app_settings_store.dart';
import 'community_store.dart';
import 'progress_store.dart';
import 'review_page.dart';
import 'settings_page.dart';
import 'update_store.dart';

class MorePage extends StatelessWidget {
  const MorePage({
    super.key,
    required this.progress,
    required this.community,
    required this.settings,
    required this.updates,
    required this.appVersion,
  });

  final ProgressStore progress;
  final CommunityStore community;
  final AppSettingsStore settings;
  final UpdateStore updates;
  final String appVersion;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(22),
      children: [
        Text(
          'MORE',
          style: Theme.of(context).textTheme.labelLarge?.copyWith(
                color: Theme.of(context).colorScheme.primary,
                fontWeight: FontWeight.w900,
                letterSpacing: 1.2,
              ),
        ),
        const SizedBox(height: 8),
        Text(
          'Review, settings, data, and app controls.',
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.w900,
              ),
        ),
        const SizedBox(height: 20),
        Card(
          child: ListTile(
            contentPadding: const EdgeInsets.all(18),
            leading: const Icon(Icons.fact_check_outlined),
            title: const Text(
              'Instructor Review',
              style: TextStyle(fontWeight: FontWeight.w900),
            ),
            subtitle: Text(
              progress.readyForReviewCount == 0
                  ? 'No modules waiting for review.'
                  : '${progress.readyForReviewCount} module(s) ready for review.',
            ),
            trailing: const Icon(Icons.arrow_forward_rounded),
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => ReviewPage(progress: progress),
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),
        Card(
          child: ListTile(
            contentPadding: const EdgeInsets.all(18),
            leading: const Icon(Icons.settings_outlined),
            title: const Text(
              'Settings & Data',
              style: TextStyle(fontWeight: FontWeight.w900),
            ),
            subtitle: const Text(
              'Backup, restore, updates, privacy, and preferences.',
            ),
            trailing: const Icon(Icons.arrow_forward_rounded),
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => SettingsPage(
                  progress: progress,
                  community: community,
                  settings: settings,
                  updates: updates,
                  appVersion: appVersion,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
