import 'package:clientbound/community_store.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  test('community seeds locally and persists user interaction', () async {
    SharedPreferences.setMockInitialValues({});

    final store = CommunityStore();
    await store.load();

    expect(store.posts.length, greaterThanOrEqualTo(3));

    await store.addPost(
      category: 'Practice',
      title: 'Opener practice',
      body: 'Testing a shorter opening line.',
    );

    final userPost = store.posts.first;
    expect(userPost.author, 'You');

    await store.toggleLike(userPost.id);
    await store.addComment(userPost.id, 'Needs one clear question.');
    await store.toggleReported(userPost.id);

    expect(store.posts.first.liked, isTrue);
    expect(store.posts.first.reported, isTrue);
    expect(store.posts.first.comments.single, contains('clear question'));
  });
}
