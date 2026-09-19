import 'package:clientbound/course_catalog.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('course catalog contains 14 ordered modules', () {
    expect(courseModules.length, 14);
    expect(courseModules.map((m) => m.id).toList(), List<int>.generate(14, (i) => i + 1));
  });

  test('every module includes in-app lesson and task content', () {
    for (final module in courseModules) {
      expect(module.lessonPoints.length, greaterThanOrEqualTo(3));
      expect(module.taskSteps.length, greaterThanOrEqualTo(3));
    }
  });

  test('every module has a worksheet asset', () {
    for (final module in courseModules) {
      expect(module.worksheetAsset, isNotEmpty);
      expect(module.worksheetAsset.endsWith('.pdf'), isTrue);
    }
  });
}
