import 'package:clientbound/app.dart';
import 'package:clientbound/community_store.dart';
import 'package:clientbound/progress_store.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets('Clientbound shell renders product navigation', (tester) async {
    SharedPreferences.setMockInitialValues({});

    final progress = ProgressStore();
    final community = CommunityStore();
    await progress.load();
    await community.load();

    await tester.pumpWidget(
      ClientboundApp(progress: progress, community: community),
    );
    await tester.pump();

    final materialApp = tester.widget<MaterialApp>(find.byType(MaterialApp));
    expect(materialApp.title, 'Clientbound');
    expect(find.byType(NavigationBar), findsOneWidget);
    expect(find.text('Home'), findsOneWidget);
    expect(find.text('Classroom'), findsOneWidget);
    expect(find.text('Community'), findsOneWidget);
    expect(find.text('Toolkit'), findsOneWidget);
    expect(find.text('Review'), findsOneWidget);

    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pump();
  });
}
