(() => {
  "use strict";

  const manifestUrl = "/assets/showcase/manifest.json";
  const path = location.pathname.replace(/\/+$/, "") || "/";

  const esc = value => String(value ?? "")
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#39;");

  const openLightbox = (src, label, appTitle) => {
    let modal = document.querySelector(".v62-showcase-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.className = "v62-showcase-modal";
      modal.innerHTML = `
        <button class="v62-showcase-close" type="button" aria-label="Close screenshot">×</button>
        <div class="v62-showcase-modal-inner">
          <img alt="">
          <div><strong></strong><span></span></div>
        </div>`;
      modal.addEventListener("click", event => {
        if (event.target === modal || event.target.closest(".v62-showcase-close")) modal.removeAttribute("data-open");
      });
      document.addEventListener("keydown", event => {
        if (event.key === "Escape") modal?.removeAttribute("data-open");
      });
      document.body.append(modal);
    }
    modal.querySelector("img").src = src;
    modal.querySelector("img").alt = `${appTitle} — ${label}`;
    modal.querySelector("strong").textContent = appTitle;
    modal.querySelector("span").textContent = label;
    modal.setAttribute("data-open","1");
  };

  const shotCard = (app, shot, className = "") => {
    const figure = document.createElement("figure");
    figure.className = `v62-shot ${className}`.trim();
    figure.innerHTML = `
      <button type="button" class="v62-shot-open">
        <span class="v62-shot-frame">
          <img loading="lazy" decoding="async" src="${esc(shot.file)}" alt="${esc(app.title)} — ${esc(shot.label)}">
          <i aria-hidden="true"></i>
        </span>
        <figcaption><small>REAL SOFTWARE // SNAPSHOT</small><strong>${esc(shot.label)}</strong><b>EXPAND ↗</b></figcaption>
      </button>`;
    figure.querySelector("button").addEventListener("click", () => openLightbox(shot.file, shot.label, app.title));
    return figure;
  };

  const buildHome = apps => {
    if (path !== "/" || document.querySelector(".v62-home-showcase")) return;
    const available = apps.filter(app => app.screens?.length).slice(0,3);
    if (!available.length) return;

    const section = document.createElement("section");
    section.className = "v62-home-showcase";
    section.setAttribute("aria-labelledby","v62-home-showcase-title");
    section.innerHTML = `
      <div class="v62-home-showcase-head">
        <div><span>REAL SOFTWARE // CAPTURED</span><h2 id="v62-home-showcase-title">NOT A MOCKUP.<br><em>THIS IS THE SOFTWARE.</em></h2></div>
        <p>Actual interface snapshots from software I built. Open the live web app or case study when you want to go deeper.</p>
      </div>
      <div class="v62-home-showcase-grid"></div>`;

    const grid = section.querySelector(".v62-home-showcase-grid");
    available.forEach(app => {
      const shot = app.screens[0];
      const card = document.createElement("article");
      card.className = "v62-home-app";
      card.innerHTML = `<div class="v62-home-app-meta"><small>${esc(app.title)}</small><span>${esc(shot.label)}</span></div>`;
      card.prepend(shotCard(app, shot, "v62-home-shot"));
      grid.append(card);
    });

    const anchor = document.querySelector(".clarity-hero");
    if (anchor) anchor.insertAdjacentElement("afterend", section);
  };

  const buildTry = appsById => {
    document.querySelectorAll("[data-showcase-app]").forEach(host => {
      if (host.querySelector(".v62-app-showcase")) return;
      const app = appsById.get(host.dataset.showcaseApp);
      if (!app?.screens?.length) return;

      const wrap = document.createElement("section");
      wrap.className = "v62-app-showcase";
      wrap.innerHTML = `
        <div class="v62-app-showcase-head">
          <span>REAL INTERFACE SNAPSHOTS</span>
          <small>Captured from the actual software</small>
        </div>
        <div class="v62-app-showcase-track"></div>`;

      const track = wrap.querySelector(".v62-app-showcase-track");
      app.screens.slice(0,3).forEach(shot => track.append(shotCard(app, shot)));

      const facts = host.querySelector(".live-app-facts");
      const actions = host.querySelector(".live-app-actions");
      if (facts) facts.insertAdjacentElement("afterend", wrap);
      else if (actions) actions.insertAdjacentElement("beforebegin", wrap);
      else host.append(wrap);
    });
  };

  const buildCaseStudy = appsById => {
    const main = document.querySelector("main[data-showcase-app]");
    if (!main || main.querySelector(".v62-case-showcase")) return;
    const app = appsById.get(main.dataset.showcaseApp);
    if (!app?.screens?.length) return;

    const section = document.createElement("section");
    section.className = "v62-case-showcase";
    section.innerHTML = `
      <div class="v62-case-showcase-head">
        <div><span>REAL SOFTWARE // INTERFACE</span><h2>SEE THE SYSTEM<br><em>AS IT ACTUALLY RUNS.</em></h2></div>
        <p>These are captured interface screens from the real application, not illustrative mockups.</p>
      </div>
      <div class="v62-case-showcase-grid"></div>`;

    const grid = section.querySelector(".v62-case-showcase-grid");
    app.screens.slice(0,4).forEach((shot, index) => grid.append(shotCard(app, shot, index === 0 ? "featured" : "")));

    const hero = main.querySelector(".hero");
    if (hero) hero.insertAdjacentElement("afterend", section);
    else main.prepend(section);
  };

  fetch(`${manifestUrl}?t=${Date.now()}`, { cache: "no-store" })
    .then(response => response.ok ? response.json() : Promise.reject())
    .then(manifest => {
      const apps = Array.isArray(manifest.apps) ? manifest.apps.filter(app => Array.isArray(app.screens) && app.screens.length) : [];
      if (!apps.length) return;
      const appsById = new Map(apps.map(app => [app.id, app]));
      buildHome(apps);
      buildTry(appsById);
      buildCaseStudy(appsById);
    })
    .catch(() => {});
})();