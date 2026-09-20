import 'package:clientbound/update_store.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('version comparison respects semver and build number', () {
    expect(compareVersions('0.4.0+4', '0.3.0+3'), greaterThan(0));
    expect(compareVersions('0.4.0+5', '0.4.0+4'), greaterThan(0));
    expect(compareVersions('1.0.0+1', '0.9.9+99'), greaterThan(0));
    expect(compareVersions('0.4.0+4', '0.4.0+4'), 0);
    expect(compareVersions('0.3.9+20', '0.4.0+1'), lessThan(0));
  });
}
