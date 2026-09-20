import 'dart:convert';

import 'app_settings_store.dart';
import 'community_store.dart';
import 'progress_store.dart';

class BackupService {
  const BackupService({
    required this.progress,
    required this.community,
    required this.settings,
    required this.appVersion,
  });

  static const schemaVersion = 1;

  final ProgressStore progress;
  final CommunityStore community;
  final AppSettingsStore settings;
  final String appVersion;

  String createBackupJson() {
    final payload = <String, dynamic>{
      'format': 'clientbound-backup',
      'schemaVersion': schemaVersion,
      'appVersion': appVersion,
      'exportedAt': DateTime.now().toUtc().toIso8601String(),
      'progress': progress.exportData(),
      'community': community.exportData(),
      'settings': settings.exportData(),
    };
    return const JsonEncoder.withIndent('  ').convert(payload);
  }

  Map<String, dynamic> validate(String raw) {
    final decoded = jsonDecode(raw);
    if (decoded is! Map<String, dynamic>) {
      throw const FormatException('Backup must be a JSON object.');
    }
    if (decoded['format'] != 'clientbound-backup') {
      throw const FormatException('This is not a Clientbound backup.');
    }
    final schema = decoded['schemaVersion'];
    if (schema is! int || schema < 1 || schema > schemaVersion) {
      throw FormatException('Unsupported backup schema: $schema.');
    }
    if (decoded['progress'] is! Map<String, dynamic> ||
        decoded['community'] is! Map<String, dynamic> ||
        decoded['settings'] is! Map<String, dynamic>) {
      throw const FormatException('Backup is missing required sections.');
    }
    return decoded;
  }

  Future<void> restoreBackupJson(String raw) async {
    final decoded = validate(raw);
    final rollback = validate(createBackupJson());

    try {
      await _apply(decoded);
    } catch (_) {
      await _apply(rollback);
      rethrow;
    }
  }

  Future<void> _apply(Map<String, dynamic> decoded) async {
    final progressData =
        Map<String, dynamic>.from(decoded['progress'] as Map<String, dynamic>);
    final communityData =
        Map<String, dynamic>.from(decoded['community'] as Map<String, dynamic>);
    final settingsData =
        Map<String, dynamic>.from(decoded['settings'] as Map<String, dynamic>);

    await progress.importData(progressData);
    await community.importData(communityData);
    await settings.importData(settingsData);
  }
}
