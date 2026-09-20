import 'package:clientbound/app.dart';
import 'package:clientbound/app_settings_store.dart';
import 'package:clientbound/community_store.dart';
import 'package:clientbound/progress_store.dart';
import 'package:clientbound/update_store.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  test('Clientbound app contract wires local-first stores', () async {
    SharedPreferences.setMockInitialValues({});

    final progress = ProgressStore();
    final community = CommunityStore();
    final settings = AppSettingsStore();
    final updates = UpdateStore(currentVersion: '0.4.0+4');

    await progress.load();
    await community.load();
    await settings.load();

    final app = ClientboundApp(
      progress: progress,
      community: community,
      settings: settings,
      updates: updates,
      appVersion: '0.4.0+4',
    );

    expect(app.progress, same(progress));
    expect(app.community, same(community));
    expect(app.settings, same(settings));
    expect(app.updates, same(updates));
    expect(app.appVersion, '0.4.0+4');
    expect(progress.passedCount, 0);
    expect(community.posts, isNotEmpty);
    expect(settings.onboardingComplete, isFalse);
  });
}
