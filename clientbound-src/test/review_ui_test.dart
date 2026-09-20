import 'dart:io';

import 'package:clientbound/progress_store.dart';
import 'package:clientbound/review_exchange_store.dart';
import 'package:clientbound/review_page.dart';
import 'package:clientbound/workspace_schema.dart';
import 'package:clientbound/workspace_store.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  test(
    'learner path has no direct PASS action and readiness gates submission',
    () async {
      final appSource = File('lib/app.dart').readAsStringSync();

      expect(
        appSource,
        isNot(contains("label: const Text('Record PASS')")),
      );
      expect(appSource, contains('_validateStructuredWorkspace'));
      expect(appSource, contains('progress.submitForReview'));
      expect(appSource, contains('snapshotForModule(module.id)'));

      SharedPreferences.setMockInitialValues({});

      final progress = ProgressStore();
      final workspace = WorkspaceStore();
      await progress.load();
      await workspace.load();

      expect(workspace.readinessIssues(1), isNotEmpty);
      expect(progress.stageFor(1), isNot(ModuleStage.readyForReview));
      expect(progress.reviewSubmissionsFor(1), isEmpty);

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

      await progress.submitForReview(
        1,
        evidenceSnapshot: workspace.snapshotForModule(1),
      );

      expect(progress.stageFor(1), ModuleStage.readyForReview);
      expect(progress.reviewSubmissionsFor(1), hasLength(1));
      expect(
        progress.latestReviewSubmissionFor(1)!.evidenceSnapshot['niche'],
        'Industrial manufacturers',
      );
    },
  );

  testWidgets('Review page is the local PASS / REVISE decision surface',
      (tester) async {
    SharedPreferences.setMockInitialValues({});

    final progress = ProgressStore();
    final workspace = WorkspaceStore();
    final reviewExchange = ReviewExchangeStore();
    await progress.load();
    await workspace.load();
    await reviewExchange.load();

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
            reviewExchange: reviewExchange,
            appVersion: '0.8.0+8',
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
