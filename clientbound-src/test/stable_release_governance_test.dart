import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('V1 stable baseline pins direct application dependencies', () {
    final pubspec = File('pubspec.yaml').readAsStringSync();

    expect(pubspec, contains('shared_preferences: 2.5.5'));
    expect(pubspec, contains('url_launcher: 6.3.2'));
    expect(pubspec, contains('http: 1.6.0'));
    expect(pubspec, contains('file_picker: 13.1.0'));
    expect(pubspec, contains('flutter_lints: 6.0.0'));

    expect(pubspec, isNot(contains('shared_preferences: ^')));
    expect(pubspec, isNot(contains('url_launcher: ^')));
    expect(pubspec, isNot(contains('http: ^')));
    expect(pubspec, isNot(contains('file_picker: ^')));
    expect(pubspec, isNot(contains('flutter_lints: ^')));
  });
}
