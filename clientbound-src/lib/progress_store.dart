import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ProgressStore extends ChangeNotifier {
  static const _key = 'fcss_completed_modules_v1';

  Set<int> _completed = <int>{};

  Set<int> get completed => Set.unmodifiable(_completed);

  double get ratio => _completed.length / 14;

  bool isCompleted(int moduleId) => _completed.contains(moduleId);

  int get nextModuleId {
    for (var id = 1; id <= 14; id++) {
      if (!_completed.contains(id)) return id;
    }
    return 14;
  }

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    final values = prefs.getStringList(_key) ?? const <String>[];
    _completed = values.map(int.tryParse).whereType<int>().where((id) => id >= 1 && id <= 14).toSet();
    notifyListeners();
  }

  Future<void> setCompleted(int moduleId, bool value) async {
    if (value) {
      _completed.add(moduleId);
    } else {
      _completed.remove(moduleId);
    }
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    final values = _completed.toList()..sort();
    await prefs.setStringList(_key, values.map((id) => '$id').toList());
  }

  Future<void> reset() async {
    _completed = <int>{};
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }
}
