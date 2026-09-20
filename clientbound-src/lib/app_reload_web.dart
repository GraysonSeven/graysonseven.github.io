// ignore_for_file: avoid_web_libraries_in_flutter, deprecated_member_use

import 'dart:html' as html;

Future<bool> reloadClientbound() async {
  html.window.location.reload();
  return true;
}
