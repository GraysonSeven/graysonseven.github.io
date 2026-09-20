import 'package:clientbound/app.dart';
import 'package:clientbound/community_store.dart';
import 'package:clientbound/progress_store.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  test('Clientbound app contract wires local-first stores', () async {
    SharedPreferences.setMockInitialValues({});

    final progress = ProgressStore();
    final community = CommunityStore();
    await progress.load();
    await community.load();

    final app = ClientboundApp(
      progress: progress,
      community: community,
    );

    expect(app.progress, same(progress));
    expect(app.community, same(community));
    expect(progress.passedCount, 0);
    expect(community.posts, isNotEmpty);
  });
}
