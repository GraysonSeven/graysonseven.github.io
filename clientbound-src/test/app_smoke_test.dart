import 'package:clientbound/app.dart';
import 'package:clientbound/app_settings_store.dart';
import 'package:clientbound/community_store.dart';
import 'package:clientbound/progress_store.dart';
import 'package:clientbound/review_exchange_store.dart';
import 'package:clientbound/update_store.dart';
import 'package:clientbound/workspace_store.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  test('Clientbound app contract wires local-first stores', () async {
    SharedPreferences.setMockInitialValues({});

    final progress = ProgressStore();
    final community = CommunityStore();
    final settings = AppSettingsStore();
    final workspace = WorkspaceStore();
    final reviewExchange = ReviewExchangeStore();
    final updates = UpdateStore(currentVersion: '0.7.0+7');

    await progress.load();
    await community.load();
    await settings.load();
    await workspace.load();
    await reviewExchange.load();

    final app = ClientboundApp(
      progress: progress,
      community: community,
      settings: settings,
      updates: updates,
      workspace: workspace,
      reviewExchange: reviewExchange,
      appVersion: '0.7.0+7',
    );

    expect(app.progress, same(progress));
    expect(app.community, same(community));
    expect(app.settings, same(settings));
    expect(app.updates, same(updates));
    expect(app.workspace, same(workspace));
    expect(app.reviewExchange, same(reviewExchange));
    expect(app.appVersion, '0.7.0+7');
    expect(progress.passedCount, 0);
    expect(community.posts, isNotEmpty);
    expect(settings.onboardingComplete, isFalse);
  });
}
