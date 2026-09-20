import 'package:clientbound/app.dart';
import 'package:clientbound/community_store.dart';
import 'package:clientbound/progress_store.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets('Clientbound shell renders core product surfaces', (tester) async {
    SharedPreferences.setMockInitialValues({});

    final progress = ProgressStore();
    final community = CommunityStore();
    await progress.load();
    await community.load();

    tester.view.physicalSize = const Size(1400, 900);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      ClientboundApp(progress: progress, community: community),
    );
    await tester.pumpAndSettle();

    expect(find.text('CLIENTBOUND'), findsAtLeastNWidgets(1));
    expect(find.text('Classroom'), findsOneWidget);
    expect(find.text('Community'), findsOneWidget);
    expect(find.text('Toolkit'), findsOneWidget);
    expect(find.text('Review'), findsOneWidget);
    expect(find.text('Action center'), findsOneWidget);
  });
}
