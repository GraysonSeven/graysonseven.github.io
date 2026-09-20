import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('pilot-critical dialogs use max-width constraints instead of forced widths',
      () {
    final paths = <String>[
      'lib/review_exchange_page.dart',
      'lib/settings_page.dart',
      'lib/community_hub_page.dart',
      'lib/app.dart',
    ];

    for (final path in paths) {
      final source = File(path).readAsStringSync();
      expect(
        source,
        isNot(matches(RegExp(r'width:\s*(520|620|680|760)'))),
        reason: '$path still contains a forced wide dialog width.',
      );
    }

    final exchange = File('lib/review_exchange_page.dart').readAsStringSync();
    final settings = File('lib/settings_page.dart').readAsStringSync();

    expect(exchange, contains('BoxConstraints(maxWidth: 680)'));
    expect(exchange, contains('BoxConstraints(maxWidth: 760)'));
    expect(settings, contains('BoxConstraints(maxWidth: 620)'));
  });

  test('module state reset requires explicit confirmation', () {
    final source = File('lib/app.dart').readAsStringSync();

    expect(source, contains('Reset module state?'));
    expect(source, contains('Your structured workspace and notes are kept.'));
    expect(source, contains('onPressed: _confirmResetState'));
  });


  test('onboarding explains learner and instructor review responsibilities', () {
    final source = File('lib/onboarding_page.dart').readAsStringSync();

    expect(source, contains('Learners submit. Instructors decide.'));
    expect(source, contains('Review Exchange moves the package and decision'));
    expect(source, contains('save and restore a Clientbound backup file'));
    expect(source, contains('SingleChildScrollView'));
    expect(source, contains('minHeight: constraints.maxHeight - 24'));
  });


  test('review exchange surfaces the trust and privacy boundary', () {
    final source = File('lib/review_exchange_page.dart').readAsStringSync();

    expect(source, contains('does not authenticate who created a decision'));
    expect(source, contains('real learner evidence and notes'));
    expect(source, contains('trusted channel'));
  });

}
