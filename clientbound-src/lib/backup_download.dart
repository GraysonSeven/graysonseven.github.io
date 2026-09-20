import 'backup_download_stub.dart'
    if (dart.library.html) 'backup_download_web.dart' as platform;

Future<bool> downloadBackupText(String contents, String filename) {
  return platform.downloadBackupText(contents, filename);
}
