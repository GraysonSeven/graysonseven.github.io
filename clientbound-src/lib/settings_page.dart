import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

import 'app_reload.dart';
import 'app_settings_store.dart';
import 'backup_file_service.dart';
import 'backup_service.dart';
import 'community_store.dart';
import 'progress_store.dart';
import 'review_exchange_store.dart';
import 'update_store.dart';
import 'workspace_store.dart';

class SettingsPage extends StatelessWidget {
  const SettingsPage({
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
    final backup = BackupService(
      progress: progress,
      community: community,
      settings: settings,
      workspace: workspace,
      reviewExchange: reviewExchange,
      appVersion: appVersion,
    );

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        padding: const EdgeInsets.all(22),
        children: [
          Text(
            'DATA, PRIVACY & APP',
            style: Theme.of(context).textTheme.labelLarge?.copyWith(
                  color: Theme.of(context).colorScheme.primary,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.2,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'Keep your Clientbound work safe and portable.',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.w900,
                ),
          ),
          const SizedBox(height: 22),
          _RecoveryWarnings(
            progress: progress,
            community: community,
            settings: settings,
            workspace: workspace,
            reviewExchange: reviewExchange,
          ),
          _Section(
            title: 'Version & updates',
            icon: Icons.system_update_alt_rounded,
            children: [
              AnimatedBuilder(
                animation: updates,
                builder: (context, _) {
                  final latest = updates.latest?.version;
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Installed: $appVersion'),
                      const SizedBox(height: 4),
                      Text(
                        latest == null
                            ? 'Latest: not checked yet'
                            : 'Latest: $latest',
                        style: const TextStyle(color: Colors.white60),
                      ),
                      if (updates.updateAvailable) ...[
                        const SizedBox(height: 10),
                        const Text(
                          'A newer Clientbound release is available.',
                          style: TextStyle(
                            color: Color(0xFF50D890),
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                      if (updates.error != null) ...[
                        const SizedBox(height: 8),
                        Text(
                          updates.error!,
                          style: const TextStyle(color: Colors.white54),
                        ),
                      ],
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 10,
                        runSpacing: 10,
                        children: [
                          OutlinedButton.icon(
                            onPressed: updates.checking
                                ? null
                                : updates.check,
                            icon: const Icon(Icons.refresh_rounded),
                            label: Text(
                              updates.checking
                                  ? 'Checking…'
                                  : 'Check for updates',
                            ),
                          ),
                          if (updates.updateAvailable)
                            FilledButton.icon(
                              onPressed: () =>
                                  _openLatest(context, updates),
                              icon: const Icon(Icons.upgrade_rounded),
                              label: Text(
                                kIsWeb
                                    ? 'Reload latest version'
                                    : 'Open latest release',
                              ),
                            ),
                        ],
                      ),
                    ],
                  );
                },
              ),
            ],
          ),
          const SizedBox(height: 14),
          _Section(
            title: 'Backup & restore',
            icon: Icons.backup_outlined,
            children: [
              const Text(
                'Your Clientbound work is local-first. Export a backup before browser resets, device changes, or major experiments.',
                style: TextStyle(color: Colors.white70, height: 1.5),
              ),
              const SizedBox(height: 14),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  FilledButton.icon(
                    onPressed: () => _saveBackupFile(context, backup),
                    icon: const Icon(Icons.save_alt_rounded),
                    label: const Text('Save backup file'),
                  ),
                  OutlinedButton.icon(
                    onPressed: () => _restoreBackupFile(context, backup),
                    icon: const Icon(Icons.file_open_outlined),
                    label: const Text('Restore backup file'),
                  ),
                  OutlinedButton.icon(
                    onPressed: () => _copyBackup(context, backup),
                    icon: const Icon(Icons.copy_all_rounded),
                    label: const Text('Copy backup JSON'),
                  ),
                  TextButton.icon(
                    onPressed: () => _restoreBackupJson(context, backup),
                    icon: const Icon(Icons.content_paste_go_rounded),
                    label: const Text('Paste backup JSON'),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 14),
          const _Section(
            title: 'Privacy & data',
            icon: Icons.privacy_tip_outlined,
            children: [
              Text(
                'Clientbound currently uses no learner account, analytics SDK, advertising SDK, Firebase backend, Railway runtime, paid domain, payment system, or billing-backed cloud service.',
                style: TextStyle(color: Colors.white70, height: 1.5),
              ),
              SizedBox(height: 10),
              Text(
                'Progress, structured module workspaces, tasks, notes, review feedback, imported review-exchange packages, settings, and Practice Board activity are stored locally. Course PDFs open from the free Clientbound GitHub Pages deployment.',
                style: TextStyle(color: Colors.white60, height: 1.5),
              ),
            ],
          ),
          const SizedBox(height: 14),
          AnimatedBuilder(
            animation: settings,
            builder: (context, _) => _Section(
              title: 'Preferences',
              icon: Icons.tune_rounded,
              children: [
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  value: settings.reducedMotion,
                  onChanged: settings.setReducedMotion,
                  title: const Text('Reduce motion'),
                  subtitle: const Text(
                    'Prefer simpler transitions where Clientbound supports them.',
                  ),
                ),
                const SizedBox(height: 6),
                OutlinedButton.icon(
                  onPressed: () async {
                    await settings.restartOnboarding();
                    if (context.mounted) {
                      Navigator.of(context).popUntil(
                        (route) => route.isFirst,
                      );
                    }
                  },
                  icon: const Icon(Icons.replay_rounded),
                  label: const Text('Show onboarding again'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          _Section(
            title: 'Release links',
            icon: Icons.open_in_new_rounded,
            children: [
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Clientbound Web'),
                subtitle: const Text(
                  'graysonseven.github.io/clientbound/',
                ),
                trailing: const Icon(Icons.open_in_new_rounded),
                onTap: () => launchUrl(
                  Uri.parse(
                    'https://graysonseven.github.io/clientbound/',
                  ),
                  mode: LaunchMode.externalApplication,
                ),
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Android releases'),
                subtitle: const Text('GitHub Releases'),
                trailing: const Icon(Icons.android_rounded),
                onTap: () => launchUrl(
                  Uri.parse(
                    'https://github.com/GraysonSeven/graysonseven.github.io/releases',
                  ),
                  mode: LaunchMode.externalApplication,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          _Section(
            title: 'Reset',
            icon: Icons.delete_outline_rounded,
            children: [
              const Text(
                'Resetting removes local learning progress and restores the Practice Board defaults. Export a backup first.',
                style: TextStyle(color: Colors.white60, height: 1.45),
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: () => _resetLocalData(context),
                icon: const Icon(Icons.delete_forever_outlined),
                label: const Text('Reset local learning data'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Future<void> _openLatest(
    BuildContext context,
    UpdateStore updates,
  ) async {
    if (kIsWeb) {
      final reloaded = await reloadClientbound();
      if (reloaded) return;
    }

    final url = kIsWeb
        ? updates.latest?.web ??
            'https://graysonseven.github.io/clientbound/'
        : 'https://github.com/GraysonSeven/graysonseven.github.io/releases';
    final opened = await launchUrl(
      Uri.parse(url),
      mode: LaunchMode.externalApplication,
    );
    if (!opened && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open the latest release.')),
      );
    }
  }

  Future<void> _saveBackupFile(
    BuildContext context,
    BackupService backup,
  ) async {
    final json = backup.createBackupJson();
    final filename = BackupFileService.filenameForDate(DateTime.now());

    try {
      final saved = await BackupFileService.saveBackup(
        contents: json,
        filename: filename,
      );
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            saved ? 'Clientbound backup file saved.' : 'Backup save canceled.',
          ),
        ),
      );
    } catch (error) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not save backup file: $error')),
      );
    }
  }

  Future<void> _restoreBackupFile(
    BuildContext context,
    BackupService backup,
  ) async {
    try {
      final raw = await BackupFileService.pickBackupText();
      if (raw == null) return;
      await backup.restoreBackupJson(raw);
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Backup file restored successfully.')),
      );
    } catch (error) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Backup file restore rejected: $error')),
      );
    }
  }

  Future<void> _copyBackup(
    BuildContext context,
    BackupService backup,
  ) async {
    await Clipboard.setData(
      ClipboardData(text: backup.createBackupJson()),
    );
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Backup JSON copied to clipboard.')),
      );
    }
  }

  Future<void> _restoreBackupJson(
    BuildContext context,
    BackupService backup,
  ) async {
    final controller = TextEditingController();
    final accepted = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Paste Clientbound backup JSON'),
        content: SizedBox(
          width: 620,
          child: TextField(
            controller: controller,
            minLines: 8,
            maxLines: 16,
            decoration: const InputDecoration(
              hintText: 'Paste the complete Clientbound backup JSON here.',
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Validate & restore JSON'),
          ),
        ],
      ),
    );

    if (accepted != true) {
      controller.dispose();
      return;
    }

    try {
      await backup.restoreBackupJson(controller.text);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Backup restored successfully.'),
          ),
        );
      }
    } catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Backup restore rejected: $error'),
          ),
        );
      }
    } finally {
      controller.dispose();
    }
  }

  Future<void> _resetLocalData(BuildContext context) async {
    final accepted = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reset local learning data?'),
        content: const Text(
          'This removes module progress, structured workspaces, notes, tasks, review feedback, imported review-exchange packages, and local Practice Board posts. This cannot be undone without a backup.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Reset'),
          ),
        ],
      ),
    );
    if (accepted != true) return;

    await progress.reset();
    await workspace.reset();
    await community.resetToSeed();
    await reviewExchange.reset();
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Local learning data reset.')),
      );
    }
  }
}

class _RecoveryWarnings extends StatelessWidget {
  const _RecoveryWarnings({
    required this.progress,
    required this.community,
    required this.settings,
    required this.workspace,
    required this.reviewExchange,
  });

  final ProgressStore progress;
  final CommunityStore community;
  final AppSettingsStore settings;
  final WorkspaceStore workspace;
  final ReviewExchangeStore reviewExchange;

  @override
  Widget build(BuildContext context) {
    final warnings = <String>[
      if (progress.recoveryWarning != null) progress.recoveryWarning!,
      if (community.recoveryWarning != null) community.recoveryWarning!,
      if (settings.recoveryWarning != null) settings.recoveryWarning!,
      if (workspace.recoveryWarning != null) workspace.recoveryWarning!,
      if (reviewExchange.recoveryWarning != null) reviewExchange.recoveryWarning!,
    ];
    if (warnings.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Icon(Icons.health_and_safety_outlined),
                  SizedBox(width: 8),
                  Text(
                    'Recovery notice',
                    style: TextStyle(fontWeight: FontWeight.w900),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              for (final warning in warnings)
                Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Text(
                    warning,
                    style: const TextStyle(
                      color: Colors.white70,
                      height: 1.4,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({
    required this.title,
    required this.icon,
    required this.children,
  });

  final String title;
  final IconData icon;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: Theme.of(context).colorScheme.primary),
                const SizedBox(width: 9),
                Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 18,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            ...children,
          ],
        ),
      ),
    );
  }
}
