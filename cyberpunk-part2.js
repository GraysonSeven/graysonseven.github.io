(() => {
  "use strict";
  const body = document.body;
  if (!body || body.dataset.cp2Ready === "1") return;
  body.dataset.cp2Ready = "1";

  const path = location.pathname.replace(/\/+$/, "") || "/";
  const asset = name => `/assets/cyberpunk/parts/${name}`;
  const makeImg = (name, cls, alt = "") => {
    const img = document.createElement("img");
    img.src = asset(name);
    img.className = cls;
    img.alt = alt;
    img.setAttribute("aria-hidden", "true");
    img.loading = "lazy";
    img.decoding = "async";
    return img;
  };

  const addDividerAfter = element => {
    if (!element || element.nextElementSibling?.classList.contains("cp2-divider")) return;
    const img = makeImg("data-divider.svg", "cp2-divider");
    element.insertAdjacentElement("afterend", img);
  };

  // ---------- Apps page ----------
  if (path === "/try") {
    const hero = document.querySelector(".live-app-hero");
    if (hero) {
      const radar = makeImg("radar-orbit.svg", "cp2-art cp2-radar cp2-hero-radar");
      const crystal = makeImg("crystal-node.svg", "cp2-art cp2-crystal cp2-hero-crystal");
      const wave = makeImg("signal-wave.svg", "cp2-art cp2-wave cp2-hero-wave");
      hero.prepend(radar, crystal, wave);
    }

    const library = document.querySelector(".live-app-library");
    if (library) {
      library.prepend(
        makeImg("circuit-corner.svg", "cp2-art cp2-corner cp2-library-corner"),
        makeImg("hex-core.svg", "cp2-art cp2-hex cp2-library-hex")
      );
    }

    document.querySelectorAll(".live-icon-stage").forEach(stage => {
      if (stage.querySelector(".cp2-radar-small")) return;
      stage.prepend(
        makeImg("radar-orbit.svg", "cp2-radar-small"),
        makeImg("hex-core.svg", "cp2-hex-small")
      );
      stage.append(makeImg("pedestal.svg", "cp2-app-pedestal"));
    });

    document.querySelectorAll(".live-app-card").forEach(card => {
      if (!card.querySelector(".cp2-card-circuit")) {
        card.append(makeImg("circuit-corner.svg", "cp2-card-circuit"));
      }
    });

    addDividerAfter(hero);
    const lastCard = document.querySelector(".live-app-card:last-of-type");
    addDividerAfter(lastCard);
  }

  // ---------- Portfolio main ----------
  if (path === "/portfolio") {
    const launch = document.querySelector(".portfolio-launch-section");
    if (launch) {
      launch.prepend(
        makeImg("radar-orbit.svg", "cp2-art cp2-radar cp2-portfolio-radar"),
        makeImg("crystal-node.svg", "cp2-art cp2-crystal cp2-portfolio-crystal")
      );
    }

    document.querySelectorAll(".launch-card").forEach(card => {
      if (!card.querySelector(".cp2-launch-pedestal")) {
        card.prepend(makeImg("pedestal.svg", "cp2-launch-pedestal"));
      }
    });

    const stage = document.querySelector(".project-stage");
    if (stage) {
      stage.prepend(
        makeImg("circuit-corner.svg", "cp2-stage-corner"),
        makeImg("hex-core.svg", "cp2-stage-hex")
      );
    }

    const tabs = document.querySelector(".project-tabs,.project-list,.project-nav");
    if (tabs && !tabs.previousElementSibling?.classList.contains("cp2-tab-wave")) {
      tabs.insertAdjacentElement("beforebegin", makeImg("signal-wave.svg", "cp2-tab-wave"));
    }

    addDividerAfter(launch);
    const workHead = document.querySelector(".work-section .section-head");
    addDividerAfter(workHead);
  }

  // ---------- Case-study pages ----------
  if (path.startsWith("/portfolio/projects/")) {
    const main = document.querySelector("main");
    if (main && !main.querySelector(".cp2-case-ornaments")) {
      main.style.position = "relative";
      const box = document.createElement("div");
      box.className = "cp2-case-ornaments";
      box.setAttribute("aria-hidden", "true");
      box.append(
        makeImg("radar-orbit.svg", ""),
        makeImg("circuit-corner.svg", "")
      );
      main.prepend(box);
    }
  }
})();