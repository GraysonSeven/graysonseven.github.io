import 'app_reload_stub.dart'
    if (dart.library.html) 'app_reload_web.dart' as platform;

Future<bool> reloadClientbound() => platform.reloadClientbound();
