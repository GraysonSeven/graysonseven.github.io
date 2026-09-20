import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class CommunityPost {
  CommunityPost({
    required this.id,
    required this.category,
    required this.title,
    required this.body,
    required this.author,
    required this.createdAt,
    List<String>? comments,
    this.liked = false,
    this.reported = false,
  }) : comments = comments ?? <String>[];

  final String id;
  final String category;
  final String title;
  final String body;
  final String author;
  final int createdAt;
  final List<String> comments;
  bool liked;
  bool reported;

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'category': category,
        'title': title,
        'body': body,
        'author': author,
        'createdAt': createdAt,
        'comments': comments,
        'liked': liked,
        'reported': reported,
      };

  static CommunityPost fromJson(Map<String, dynamic> json) {
    final id = json['id'];
    final category = json['category'];
    final title = json['title'];
    final body = json['body'];
    final author = json['author'];
    final createdAt = json['createdAt'];

    if (id is! String ||
        category is! String ||
        title is! String ||
        body is! String ||
        author is! String ||
        createdAt is! int) {
      throw const FormatException('Community post is invalid.');
    }

    final rawComments = json['comments'];
    if (rawComments != null && rawComments is! List) {
      throw const FormatException('Community comments are invalid.');
    }

    return CommunityPost(
      id: id,
      category: category,
      title: title,
      body: body,
      author: author,
      createdAt: createdAt,
      comments: (rawComments as List<dynamic>? ?? const <dynamic>[])
          .whereType<String>()
          .toList(),
      liked: json['liked'] as bool? ?? false,
      reported: json['reported'] as bool? ?? false,
    );
  }
}

class CommunityStore extends ChangeNotifier {
  static const _key = 'clientbound_community_posts_v1';

  final List<CommunityPost> _posts = <CommunityPost>[];
  String? _recoveryWarning;

  List<CommunityPost> get posts =>
      List<CommunityPost>.unmodifiable(_posts);

  String? get recoveryWarning => _recoveryWarning;

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);

    if (raw != null && raw.isNotEmpty) {
      try {
        _posts
          ..clear()
          ..addAll(_decodePosts(raw));
      } catch (_) {
        _recoveryWarning =
            'Clientbound recovered from damaged local Practice Board data. A preserved copy was kept locally.';
        await prefs.setString(
          'clientbound_recovered_community_${DateTime.now().millisecondsSinceEpoch}',
          raw,
        );
        await prefs.remove(_key);
        _posts.clear();
      }
    }

    if (_posts.isEmpty) {
      _posts.addAll(_seedPosts());
      await _save(prefs);
    }

    _sort();
    notifyListeners();
  }

  Map<String, dynamic> exportData() => <String, dynamic>{
        'posts': _posts.map((post) => post.toJson()).toList(),
      };

  Future<void> importData(Map<String, dynamic> data) async {
    final rawPosts = data['posts'];
    if (rawPosts is! List) {
      throw const FormatException('Backup community section is invalid.');
    }

    final decoded = <CommunityPost>[];
    for (final item in rawPosts) {
      if (item is! Map) {
        throw const FormatException('Backup community post is invalid.');
      }
      decoded.add(
        CommunityPost.fromJson(Map<String, dynamic>.from(item)),
      );
    }

    _posts
      ..clear()
      ..addAll(decoded);
    if (_posts.isEmpty) _posts.addAll(_seedPosts());
    _recoveryWarning = null;
    _sort();

    final prefs = await SharedPreferences.getInstance();
    await _save(prefs);
    notifyListeners();
  }

  Future<void> addPost({
    required String category,
    required String title,
    required String body,
  }) async {
    final cleanTitle = title.trim();
    final cleanBody = body.trim();
    if (cleanTitle.isEmpty || cleanBody.isEmpty) return;

    _posts.add(
      CommunityPost(
        id: DateTime.now().microsecondsSinceEpoch.toString(),
        category: category,
        title: cleanTitle,
        body: cleanBody,
        author: 'You',
        createdAt: DateTime.now().millisecondsSinceEpoch,
      ),
    );
    _sort();
    notifyListeners();
    await _persist();
  }

  Future<void> toggleLike(String id) async {
    final post = _find(id);
    if (post == null) return;
    post.liked = !post.liked;
    notifyListeners();
    await _persist();
  }

  Future<void> addComment(String id, String comment) async {
    final post = _find(id);
    final clean = comment.trim();
    if (post == null || clean.isEmpty) return;
    post.comments.add(clean);
    notifyListeners();
    await _persist();
  }

  Future<void> toggleReported(String id) async {
    final post = _find(id);
    if (post == null) return;
    post.reported = !post.reported;
    notifyListeners();
    await _persist();
  }

  Future<void> resetToSeed() async {
    _posts
      ..clear()
      ..addAll(_seedPosts());
    _recoveryWarning = null;
    _sort();
    notifyListeners();
    await _persist();
  }

  CommunityPost? _find(String id) {
    for (final post in _posts) {
      if (post.id == id) return post;
    }
    return null;
  }

  void _sort() {
    _posts.sort((a, b) => b.createdAt.compareTo(a.createdAt));
  }

  Future<void> _persist() async {
    final prefs = await SharedPreferences.getInstance();
    await _save(prefs);
  }

  Future<void> _save(SharedPreferences prefs) {
    return prefs.setString(
      _key,
      jsonEncode(_posts.map((post) => post.toJson()).toList()),
    );
  }

  List<CommunityPost> _decodePosts(String raw) {
    final decoded = jsonDecode(raw);
    if (decoded is! List) {
      throw const FormatException('Community data is not a list.');
    }
    return decoded.map((item) {
      if (item is! Map) {
        throw const FormatException('Community post entry is invalid.');
      }
      return CommunityPost.fromJson(Map<String, dynamic>.from(item));
    }).toList();
  }

  List<CommunityPost> _seedPosts() => <CommunityPost>[
        CommunityPost(
          id: 'system-1',
          category: 'System',
          title: 'Real opportunities outrank lessons',
          body:
              'When a prospect replies, an interview appears, or a client asks a question, handle the live opportunity first. Return to the module after the opportunity is stabilized.',
          author: 'Clientbound',
          createdAt: 3,
        ),
        CommunityPost(
          id: 'system-2',
          category: 'Practice',
          title: 'Use this space for anonymized practice',
          body:
              'Post a difficult objection, a draft opener, or a short outreach example. Remove confidential client details before sharing.',
          author: 'Clientbound',
          createdAt: 2,
        ),
        CommunityPost(
          id: 'system-3',
          category: 'Wins',
          title: 'Count evidence, not vanity',
          body:
              'A useful reply, a better conversation, a verified lead, or a completed follow-up loop is a real win because it improves the system.',
          author: 'Clientbound',
          createdAt: 1,
        ),
      ];
}
