import 'package:flutter/material.dart';

import 'app.dart';
import 'progress_store.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final progress = ProgressStore();
  await progress.load();
  runApp(FirstClientSalesSystemApp(progress: progress));
}
