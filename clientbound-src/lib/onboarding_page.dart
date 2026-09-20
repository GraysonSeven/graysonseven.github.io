import 'package:flutter/material.dart';

class OnboardingPage extends StatefulWidget {
  const OnboardingPage({super.key, required this.onComplete});

  final Future<void> Function() onComplete;

  @override
  State<OnboardingPage> createState() => _OnboardingPageState();
}

class _OnboardingPageState extends State<OnboardingPage> {
  final PageController _controller = PageController();
  int _index = 0;
  bool _finishing = false;

  static const _steps = <({
    IconData icon,
    String eyebrow,
    String title,
    String body,
  })>[
    (
      icon: Icons.route_outlined,
      eyebrow: 'WELCOME TO CLIENTBOUND',
      title: 'Learn by doing real sales work.',
      body:
          'Clientbound is built around execution, proof, feedback, and live market evidence—not passive lesson completion.',
    ),
    (
      icon: Icons.fact_check_outlined,
      eyebrow: 'HOW PROGRESS WORKS',
      title: 'Reading is not PASS.',
      body:
          'Modules move from Not started to In progress to Ready for review. PASS means the real deliverable met its quality gate.',
    ),
    (
      icon: Icons.lock_outline_rounded,
      eyebrow: 'YOUR DATA',
      title: 'Your work stays local by default.',
      body:
          'Progress, notes, tasks, review feedback, and Practice Board activity are stored on this device. Clientbound does not require an account or billing-backed cloud service.',
    ),
    (
      icon: Icons.backup_outlined,
      eyebrow: 'OWN YOUR WORK',
      title: 'Back up before it matters.',
      body:
          'Settings includes Clientbound backup export and restore. Use it before browser resets, device changes, or major experiments.',
    ),
  ];

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final last = _index == _steps.length - 1;
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 760),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  Expanded(
                    child: PageView.builder(
                      controller: _controller,
                      itemCount: _steps.length,
                      onPageChanged: (value) =>
                          setState(() => _index = value),
                      itemBuilder: (context, index) {
                        final step = _steps[index];
                        return Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 74,
                                height: 74,
                                decoration: BoxDecoration(
                                  color: Theme.of(context)
                                      .colorScheme
                                      .primary
                                      .withValues(alpha: .13),
                                  borderRadius: BorderRadius.circular(22),
                                ),
                                child: Icon(
                                  step.icon,
                                  size: 34,
                                  color:
                                      Theme.of(context).colorScheme.primary,
                                ),
                              ),
                              const SizedBox(height: 26),
                              Text(
                                step.eyebrow,
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  color:
                                      Theme.of(context).colorScheme.primary,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 1.15,
                                  fontSize: 12,
                                ),
                              ),
                              const SizedBox(height: 10),
                              Text(
                                step.title,
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  fontSize: 34,
                                  height: 1.08,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                              const SizedBox(height: 14),
                              Text(
                                step.body,
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  color: Colors.white70,
                                  height: 1.55,
                                  fontSize: 16,
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      for (var i = 0; i < _steps.length; i++)
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 180),
                          width: i == _index ? 24 : 8,
                          height: 8,
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          decoration: BoxDecoration(
                            color: i == _index
                                ? Theme.of(context).colorScheme.primary
                                : Colors.white24,
                            borderRadius: BorderRadius.circular(20),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 22),
                  Row(
                    children: [
                      if (_index > 0)
                        TextButton(
                          onPressed: _finishing
                              ? null
                              : () => _controller.previousPage(
                                    duration:
                                        const Duration(milliseconds: 220),
                                    curve: Curves.easeOut,
                                  ),
                          child: const Text('Back'),
                        ),
                      const Spacer(),
                      FilledButton.icon(
                        onPressed: _finishing
                            ? null
                            : () async {
                                if (!last) {
                                  await _controller.nextPage(
                                    duration:
                                        const Duration(milliseconds: 220),
                                    curve: Curves.easeOut,
                                  );
                                  return;
                                }
                                setState(() => _finishing = true);
                                await widget.onComplete();
                                if (mounted) {
                                  setState(() => _finishing = false);
                                }
                              },
                        icon: Icon(
                          last
                              ? Icons.arrow_forward_rounded
                              : Icons.navigate_next_rounded,
                        ),
                        label: Text(
                          last ? 'Start Clientbound' : 'Continue',
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
