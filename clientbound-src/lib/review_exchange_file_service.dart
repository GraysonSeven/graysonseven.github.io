import 'dart:convert';
import 'dart:typed_data';

import 'package:file_picker/file_picker.dart';

class ReviewExchangeFileService {
  const ReviewExchangeFileService._();

  static Future<String?> pickJsonText({
    String dialogTitle = 'Choose Clientbound review JSON',
  }) async {
    final file = await FilePicker.pickFile(
      dialogTitle: dialogTitle,
      type: FileType.custom,
      allowedExtensions: const <String>['json'],
    );
    if (file == null) return null;

    final bytes = await file.readAsBytes();

    try {
      return utf8.decode(bytes);
    } on FormatException {
      throw const FormatException('Selected review file is not valid UTF-8.');
    }
  }

  static Future<bool> saveJson({
    required String contents,
    required String filename,
    String dialogTitle = 'Save Clientbound review JSON',
  }) async {
    final saved = await FilePicker.saveFile(
      dialogTitle: dialogTitle,
      fileName: filename,
      type: FileType.custom,
      allowedExtensions: const <String>['json'],
      mimeType: 'application/json',
      bytes: Uint8List.fromList(utf8.encode(contents)),
    );
    return saved != null;
  }

  static String packageFilename({
    required int moduleId,
    required int revision,
  }) =>
      'clientbound-review-module-$moduleId-r$revision.json';

  static String decisionFilename({
    required int moduleId,
    required int revision,
    required String decision,
  }) {
    final normalized = decision.trim().toLowerCase();
    return 'clientbound-decision-module-$moduleId-r$revision-$normalized.json';
  }
}
