import 'dart:io';

import 'package:clientbound/review_exchange_file_service.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('review exchange filenames are deterministic and role-specific', () {
    expect(
      ReviewExchangeFileService.packageFilename(
        moduleId: 2,
        revision: 3,
      ),
      'clientbound-review-module-2-r3.json',
    );

    expect(
      ReviewExchangeFileService.decisionFilename(
        moduleId: 2,
        revision: 3,
        decision: 'PASS',
      ),
      'clientbound-decision-module-2-r3-pass.json',
    );

    expect(
      ReviewExchangeFileService.decisionFilename(
        moduleId: 4,
        revision: 1,
        decision: ' revise ',
      ),
      'clientbound-decision-module-4-r1-revise.json',
    );
  });

  test('review UI exposes file import/export with paste fallback', () {
    final reviewSource = File('lib/review_page.dart').readAsStringSync();
    final exchangeSource =
        File('lib/review_exchange_page.dart').readAsStringSync();

    expect(reviewSource, contains('Save package file'));
    expect(
      reviewSource,
      contains('ReviewExchangeFileService.packageFilename'),
    );

    expect(exchangeSource, contains('Import package file'));
    expect(exchangeSource, contains('Import decision file'));
    expect(exchangeSource, contains('Save decision file'));
    expect(exchangeSource, contains('Paste package JSON'));
    expect(exchangeSource, contains('Paste decision JSON'));
    expect(
      exchangeSource,
      contains('ReviewExchangeFileService.pickJsonText'),
    );
    expect(
      exchangeSource,
      contains('ReviewExchangeFileService.decisionFilename'),
    );
  });

  test('file portability keeps JSON-only exchange boundary', () {
    final source =
        File('lib/review_exchange_file_service.dart').readAsStringSync();

    expect(source, contains('allowedExtensions: const <String>[\'json\']'));
    expect(source, contains('type: FileType.custom'));
    expect(source, contains('FilePicker.pickFile'));
    expect(source, contains('readAsBytes()'));
    expect(source, contains('mimeType: \'application/json\''));
    expect(source, isNot(contains('http://')));
    expect(source, isNot(contains('https://')));
  });
}
