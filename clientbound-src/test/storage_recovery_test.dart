import 'package:clientbound/app_settings_store.dart';
import 'package:clientbound/community_store.dart';
import 'package:clientbound/progress_store.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  test('progress store recovers from malformed local JSON', () async {
    SharedPreferences.setMockInitialValues({
      'clientbound_module_stages_v3': '{bad-json',
      'clientbound_module_notes_v3': '{"1":42}',
    });

    final store = ProgressStore();
    await store.load();

    expect(store.recoveryWarning, isNotNull);
    expect(store.passedCount, 0);
    expect(store.notesFor(1), isEmpty);
  });

  test('community store recovers from malformed local JSON', () async {
    SharedPreferences.setMockInitialValues({
      'clientbound_community_posts_v1': '{"not":"a-list"}',
    });

    final store = CommunityStore();
    await store.load();

    expect(store.recoveryWarning, isNotNull);
    expect(store.posts.length, greaterThanOrEqualTo(3));
  });

  test('settings store recovers from malformed local JSON', () async {
    SharedPreferences.setMockInitialValues({
      'clientbound_app_settings_v1': '[1,2,3]',
    });

    final store = AppSettingsStore();
    await store.load();

    expect(store.recoveryWarning, isNotNull);
    expect(store.onboardingComplete, isFalse);
  });
}
