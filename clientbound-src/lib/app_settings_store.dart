import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppSettingsStore extends ChangeNotifier {
  static const _key = 'clientbound_app_settings_v1';

  bool _onboardingComplete = false;
  bool _reducedMotion = false;
  String? _recoveryWarning;

  bool get onboardingComplete => _onboardingComplete;
  bool get reducedMotion => _reducedMotion;
  String? get recoveryWarning => _recoveryWarning;

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null || raw.isEmpty) {
      notifyListeners();
      return;
    }

    try {
      final decoded = jsonDecode(raw);
      if (decoded is! Map<String, dynamic>) {
        throw const FormatException('Settings backup is not an object.');
      }
      _onboardingComplete = decoded['onboardingComplete'] as bool? ?? false;
      _reducedMotion = decoded['reducedMotion'] as bool? ?? false;
    } catch (_) {
      _recoveryWarning =
          'Clientbound recovered from damaged settings data. Learning data was left untouched.';
      await prefs.setString(
        'clientbound_recovered_settings_${DateTime.now().millisecondsSinceEpoch}',
        raw,
      );
      await prefs.remove(_key);
    }

    notifyListeners();
  }

  Future<void> completeOnboarding() async {
    _onboardingComplete = true;
    await _persist();
    notifyListeners();
  }

  Future<void> restartOnboarding() async {
    _onboardingComplete = false;
    await _persist();
    notifyListeners();
  }

  Future<void> setReducedMotion(bool value) async {
    _reducedMotion = value;
    await _persist();
    notifyListeners();
  }

  Map<String, dynamic> exportData() => <String, dynamic>{
        'onboardingComplete': _onboardingComplete,
        'reducedMotion': _reducedMotion,
      };

  Future<void> importData(Map<String, dynamic> data) async {
    _onboardingComplete = data['onboardingComplete'] as bool? ?? false;
    _reducedMotion = data['reducedMotion'] as bool? ?? false;
    _recoveryWarning = null;
    await _persist();
    notifyListeners();
  }

  Future<void> _persist() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, jsonEncode(exportData()));
  }
}
