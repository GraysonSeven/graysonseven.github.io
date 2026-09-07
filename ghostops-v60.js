(() => {
  "use strict";
  const root = document.documentElement;
  const body = document.body;
  if (!body || body.dataset.ghostOpsV60 === "1") return;
  body.dataset.ghostOpsV60 = "1";
  body.classList.add("v60-ghostops");

  const path = location.pathname.replace(/\/+$/, "") || "/";
  const home = path === "/";
  if (home) body.classList.add("v60-ghostops-home");

  const storageKey = "icharles-ui-theme";
  const getTheme = () => root.dataset.uiTheme === "light" ? "light" : "dark";

  const themeAssets = {
    dark: "/assets/iko-prime/ghostops/home-skyline-dark.webp?v=60",
    light: "/assets/iko-prime/ghostops/home-skyline-light.webp?v=60"
  };

  const updateAtmosphere = theme => {
    if (!home) return;
    const bg = document.querySelector(".iko-v5-atmosphere > img");
    if (bg) {
      bg.src = themeAssets[theme];
      bg.fetchPriority = "low";
      bg.decoding = "async";
    }
  };

  const syncControls = theme => {
    document.querySelectorAll(".v60-theme-toggle").forEach(button => {
      button.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
      button.setAttribute("aria-label", `Switch to ${theme === "light" ? "dark" : "light"} theme`);
      button.dataset.theme = theme;
      const label = button.querySelector(".v60-theme-label");
      if (label) label.textContent = theme.toUpperCase();
    });
  };

  const applyTheme = (theme, persist = true) => {
    theme = theme === "light" ? "light" : "dark";
    root.dataset.uiTheme = theme;
    root.style.colorScheme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "light" ? "#f5f9ff" : "#03070d");
    if (persist) {
      try { localStorage.setItem(storageKey, theme); } catch (_) {}
    }
    updateAtmosphere(theme);
    syncControls(theme);
  };

  const buildToggle = compact => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `v60-theme-toggle${compact ? " compact" : ""}`;
    button.innerHTML = `
      <span class="v60-theme-track" aria-hidden="true">
        <i class="v60-theme-knob"></i>
        <b class="v60-theme-dark-mark"></b>
        <b class="v60-theme-light-mark"></b>
      </span>
      <span class="v60-theme-label">${getTheme().toUpperCase()}</span>`;
    button.addEventListener("click", () => {
      applyTheme(getTheme() === "dark" ? "light" : "dark", true);
    });
    return button;
  };

  // Unify the public identity line with the new Ghost Ops-inspired direction.
  document.querySelectorAll("header .brand small,.v423-panel-brand small").forEach(small => {
    small.textContent = "BUILD · CREATE · SOLVE";
  });

  const header = [...document.querySelectorAll("header")].find(h => !h.closest(".sample-site"));
  if (header && !header.querySelector(".v60-header-tools")) {
    const tools = document.createElement("div");
    tools.className = "v60-header-tools";
    tools.innerHTML = `<div class="v60-header-micro" aria-hidden="true"><span>IDEAS</span><span>SYSTEMS</span><span>REAL IMPACT</span></div>`;
    tools.prepend(buildToggle(false));
    header.append(tools);
  }

  const panelContact = document.querySelector(".v423-panel-contact");
  if (panelContact && !panelContact.querySelector(".v60-theme-toggle")) {
    const row = document.createElement("div");
    row.className = "v60-panel-theme";
    row.innerHTML = `<span>INTERFACE THEME</span>`;
    row.append(buildToggle(true));
    panelContact.prepend(row);
  }

  if (home) {
    const hero = document.querySelector(".clarity-hero");
    const copy = hero?.querySelector(".hero-copy");

    if (hero && !hero.querySelector(".v60-hero-hud")) {
      const hud = document.createElement("div");
      hud.className = "v60-hero-hud";
      hud.setAttribute("aria-hidden", "true");
      hud.innerHTML = `
        <div class="v60-left-index"><b>01</b><span>02</span><span>03</span><span>04</span></div>
        <div class="v60-right-mission">
          <small>CHARLES LIOC</small>
          <strong>BUILDING USEFUL THINGS.</strong>
          <i></i>
          <span>SOFTWARE</span><span>WEBSITES</span><span>SYSTEMS</span><span>REAL IMPACT</span>
        </div>
        <div class="v60-side-quote"><i></i><span>CLEAN SYSTEMS<br>CREATE FREEDOM.</span></div>`;
      hero.append(hud);
    }

    if (copy && !copy.querySelector(".v60-hero-motto")) {
      const motto = document.createElement("div");
      motto.className = "v60-hero-motto";
      motto.innerHTML = `<i></i><span>IDEAS TO SYSTEMS // BUILT FOR WHAT'S NEXT</span>`;
      const actions = copy.querySelector(".hero-actions");
      if (actions) actions.before(motto);
      else copy.append(motto);
    }

    if (hero && !hero.querySelector(".v60-horizon-layer")) {
      const horizon = document.createElement("div");
      horizon.className = "v60-horizon-layer";
      horizon.setAttribute("aria-hidden", "true");
      hero.prepend(horizon);
    }
  }

  applyTheme(getTheme(), false);

  // The public brand defaults to DARK. We intentionally do not follow later
  // operating-system theme changes. Only the site's own toggle changes/persists it.
})();
