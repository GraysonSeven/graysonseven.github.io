import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:clientbound/home_dashboard.dart';
import 'package:clientbound/progress_store.dart';
import 'package:clientbound/workspace_store.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues(<String, Object>{});
  });

  testWidgets('Home makes the next action dominant on mobile', (tester) async {
    final progress = ProgressStore();
    final workspace = WorkspaceStore();
    await progress.load();
    await workspace.load();

    var toolkitOpened = false;
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(
      MaterialApp(
        theme: ThemeData.dark(useMaterial3: true),
        home: Scaffold(
          body: HomeDashboard(
            progress: progress,
            workspace: workspace,
            onOpenCourse: () {},
            onOpenReview: () {},
            onOpenToolkit: () => toolkitOpened = true,
            onOpenModule: (_) {},
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Know the next move.'), findsOneWidget);
    expect(find.text('What you should do now'), findsOneWidget);
    expect(find.textContaining('Module 1 · Offer Foundation'), findsOneWidget);
    expect(find.text('NOT STARTED'), findsWidgets);
    expect(
      find.text('I have a live prospect/client situation'),
      findsOneWidget,
    );

    await tester.scrollUntilVisible(
      find.text('Open live-situation tools'),
      250,
    );
    await tester.tap(find.text('Open live-situation tools'));
    await tester.pump();
    expect(toolkitOpened, isTrue);
  });

  testWidgets('Home keeps current path and progress readable on desktop', (
    tester,
  ) async {
    final progress = ProgressStore();
    final workspace = WorkspaceStore();
    await progress.load();
    await workspace.load();
    await progress.recordPass(1);
    await progress.setStage(2, ModuleStage.inProgress);

    await tester.binding.setSurfaceSize(const Size(1280, 900));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(
      MaterialApp(
        theme: ThemeData.dark(useMaterial3: true),
        home: Scaffold(
          body: HomeDashboard(
            progress: progress,
            workspace: workspace,
            onOpenCourse: () {},
            onOpenReview: () {},
            onOpenToolkit: () {},
            onOpenModule: (_) {},
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.textContaining('Module 2 · ICP & Lead Research'), findsWidgets);
    expect(find.text('WORKING'), findsOneWidget);
    expect(find.text('Your learning path'), findsOneWidget);
    expect(find.text('First module passed'), findsOneWidget);
    expect(find.text('7%'), findsOneWidget);
  });
}
