(() => {
  "use strict";
  if (document.documentElement.dataset.v47VisualReady === "1") return;
  document.documentElement.dataset.v47VisualReady = "1";

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

  const synchronizeNavigation = () => {
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

  synchronizeNavigation();
  requestAnimationFrame(synchronizeNavigation);
  setTimeout(synchronizeNavigation, 120);

  // Make external app-launch buttons self-describing without changing their destinations.
  document.querySelectorAll(".live-open[target='_blank'], .launch-card[target='_blank']").forEach(link => {
    if (!link.getAttribute("aria-label")) {
      const label = (link.textContent || "Open web app").replace(/\s+/g, " ").trim();
      link.setAttribute("aria-label", `${label} — opens in a new tab`);
    }
  });
})();