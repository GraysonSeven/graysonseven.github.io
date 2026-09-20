import 'package:clientbound/app.dart';
import 'package:clientbound/course_catalog.dart';
import 'package:clientbound/progress_store.dart';
import 'package:clientbound/review_page.dart';
import 'package:clientbound/workspace_schema.dart';
import 'package:clientbound/workspace_store.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets(
    'learner module cannot PASS and incomplete evidence cannot submit',
    (tester) async {
      SharedPreferences.setMockInitialValues({});

      final progress = ProgressStore();
      final workspace = WorkspaceStore();
      await progress.load();
      await workspace.load();

      await tester.pumpWidget(
        WorkspaceScope(
          store: workspace,
          child: MaterialApp(
            home: ModuleDetailPage(
              module: courseModules.first,
              progress: progress,
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Record PASS'), findsNothing);

      final ready = find.text('Ready for review');
      await tester.ensureVisible(ready);
      await tester.tap(ready);
      await tester.pumpAndSettle();

      expect(find.text('Workspace is not review-ready'), findsOneWidget);
      expect(progress.stageFor(1), isNot(ModuleStage.readyForReview));
      expect(progress.reviewSubmissionsFor(1), isEmpty);

      await tester.tap(find.text('Continue working'));
      await tester.pumpAndSettle();

      workspace.setString(1, 'niche', 'Industrial manufacturers');
      workspace.setString(1, 'buyer', 'Sales manager');
      workspace.setString(
        1,
        'scope',
        'Lead research and outbound appointment-setting support.',
      );
      workspace.setString(
        1,
        'offer',
        'I help industrial companies build qualified outbound pipeline.',
      );

      final clients = moduleWorkspaceDefinitions[1]!
          .fields
          .firstWhere((field) => field.key == 'candidateClients');
      workspace.ensureTableRows(
        1,
        clients.key,
        clients.columns.map((column) => column.key),
        10,
      );

      for (var row = 0; row < 10; row++) {
        workspace.setTableCell(
          1,
          clients.key,
          row,
          'company',
          'Company ${row + 1}',
        );
        workspace.setTableCell(
          1,
          clients.key,
          row,
          'website',
          'https://example.com/${row + 1}',
        );
        workspace.setTableCell(
          1,
          clients.key,
          row,
          'whyFit',
          'Verified fit reason ${row + 1}',
        );
      }

      expect(workspace.readinessIssues(1), isEmpty);

      await tester.pump();
      await tester.ensureVisible(find.text('Ready for review'));
      await tester.tap(find.text('Ready for review'));
      await tester.pumpAndSettle();

      expect(progress.stageFor(1), ModuleStage.readyForReview);
      expect(progress.reviewSubmissionsFor(1), hasLength(1));
      expect(find.text('Record PASS'), findsNothing);
    },
  );

  testWidgets('Review page is the local PASS / REVISE decision surface',
      (tester) async {
    SharedPreferences.setMockInitialValues({});

    final progress = ProgressStore();
    final workspace = WorkspaceStore();
    await progress.load();
    await workspace.load();

    await progress.submitForReview(
      1,
      evidenceSnapshot: <String, dynamic>{
        'niche': 'Industrial manufacturers',
      },
    );

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ReviewPage(
            progress: progress,
            workspace: workspace,
            appVersion: '0.7.0+7',
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('PASS'), findsOneWidget);
    expect(find.text('REVISE'), findsOneWidget);
    expect(find.text('Copy Review Package'), findsOneWidget);
    expect(find.text('Copy JSON'), findsOneWidget);
  });
}
