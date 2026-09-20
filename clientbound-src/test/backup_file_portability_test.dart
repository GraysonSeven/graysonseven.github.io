import 'dart:io';

import 'package:clientbound/backup_file_service.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('backup filenames are deterministic UTC dates', () {
    expect(
      BackupFileService.filenameForDate(
        DateTime.parse('2026-09-20T23:30:00+08:00'),
      ),
      'clientbound-backup-2026-09-20.json',
    );
  });

  test('settings expose file backup with JSON fallback', () {
    final source = File('lib/settings_page.dart').readAsStringSync();

    expect(source, contains('Save backup file'));
    expect(source, contains('Restore backup file'));
    expect(source, contains('Copy backup JSON'));
    expect(source, contains('Paste backup JSON'));
    expect(source, contains('BackupFileService.saveBackup'));
    expect(source, contains('BackupFileService.pickBackupText'));
  });

  test('backup file service keeps JSON-only local boundary', () {
    final source =
        File('lib/backup_file_service.dart').readAsStringSync();

    expect(source, contains("allowedExtensions: const <String>['json']"));
    expect(source, contains('FilePicker.pickFile'));
    expect(source, contains('FilePicker.saveFile'));
    expect(source, contains("mimeType: 'application/json'"));
    expect(source, isNot(contains('http://')));
    expect(source, isNot(contains('https://')));
  });
}
