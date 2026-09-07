(() => {
  "use strict";
  const body = document.body;
  if (!body || body.dataset.ikoV5Ready === "1") return;
  body.dataset.ikoV5Ready = "1";

  const root = document.documentElement;
  const path = location.pathname.replace(/\/+$/, "") || "/";
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover:hover) and (pointer:fine)").matches;
  const assetRoot = "/assets/iko-prime";

  const routeBackground = (() => {
    if (path === "/") return "home-command-center.webp";
    if (path === "/services") return "services-workspace.webp";
    if (path === "/try") return "try-apps-network.webp";
    if (path === "/portfolio" || path.startsWith("/portfolio/projects/")) return "portfolio-control-city.webp";
    if (path === "/website-studio") return "studio-design-console.webp";
    if (path === "/about") return "about-skyline.webp";
    if (path === "/contact" || path === "/project-inquiry-sent") return "contact-horizon.webp";
    return "home-command-center.webp";
  })();

  const atmosphere = document.createElement("div");
  atmosphere.className = "iko-v5-atmosphere";
  atmosphere.setAttribute("aria-hidden", "true");
  const bg = document.createElement("img");
  bg.src = `${assetRoot}/backgrounds/${routeBackground}?v=52`;
  bg.alt = "";
  bg.decoding = "async";
  if (path !== "/") bg.loading = "lazy";
  bg.dataset.ikoParallax = ".18";
  atmosphere.append(bg);
  body.prepend(atmosphere);

  document.querySelectorAll(".brand img,.v423-panel-brand img").forEach(img => {
    img.src = `${assetRoot}/identity/iko-prime-logo-512.webp?v=52`;
    img.decoding = "async";
  });

  const homeCore = document.querySelector(".clarity-home .clarity-core");
  if (homeCore) {
    homeCore.classList.add("iko-v5-home-core", "iko-v5-scan-surface");
    if (!homeCore.querySelector(".iko-v5-core-orbit")) {
      const orbit = document.createElement("img");
      orbit.className = "iko-v5-core-orbit";
      orbit.src = `${assetRoot}/hud/iko-orbital-reactor.webp?v=52`;
      orbit.alt = "";
      orbit.setAttribute("aria-hidden", "true");

      const logo = document.createElement("img");
      logo.className = "iko-v5-core-logo";
      logo.src = `${assetRoot}/identity/iko-prime-logo-1024.webp?v=52`;
      logo.alt = "";
      logo.setAttribute("aria-hidden", "true");
      logo.dataset.ikoParallax = ".55";

      const rail = document.createElement("img");
      rail.className = "iko-v5-core-rail";
      rail.src = `${assetRoot}/hud/iko-signal-rail.webp?v=52`;
      rail.alt = "";
      rail.setAttribute("aria-hidden", "true");

      homeCore.prepend(orbit, rail, logo);
    }
  }

  if (path !== "/") {
    const hero = document.querySelector("main > .hero,main .try-hero,main .live-app-hero,main .studio-intro");
    if (hero && !hero.querySelector(".iko-v5-page-mark")) {
      hero.classList.add("iko-v5-scan-surface");
      hero.style.position = "relative";
      hero.style.isolation = "isolate";
      const mark = document.createElement("img");
      mark.className = "iko-v5-page-mark";
      mark.src = path === "/website-studio"
        ? `${assetRoot}/hud/iko-portal-emblem.webp?v=52`
        : `${assetRoot}/identity/iko-prime-logo-512.webp?v=52`;
      mark.alt = "";
      mark.setAttribute("aria-hidden", "true");
      mark.loading = "lazy";
      mark.decoding = "async";
      mark.dataset.ikoParallax = ".38";
      hero.prepend(mark);
    }
  }

  const storageKey = "icharles-iko-effects";
  let saved = null;
  try { saved = localStorage.getItem(storageKey); } catch (_) {}
  root.dataset.ikoEffects = saved === "off" || reduceMotion ? "off" : "on";

  const makeToggle = () => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "iko-v5-effects";
    button.setAttribute("aria-pressed", root.dataset.ikoEffects === "on" ? "true" : "false");
    button.setAttribute("aria-label", "Toggle website graphics and animation");
    button.innerHTML = `<i aria-hidden="true"></i><span>${root.dataset.ikoEffects === "on" ? "GRAPHICS ON" : "GRAPHICS OFF"}</span>`;
    return button;
  };

  const syncToggle = state => {
    root.dataset.ikoEffects = state;
    document.querySelectorAll(".iko-v5-effects").forEach(button => {
      button.setAttribute("aria-pressed", state === "on" ? "true" : "false");
      const label = button.querySelector("span");
      if (label) label.textContent = state === "on" ? "GRAPHICS ON" : "GRAPHICS OFF";
    });
    try { localStorage.setItem(storageKey, state); } catch (_) {}
  };

  body.addEventListener("click", event => {
    const button = event.target.closest(".iko-v5-effects");
    if (!button) return;
    syncToggle(root.dataset.ikoEffects === "on" ? "off" : "on");
  });

  const panelContact = document.querySelector(".v423-panel-contact");
  if (panelContact && !panelContact.querySelector(".iko-v5-effects")) {
    panelContact.append(makeToggle());
  } else {
    const headerStatus = document.querySelector(".header-node,.header-status");
    if (headerStatus && !headerStatus.parentElement?.querySelector(".iko-v5-effects")) {
      headerStatus.insertAdjacentElement("afterend", makeToggle());
    }
  }

  if (finePointer && !reduceMotion) {
    let tx = 0, ty = 0, rx = 0, ry = 0, raf = 0;
    const targets = [...document.querySelectorAll("[data-iko-parallax]")];
    const step = () => {
      raf = 0;
      rx += (tx - rx) * .08;
      ry += (ty - ry) * .08;
      if (root.dataset.ikoEffects !== "off") {
        for (const el of targets) {
          const depth = Math.max(.1, Math.min(1, Number(el.dataset.ikoParallax || .5)));
          el.style.translate = `${(rx * depth).toFixed(2)}px ${(ry * depth).toFixed(2)}px`;
        }
      }
      if (Math.abs(tx-rx) > .02 || Math.abs(ty-ry) > .02) raf = requestAnimationFrame(step);
    };
    addEventListener("pointermove", event => {
      tx = (event.clientX / innerWidth - .5) * 8;
      ty = (event.clientY / innerHeight - .5) * 5;
      if (!raf) raf = requestAnimationFrame(step);
    }, { passive:true });
  }

  document.querySelectorAll(".header-node i,.clarity-status i").forEach((node, index) => {
    if (index % 3 === 2) node.classList.add("iko-v5-energy-node");
  });
})();
