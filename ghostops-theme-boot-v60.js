(() => {
  "use strict";
  let theme = null;
  try { theme = localStorage.getItem("icharles-ui-theme"); } catch (_) {}
  if (theme !== "dark" && theme !== "light") {
    theme = matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  document.documentElement.dataset.uiTheme = theme;
  document.documentElement.style.colorScheme = theme;
})();