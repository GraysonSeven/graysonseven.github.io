(() => {
  "use strict";
  const body = document.body;
  if (!body) return;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const path = location.pathname.replace(/\/+$/, "") || "/";

  // One public information architecture everywhere.
  const navItems = [
    ["HOME", "/"],
    ["TRY APPS", "/try/"],
    ["WORK", "/portfolio/"],
    ["WEBSITE STUDIO", "/website-studio/", "v4-nav-studio"],
    ["ABOUT", "/about/"],
    ["CONTACT", "/contact/"]
  ];
  const normalize = p => (p || "/").replace(/\/+$/, "") || "/";
  const currentFor = href => {
    const h = normalize(href);
    if (h === "/") return path === "/";
    if (h === "/portfolio") return path.startsWith("/portfolio");
    return path === h || path.startsWith(h + "/");
  };

  document.querySelectorAll("header nav").forEach(nav => {
    if (nav.closest(".sample-site")) return;
    nav.classList.add("v4-unified-nav");
    nav.setAttribute("aria-label", "Main navigation");
    nav.innerHTML = navItems.map(([label, href, cls]) =>
      `<a href="${href}" class="${cls || ""}" ${currentFor(href) ? 'aria-current="page"' : ""}>${label}</a>`
    ).join("");
  });

  // Mobile navigation for older pages that did not have a menu button.
  document.querySelectorAll("header").forEach(header => {
    if (header.closest(".sample-site")) return;
    const nav = header.querySelector(":scope > nav.v4-unified-nav");
    if (!nav || header.querySelector(".menu-toggle,.v4-mobile-menu")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "v4-mobile-menu";
    button.setAttribute("aria-label", "Open menu");
    button.setAttribute("aria-expanded", "false");
    button.innerHTML = "<span></span><span></span>";
    button.addEventListener("click", () => {
      const open = !body.classList.contains("v4-mobile-nav-open");
      body.classList.toggle("v4-mobile-nav-open", open);
      button.setAttribute("aria-expanded", String(open));
      button.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => body.classList.remove("v4-mobile-nav-open")));
    header.append(button);
  });

  // Replace mixed-generation footers with one quiet, useful footer.
  document.querySelectorAll("footer").forEach(f => {
    if (!f.classList.contains("v4-unified-footer")) f.remove();
  });
  const footer = document.createElement("footer");
  footer.className = "v4-unified-footer";
  footer.innerHTML = `
    <div class="v4-footer-brand"><i></i><span>© ${new Date().getFullYear()} CHARLES LIOC · SOFTWARE · WEBSITES · SYSTEMS</span></div>
    <nav aria-label="Footer navigation">
      <a href="/try/">TRY APPS</a><a href="/portfolio/">WORK</a><a href="/website-studio/">GET A WEBSITE</a><a href="/contact/">CONTACT</a><a href="/privacy/">PRIVACY</a>
    </nav>
    <div class="v4-footer-note">THIS WEBSITE WAS DESIGNED AND BUILT BY CHARLES LIOC. WEBSITE PROJECT REQUESTS ARE CURRENTLY OPEN.</div>`;
  const host = document.querySelector(".shell,.wrap") || body;
  host.append(footer);

  // Self-drawing signal map: line animation + ambient motion, inspired by modern scrollytelling.
  const firstHero = document.querySelector("main .hero, main .try-hero, main .studio-intro");
  if (firstHero && !firstHero.querySelector(".v4-hero-network")) {
    firstHero.style.position = "relative";
    const net = document.createElement("div");
    net.className = "v4-hero-network";
    net.setAttribute("aria-hidden", "true");
    net.innerHTML = `<svg viewBox="0 0 1200 650" preserveAspectRatio="xMidYMid slice"><path d="M-30 510 C180 315 286 585 470 350 S760 85 1220 250"/><path d="M70 90 C275 220 325 155 510 265 S860 585 1210 455"/><path d="M-40 265 C210 170 410 420 610 285 S930 180 1240 85"/><circle cx="470" cy="350" r="4"/><circle cx="860" cy="445" r="4"/><circle cx="1010" cy="165" r="4"/></svg>`;
    firstHero.prepend(net);
  }

  // Horizontal kinetic strip acts as a visual chapter break, not another paragraph.
  const homeHero = document.querySelector(".clarity-home .clarity-hero");
  if (homeHero && !document.querySelector(".v4-kinetic-strip")) {
    const strip = document.createElement("div");
    strip.className = "v4-kinetic-strip";
    strip.setAttribute("aria-hidden", "true");
    const phrase = `<span>TRY THE BUILDS</span><i>◆</i><b>SOFTWARE</b><i>◆</i><span>CUSTOM WEBSITES</span><i>◆</i><b>BUSINESS SYSTEMS</b><i>◆</i><span>BUILD · TEST · IMPROVE</span><i>◆</i>`;
    strip.innerHTML = `<div class="v4-kinetic-track">${phrase}${phrase}${phrase}${phrase}</div>`;
    homeHero.insertAdjacentElement("afterend", strip);
  }

  // Moving structured graphics, separate from the softer particle field.
  if (!document.querySelector(".v4-signal-field")) {
    const field = document.createElement("div");
    field.className = "v4-signal-field";
    field.setAttribute("aria-hidden", "true");
    field.innerHTML = `<i class="v4-signal-lane"></i><i class="v4-signal-lane"></i><i class="v4-signal-lane"></i><i class="v4-orbit-ghost"></i>`;
    body.prepend(field);
  }

  // Let the exact source logo load once from the shared PNG instead of several duplicate SVG wrappers.
  // The PNG bytes are exactly the embedded raster from the locked SVG; the locked SVG itself stays untouched in the repository.
  document.querySelectorAll('img[src*="charles-lioc-logo-locked.svg"],img[src*="portfolio/assets/favicon.svg"]').forEach(img => {
    img.src = "/assets/charles-lioc-og.png";
    img.decoding = "async";
  });

  // Active product graphics react subtly to pointer position.
  if (!reduceMotion && matchMedia("(hover:hover) and (pointer:fine)").matches) {
    document.querySelectorAll(".v4-proof-rack,.showroom-visual,.live-app-card,.web-cta-preview").forEach(el => {
      el.addEventListener("pointermove", e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) / r.width;
        const y = (e.clientY - (r.top + r.height / 2)) / r.height;
        el.style.setProperty("--v4-x", `${x * 8}px`);
        el.style.setProperty("--v4-y", `${y * 6}px`);
      });
      el.addEventListener("pointerleave", () => {
        el.style.removeProperty("--v4-x");
        el.style.removeProperty("--v4-y");
      });
    });
  }

  // A small amount of scroll-linked motion makes the hero feel spatial without hijacking scrolling.
  if (!reduceMotion) {
    let ticking = false;
    const moveNetwork = () => {
      ticking = false;
      const y = Math.min(42, scrollY * 0.035);
      const x = Math.sin(scrollY * 0.0025) * 8;
      document.documentElement.style.setProperty("--v4-network-y", `${y}px`);
      document.documentElement.style.setProperty("--v4-network-x", `${x}px`);
    };
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(moveNetwork); } }, { passive: true });
    moveNetwork();
  }

  // Current generation command center: only the public structure that matters.
  const commandList = document.querySelector(".fx-command-list");
  if (commandList) {
    const email = "icharles.development@gmail.com";
    commandList.innerHTML = `
      <a href="/"><span>01</span><span>HOME</span><em>WHAT I BUILD + CLIENT ENTRY</em></a>
      <a href="/try/"><span>02</span><span>OPEN MY APPS</span><em>LIVE WEB BUILDS</em></a>
      <a href="/portfolio/"><span>03</span><span>WORK</span><em>PROJECTS + CASE STUDIES</em></a>
      <a href="/website-studio/"><span>04</span><span>WEBSITE STUDIO</span><em>FREE PROJECT REQUEST</em></a>
      <a href="/about/"><span>05</span><span>ABOUT</span><em>HOW I THINK + BUILD</em></a>
      <a href="/contact/"><span>06</span><span>CONTACT</span><em>DIRECT PROJECT CONTACT</em></a>
      <button type="button" data-v4-copy-email><span>07</span><span>COPY EMAIL</span><em>${email.toUpperCase()}</em></button>`;
    commandList.querySelector("[data-v4-copy-email]")?.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(email); } catch (_) {}
      const toast = document.querySelector(".fx-toast");
      if (toast) {
        toast.textContent = "EMAIL COPIED // READY TO PASTE";
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 1800);
      }
    });
  }
})();

// ---------- V4.2.3 SLIDE PANEL NAVIGATION ----------
(() => {
  const body = document.body;
  if (!body || document.querySelector(".v423-panel")) return;

  // Retire the old bottom-corner floating navigation controls.
  document.querySelectorAll(
    ".fx-command-trigger,.fx-command-palette,.fx-client-badge,.fx-try-badge,.v4-mobile-menu"
  ).forEach(el => el.remove());

  const menuButton = document.createElement("button");
  menuButton.type = "button";
  menuButton.className = "v423-menu-button";
  menuButton.setAttribute("aria-label", "Open navigation panel");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.innerHTML = `
    <span class="v423-menu-icon" aria-hidden="true"><i></i><i></i><i></i></span>
    <strong>MENU</strong>`;

  const header = [...document.querySelectorAll("header")].find(h => !h.closest(".sample-site"));
  const brand = header?.querySelector(":scope > .brand");
  if (header && brand) {
    let left = header.querySelector(":scope > .v423-header-left");
    if (!left) {
      left = document.createElement("div");
      left.className = "v423-header-left";
      header.insertBefore(left, brand);
      left.append(brand);
    }
    left.prepend(menuButton);
  } else {
    menuButton.classList.add("v423-menu-button-fixed");
    body.prepend(menuButton);
  }

  const overlay = document.createElement("button");
  overlay.type = "button";
  overlay.className = "v423-panel-overlay";
  overlay.setAttribute("aria-label", "Close navigation panel");
  overlay.tabIndex = -1;

  const panel = document.createElement("aside");
  panel.className = "v423-panel";
  panel.setAttribute("aria-hidden", "true");
  panel.setAttribute("aria-label", "Site navigation panel");
  panel.innerHTML = `
    <div class="v423-panel-head">
      <a href="/" class="v423-panel-brand">
        <img src="/assets/charles-lioc-og.png" alt="">
        <span><strong>CHARLES LIOC</strong><small>BUILD // IMPROVE // CREATE</small></span>
      </a>
      <button type="button" class="v423-panel-close" aria-label="Close navigation panel">
        <span aria-hidden="true">×</span>
      </button>
    </div>

    <div class="v423-panel-intro">
      <span>NAVIGATION // COMMAND PANEL</span>
      <p>Everything important in one place.</p>
    </div>

    <nav class="v423-panel-nav" aria-label="Panel navigation">
      <a href="/">
        <span>01</span><div><strong>HOME</strong><small>What I build and how I work</small></div><b>→</b>
      </a>
      <a href="/try/">
        <span>02</span><div><strong>MY APPS</strong><small>Open the real web applications</small></div><b>→</b>
      </a>
      <a href="/portfolio/">
        <span>03</span><div><strong>WORK / PORTFOLIO</strong><small>Projects, systems and case studies</small></div><b>→</b>
      </a>
      <a href="/website-studio/" class="v423-panel-primary">
        <span>04</span><div><strong>BUILD MY WEBSITE</strong><small>Start a free project request</small></div><b>→</b>
      </a>
      <a href="/about/">
        <span>05</span><div><strong>ABOUT</strong><small>How I think, build and solve problems</small></div><b>→</b>
      </a>
      <a href="/contact/">
        <span>06</span><div><strong>CONTACT</strong><small>Email, phone and Facebook</small></div><b>→</b>
      </a>
    </nav>

    <div class="v423-panel-contact">
      <span>DIRECT CONTACT</span>
      <a href="mailto:icharles.development@gmail.com?subject=Project%20Inquiry">
        <small>EMAIL</small><strong>icharles.development@gmail.com</strong>
      </a>
      <a href="tel:+639916154479">
        <small>PHONE</small><strong>+63 991 615 4479</strong>
      </a>
      <a href="https://www.facebook.com/doubleone.seven.117" target="_blank" rel="noopener noreferrer">
        <small>FACEBOOK</small><strong>OPEN PROFILE ↗</strong>
      </a>
    </div>

    <div class="v423-panel-foot">
      <span><i></i> WEBSITE CLIENTS // OPEN</span>
      <kbd>CTRL K</kbd>
    </div>`;

  body.append(overlay, panel);

  const closeButton = panel.querySelector(".v423-panel-close");
  let lastFocused = null;

  const setOpen = open => {
    if (open) lastFocused = document.activeElement;
    body.classList.toggle("v423-panel-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Close navigation panel" : "Open navigation panel");
    panel.setAttribute("aria-hidden", String(!open));
    if (open) {
      requestAnimationFrame(() => closeButton?.focus());
    } else if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
  };

  menuButton.addEventListener("click", () => {
    setOpen(!body.classList.contains("v423-panel-open"));
  });
  closeButton?.addEventListener("click", () => setOpen(false));
  overlay.addEventListener("click", () => setOpen(false));
  panel.querySelectorAll("a").forEach(a => a.addEventListener("click", () => setOpen(false)));

  // Ctrl/Cmd+K now opens this panel instead of the retired bottom-right Quick Nav.
  addEventListener("keydown", event => {
    const shortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";
    if (shortcut) {
      event.preventDefault();
      event.stopImmediatePropagation();
      setOpen(!body.classList.contains("v423-panel-open"));
      return;
    }
    if (event.key === "Escape" && body.classList.contains("v423-panel-open")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      setOpen(false);
    }
  }, true);
})();
