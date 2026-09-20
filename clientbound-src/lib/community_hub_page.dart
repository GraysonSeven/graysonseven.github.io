import 'package:flutter/material.dart';

import 'community_store.dart';

class CommunityHubPage extends StatefulWidget {
  const CommunityHubPage({super.key, required this.store});

  final CommunityStore store;

  @override
  State<CommunityHubPage> createState() => _CommunityHubPageState();
}

class _CommunityHubPageState extends State<CommunityHubPage> {
  static const _categories = <String>[
    'Question',
    'Practice',
    'Win',
    'Feedback',
  ];

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: widget.store,
      builder: (context, _) => ListView(
        padding: const EdgeInsets.all(22),
        children: [
          Text(
            'COMMUNITY',
            style: Theme.of(context).textTheme.labelLarge?.copyWith(
                  color: Theme.of(context).colorScheme.primary,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.2,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'Practice, questions, wins, and feedback.',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.w900,
                ),
          ),
          const SizedBox(height: 8),
          const Text(
            'This zero-cost release stores your posts locally on this device. The UI is backend-ready, but there is no paid cloud dependency.',
            style: TextStyle(color: Colors.white60, height: 1.45),
          ),
          const SizedBox(height: 18),
          Align(
            alignment: Alignment.centerLeft,
            child: FilledButton.icon(
              onPressed: _newPost,
              icon: const Icon(Icons.add_rounded),
              label: const Text('New local post'),
            ),
          ),
          const SizedBox(height: 18),
          for (final post in widget.store.posts) ...[
            Card(
              child: Padding(
                padding: const EdgeInsets.all(17),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Chip(label: Text(post.category)),
                        const Spacer(),
                        Text(
                          post.author,
                          style: const TextStyle(
                            color: Colors.white54,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      post.title,
                      style: const TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 18,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      post.body,
                      style: const TextStyle(
                        color: Colors.white70,
                        height: 1.5,
                      ),
                    ),
                    if (post.comments.isNotEmpty) ...[
                      const Divider(height: 26),
                      for (final comment in post.comments)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 7),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(
                                Icons.subdirectory_arrow_right_rounded,
                                size: 16,
                                color: Colors.white38,
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  comment,
                                  style: const TextStyle(
                                    color: Colors.white60,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      children: [
                        TextButton.icon(
                          onPressed: () => widget.store.toggleLike(post.id),
                          icon: Icon(
                            post.liked
                                ? Icons.favorite_rounded
                                : Icons.favorite_border_rounded,
                          ),
                          label: Text(post.liked ? 'Liked' : 'Like'),
                        ),
                        TextButton.icon(
                          onPressed: () => _comment(post.id),
                          icon: const Icon(Icons.chat_bubble_outline_rounded),
                          label: Text('Comment ${post.comments.length}'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
          ],
        ],
      ),
    );
  }

  Future<void> _newPost() async {
    var category = _categories.first;
    final title = TextEditingController();
    final body = TextEditingController();
    final accepted = await showDialog<bool>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('New local community post'),
          content: SizedBox(
            width: 520,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<String>(
                  initialValue: category,
                  items: [
                    for (final value in _categories)
                      DropdownMenuItem(value: value, child: Text(value)),
                  ],
                  onChanged: (value) {
                    if (value != null) {
                      setDialogState(() => category = value);
                    }
                  },
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: title,
                  decoration: const InputDecoration(labelText: 'Title'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: body,
                  minLines: 4,
                  maxLines: 8,
                  decoration: const InputDecoration(labelText: 'Post'),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Post locally'),
            ),
          ],
        ),
      ),
    );

    if (accepted == true) {
      await widget.store.addPost(
        category: category,
        title: title.text,
        body: body.text,
      );
    }
    title.dispose();
    body.dispose();
  }

  Future<void> _comment(String id) async {
    final controller = TextEditingController();
    final accepted = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add comment'),
        content: TextField(
          controller: controller,
          minLines: 2,
          maxLines: 5,
          autofocus: true,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Add'),
          ),
        ],
      ),
    );
    if (accepted == true) {
      await widget.store.addComment(id, controller.text);
    }
    controller.dispose();
  }
}
