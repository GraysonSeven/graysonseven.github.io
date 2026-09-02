(() => {
  "use strict";
  const body = document.body;
  if (!body || body.dataset.cp4Ready === "1") return;

  const path = location.pathname.replace(/\/+$/, "") || "/";
  const isAbout = path === "/about";
  const isContact = path === "/contact";
  if (!isAbout && !isContact) return;

  body.dataset.cp4Ready = "1";
  const asset = name => `/assets/cyberpunk/final/${name}`;

  const makeImg = (name, cls) => {
    const el = document.createElement("img");
    el.src = asset(name);
    el.className = cls;
    el.alt = "";
    el.setAttribute("aria-hidden", "true");
    el.loading = "lazy";
    el.decoding = "async";
    return el;
  };

  const addTraceAfter = element => {
    if (!element || element.nextElementSibling?.classList.contains("cp4-trace-wrap")) return;
    const wrap = document.createElement("div");
    wrap.className = "cp4-trace-wrap";
    wrap.setAttribute("aria-hidden", "true");
    wrap.append(makeImg("contact-trace.svg", "cp4-section-trace"));
    element.insertAdjacentElement("afterend", wrap);
  };

  const hero = document.querySelector("main > .hero");
  if (hero) {
    hero.style.position = "relative";
    hero.style.isolation = "isolate";
    addTraceAfter(hero);
  }

  if (isAbout) {
    const layout = document.querySelector(".about-layout");
    if (layout) {
      layout.prepend(
        makeImg("builder-core.svg", "cp4-art cp4-about-core"),
        makeImg("maker-sigil.svg", "cp4-art cp4-about-sigil")
      );
    }

    const identity = document.querySelector(".identity-panel");
    if (identity && !identity.querySelector(".cp4-identity-core")) {
      identity.prepend(makeImg("builder-core.svg", "cp4-identity-core"));
    }
  }

  if (isContact) {
    const layout = document.querySelector(".contact-layout");
    if (layout) {
      layout.prepend(
        makeImg("comms-array.svg", "cp4-art cp4-contact-array"),
        makeImg("angular-shard.svg", "cp4-art cp4-contact-shard")
      );
    }

    const terminal = document.querySelector(".terminal");
    if (terminal && !terminal.querySelector(".cp4-terminal-array")) {
      terminal.prepend(makeImg("comms-array.svg", "cp4-terminal-array"));
    }
  }

  // Pause ornamental motion when it is offscreen. This keeps the page lively without
  // burning animation work for graphics the visitor cannot see.
  const ornamental = [...document.querySelectorAll(
    ".cp4-art,.cp4-identity-core,.cp4-terminal-array,.cp4-trace-wrap"
  )];

  if ("IntersectionObserver" in window && ornamental.length) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        entry.target.classList.toggle("cp4-paused", !entry.isIntersecting);
      }
    }, { rootMargin: "120px 0px", threshold: 0 });
    ornamental.forEach(el => observer.observe(el));
  }

  const syncVisibility = () => {
    body.classList.toggle("cp4-page-hidden", document.hidden);
  };
  document.addEventListener("visibilitychange", syncVisibility, { passive: true });
  syncVisibility();
})();