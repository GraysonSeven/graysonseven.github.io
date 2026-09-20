import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

@immutable
class ClientboundVersion {
  const ClientboundVersion({
    required this.name,
    required this.version,
    required this.channel,
    required this.web,
  });

  final String name;
  final String version;
  final String channel;
  final String web;

  factory ClientboundVersion.fromJson(Map<String, dynamic> json) {
    return ClientboundVersion(
      name: json['name'] as String? ?? 'Clientbound',
      version: json['version'] as String? ?? '0.0.0+0',
      channel: json['channel'] as String? ?? 'unknown',
      web: json['web'] as String? ??
          'https://graysonseven.github.io/clientbound/',
    );
  }
}

class UpdateStore extends ChangeNotifier {
  UpdateStore({required this.currentVersion});

  static const _versionUrl =
      'https://graysonseven.github.io/clientbound/version.json';

  final String currentVersion;

  ClientboundVersion? _latest;
  bool _checking = false;
  String? _error;

  ClientboundVersion? get latest => _latest;
  bool get checking => _checking;
  String? get error => _error;

  bool get updateAvailable =>
      _latest != null && compareVersions(_latest!.version, currentVersion) > 0;

  Future<void> check() async {
    if (_checking) return;
    _checking = true;
    _error = null;
    notifyListeners();

    try {
      final uri = Uri.parse(
        '$_versionUrl?t=${DateTime.now().millisecondsSinceEpoch}',
      );
      final response = await http.get(
        uri,
        headers: const <String, String>{
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      );
      if (response.statusCode != 200) {
        throw Exception('Version endpoint returned ${response.statusCode}.');
      }
      final decoded = jsonDecode(response.body);
      if (decoded is! Map<String, dynamic>) {
        throw const FormatException('Version response is invalid.');
      }
      _latest = ClientboundVersion.fromJson(decoded);
    } catch (_) {
      _error = 'Could not check for updates right now.';
    } finally {
      _checking = false;
      notifyListeners();
    }
  }
}

int compareVersions(String left, String right) {
  final a = _parseVersion(left);
  final b = _parseVersion(right);
  for (var i = 0; i < 4; i++) {
    if (a[i] != b[i]) return a[i].compareTo(b[i]);
  }
  return 0;
}

List<int> _parseVersion(String value) {
  final parts = value.split('+');
  final core = parts.first.split('.');
  final build = parts.length > 1 ? int.tryParse(parts[1]) ?? 0 : 0;

  int corePart(int index) {
    if (index >= core.length) return 0;
    return int.tryParse(core[index]) ?? 0;
  }

  return <int>[corePart(0), corePart(1), corePart(2), build];
}
