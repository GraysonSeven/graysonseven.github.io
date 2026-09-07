(() => {
  "use strict";
  const params = new URLSearchParams(location.search);
  const qaTheme = params.get("vqa-theme");
  let theme = qaTheme === "dark" || qaTheme === "light" ? qaTheme : null;

  if (!theme) {
    try { theme = localStorage.getItem("icharles-ui-theme"); } catch (_) {}
  }
  if (theme !== "dark" && theme !== "light") {
    theme = matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }

  if (qaTheme === "dark" || qaTheme === "light") {
    document.documentElement.dataset.visualQa = "1";
  }
  document.documentElement.dataset.uiTheme = theme;
  document.documentElement.style.colorScheme = theme;
})();
