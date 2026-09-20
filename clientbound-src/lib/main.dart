import 'package:flutter/material.dart';

import 'app.dart';
import 'community_store.dart';
import 'progress_store.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final progress = ProgressStore();
  final community = CommunityStore();
  await Future.wait([
    progress.load(),
    community.load(),
  ]);

  runApp(
    ClientboundApp(
      progress: progress,
      community: community,
    ),
  );
}
