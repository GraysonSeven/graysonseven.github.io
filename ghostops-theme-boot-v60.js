(() => {
  "use strict";
  const root = document.documentElement;
  const params = new URLSearchParams(location.search);
  const qaTheme = params.get("vqa-theme");
  const qaForced = qaTheme === "dark" || qaTheme === "light";
  const inApp = /FBAN|FBAV|FB_IAB|Messenger|Instagram/i.test(navigator.userAgent || "");
  let theme = qaForced ? qaTheme : null;

  if (!theme && !inApp) {
    try { theme = localStorage.getItem("icharles-ui-theme"); } catch (_) {}
  }

  // Locked brand contract:
  // - first visit defaults to DARK,
  // - OS theme never chooses the site theme,
  // - saved manual choice persists in normal browsers,
  // - Facebook/Messenger/Instagram in-app browsers remain DARK,
  // - explicit Visual QA overrides everything for deterministic testing.
  if (!qaForced && inApp) theme = "dark";
  if (theme !== "dark" && theme !== "light") theme = "dark";

  if (qaForced) root.dataset.visualQa = "1";
  if (inApp && !qaForced) root.dataset.inAppBrowser = "1";
  root.dataset.uiTheme = theme;
  root.style.colorScheme = theme;
})();