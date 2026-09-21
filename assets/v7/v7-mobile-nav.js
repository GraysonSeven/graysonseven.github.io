(() => {
  "use strict";

  function initMobileNav() {
    const header = document.querySelector(".v7-header, .studio-header, body > .shell > header, header");
    if (!header || header.dataset.v7MobileNav === "ready") return;
    const sourceNav = header.querySelector("nav");
    if (!sourceNav) return;

    const sourceLinks = [...sourceNav.querySelectorAll("a[href]")];
    if (!sourceLinks.length) return;

    const canonicalRoutes = [
      ["HOME", "/"],
      ["TRY APPS", "/try/"],
      ["WORK", "/portfolio/"],
      ["SERVICES", "/services/"],
      ["WEBSITE STUDIO", "/website-studio/"],
      ["ABOUT", "/about/"],
      ["CONTACT", "/contact/"]
    ];

    header.dataset.v7MobileNav = "ready";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "v7-mobile-nav-toggle";
    button.setAttribute("aria-label", "Open navigation");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", "v7-mobile-nav");
    button.innerHTML = "<span></span>";

    const layer = document.createElement("div");
    layer.className = "v7-mobile-nav-layer";
    layer.id = "v7-mobile-nav";
    layer.hidden = true;
    layer.setAttribute("aria-hidden", "true");

    const links = canonicalRoutes.map(([label, href]) => {
      const copy = document.createElement("a");
      copy.href = href;
      copy.textContent = label;
      const target = new URL(href, location.href).pathname.replace(/\/+$/, "/");
      const currentPath = location.pathname.replace(/\/+$/, "/");
      const current = target === "/" ? currentPath === "/" : currentPath === target || currentPath.startsWith(target);
      if (current) copy.setAttribute("aria-current", "page");
      return copy.outerHTML;
    }).join("");

    layer.innerHTML = `
      <div class="v7-mobile-nav-backdrop" data-v7-nav-close></div>
      <aside class="v7-mobile-drawer" role="dialog" aria-modal="true" aria-label="Site navigation">
        <div class="v7-mobile-nav-head">
          <span><strong>NAVIGATION CORE</strong><small>NAV // ONLINE</small></span>
          <button class="v7-mobile-nav-close" type="button" aria-label="Close navigation" data-v7-nav-close>×</button>
        </div>
        <nav aria-label="Mobile navigation">${links}</nav>
        <div class="v7-mobile-nav-foot"><b>ROUTE // READY</b><span>CHARLES LIOC · SOFTWARE · WEBSITES · SYSTEMS</span></div>
      </aside>
    `;

    const host = header.classList.contains("studio-header") ? header : (header.querySelector("nav") || header);
    host.appendChild(button);
    document.body.appendChild(layer);

    let previousFocus = null;
    const drawer = layer.querySelector(".v7-mobile-drawer");
    const closeButton = layer.querySelector(".v7-mobile-nav-close");

    const focusables = () => [...drawer.querySelectorAll('a[href],button:not([disabled])')];

    function open() {
      previousFocus = document.activeElement;
      layer.hidden = false;
      layer.setAttribute("aria-hidden", "false");
      button.setAttribute("aria-expanded", "true");
      button.setAttribute("aria-label", "Close navigation");
      document.body.classList.add("v7-mobile-nav-open");
      requestAnimationFrame(() => {
        layer.classList.add("is-open");
        closeButton.focus();
      });
    }

    function close({ restore = true } = {}) {
      layer.classList.remove("is-open");
      layer.setAttribute("aria-hidden", "true");
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-label", "Open navigation");
      document.body.classList.remove("v7-mobile-nav-open");
      const finish = () => {
        if (!layer.classList.contains("is-open")) layer.hidden = true;
        if (restore && previousFocus instanceof HTMLElement) previousFocus.focus();
      };
      matchMedia("(prefers-reduced-motion: reduce)").matches ? finish() : setTimeout(finish, 260);
    }

    button.addEventListener("click", () => layer.classList.contains("is-open") ? close() : open());
    layer.querySelectorAll("[data-v7-nav-close]").forEach(el => el.addEventListener("click", () => close()));
    layer.querySelectorAll("a[href]").forEach(link => link.addEventListener("click", () => close({ restore: false })));

    document.addEventListener("keydown", event => {
      if (!layer.classList.contains("is-open")) return;
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    matchMedia("(min-width: 761px)").addEventListener?.("change", event => {
      if (event.matches && layer.classList.contains("is-open")) close({ restore: false });
    });
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", initMobileNav, { once: true })
    : initMobileNav();
})();
