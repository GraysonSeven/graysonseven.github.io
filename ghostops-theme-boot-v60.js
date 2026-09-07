(() => {
  "use strict";
  const params = new URLSearchParams(location.search);
  const qaTheme = params.get("vqa-theme");
  let theme = qaTheme === "dark" || qaTheme === "light" ? qaTheme : null;

  if (!theme) {
    try { theme = localStorage.getItem("icharles-ui-theme"); } catch (_) {}
  }
  // Brand default: first visit always starts in DARK.
  // A manually saved user choice still wins, and Visual QA can explicitly override it.
  if (theme !== "dark" && theme !== "light") {
    theme = "dark";
  }

  if (qaTheme === "dark" || qaTheme === "light") {
    document.documentElement.dataset.visualQa = "1";
  }
  document.documentElement.dataset.uiTheme = theme;
  document.documentElement.style.colorScheme = theme;
})();
