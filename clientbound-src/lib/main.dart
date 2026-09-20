import 'dart:async';

import 'package:flutter/material.dart';

import 'app.dart';
import 'app_constants.dart';
import 'app_settings_store.dart';
import 'community_store.dart';
import 'progress_store.dart';
import 'review_exchange_store.dart';
import 'update_store.dart';
import 'workspace_store.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final progress = ProgressStore();
  final community = CommunityStore();
  final settings = AppSettingsStore();
  final updates = UpdateStore(currentVersion: clientboundVersion);
  final workspace = WorkspaceStore();
  final reviewExchange = ReviewExchangeStore();

  await Future.wait([
    progress.load(),
    community.load(),
    settings.load(),
    workspace.load(),
    reviewExchange.load(),
  ]);

  runApp(
    ClientboundApp(
      progress: progress,
      community: community,
      settings: settings,
      updates: updates,
      workspace: workspace,
      reviewExchange: reviewExchange,
      appVersion: clientboundVersion,
    ),
  );

  unawaited(updates.check());
}
