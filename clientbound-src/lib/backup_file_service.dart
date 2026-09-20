import 'dart:convert';
import 'dart:typed_data';

import 'package:file_picker/file_picker.dart';

class BackupFileService {
  const BackupFileService._();

  static Future<String?> pickBackupText() async {
    final file = await FilePicker.pickFile(
      dialogTitle: 'Choose Clientbound backup',
      type: FileType.custom,
      allowedExtensions: const <String>['json'],
    );
    if (file == null) return null;

    final bytes = await file.readAsBytes();
    try {
      return utf8.decode(bytes);
    } on FormatException {
      throw const FormatException('Selected backup file is not valid UTF-8.');
    }
  }

  static Future<bool> saveBackup({
    required String contents,
    required String filename,
  }) async {
    final saved = await FilePicker.saveFile(
      dialogTitle: 'Save Clientbound backup',
      fileName: filename,
      type: FileType.custom,
      allowedExtensions: const <String>['json'],
      mimeType: 'application/json',
      bytes: Uint8List.fromList(utf8.encode(contents)),
    );
    return saved != null;
  }

  static String filenameForDate(DateTime value) {
    final day = value.toUtc().toIso8601String().split('T').first;
    return 'clientbound-backup-$day.json';
  }
}
