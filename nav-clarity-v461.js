(() => {
  "use strict";
  if (document.documentElement.dataset.v461NavReady === "1") return;
  document.documentElement.dataset.v461NavReady = "1";

  const clean = value => {
    const p = (value || "/").replace(/\/+$/, "");
    return p || "/";
  };

  const currentPath = clean(location.pathname);

  const isCurrent = href => {
    let target;
    try {
      target = clean(new URL(href, location.origin).pathname);
    } catch (_) {
      return false;
    }

    if (target === "/") return currentPath === "/";
    if (target === "/portfolio") {
      return currentPath === "/portfolio" || currentPath.startsWith("/portfolio/");
    }
    return currentPath === target || currentPath.startsWith(target + "/");
  };

  const refresh = () => {
    document.querySelectorAll(
      '.v4-unified-nav a[href], .v423-panel-nav a[href], .v4-unified-footer nav a[href]'
    ).forEach(link => {
      if (isCurrent(link.getAttribute("href"))) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  refresh();
  requestAnimationFrame(refresh);
  setTimeout(refresh, 120);
})();