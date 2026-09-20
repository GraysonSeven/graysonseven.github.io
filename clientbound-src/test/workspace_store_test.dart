import 'package:clientbound/workspace_schema.dart';
import 'package:clientbound/workspace_store.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  test('module 1 workspace requires evidence before review', () async {
    SharedPreferences.setMockInitialValues({});
    final store = WorkspaceStore();
    await store.load();

    expect(store.readinessIssues(1), isNotEmpty);

    store.setString(1, 'niche', 'Industrial manufacturers');
    store.setString(1, 'buyer', 'Sales manager');
    store.setString(1, 'scope', 'Lead research and outbound support.');
    store.setString(
      1,
      'offer',
      'I help industrial companies build qualified outbound pipeline.',
    );

    final field = moduleWorkspaceDefinitions[1]!
        .fields
        .firstWhere((item) => item.key == 'candidateClients');

    for (var row = 0; row < 10; row++) {
      store.addTableRow(
        1,
        field.key,
        field.columns.map((column) => column.key),
      );
      store.setTableCell(
        1,
        field.key,
        row,
        'company',
        'Company ${row + 1}',
      );
      store.setTableCell(
        1,
        field.key,
        row,
        'website',
        'https://example.com/${row + 1}',
      );
      store.setTableCell(
        1,
        field.key,
        row,
        'whyFit',
        'Verified fit reason ${row + 1}',
      );
    }

    expect(store.readinessIssues(1), isEmpty);
    expect(store.isReadyForReview(1), isTrue);
  });

  test('module 2 defines the full 10-lead four-proof audit', () {
    final definition = moduleWorkspaceDefinitions[2]!;
    final table = definition.fields.firstWhere(
      (field) => field.key == 'leadResearch',
    );

    expect(table.expectedRows, 10);
    expect(
      table.columns.map((column) => column.key),
      containsAll(<String>[
        'company',
        'contact',
        'role',
        'contactRoute',
        'companyProof',
        'roleProof',
        'contactProof',
        'reasonProof',
        'source',
        'audit',
      ]),
    );
  });

  test('workspace persists tables and text across reload', () async {
    SharedPreferences.setMockInitialValues({});
    final first = WorkspaceStore();
    await first.load();

    first.setString(2, 'industry', 'Manufacturing');
    first.addTableRow(
      2,
      'leadResearch',
      const <String>['company', 'contact'],
    );
    first.setTableCell(
      2,
      'leadResearch',
      0,
      'company',
      'Nolte Precise Manufacturing',
    );
    await first.flush();

    final second = WorkspaceStore();
    await second.load();

    expect(second.stringValue(2, 'industry'), 'Manufacturing');
    expect(
      second.tableValue(2, 'leadResearch').single['company'],
      'Nolte Precise Manufacturing',
    );
  });

  test('workspace recovers from malformed local data', () async {
    SharedPreferences.setMockInitialValues({
      'clientbound_workspaces_v1': '{bad-json',
    });

    final store = WorkspaceStore();
    await store.load();

    expect(store.recoveryWarning, isNotNull);
    expect(store.stringValue(1, 'niche'), isEmpty);
  });
}
