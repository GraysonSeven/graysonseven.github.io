(() => {
  "use strict";
  if (!document.body?.classList.contains("studio-body")) return;
  if (document.body.dataset.cp3Ready === "1") return;
  document.body.dataset.cp3Ready = "1";

  const asset = name => `/assets/cyberpunk/studio/${name}`;
  const img = (name, cls) => {
    const el = document.createElement("img");
    el.src = asset(name);
    el.className = cls;
    el.alt = "";
    el.setAttribute("aria-hidden", "true");
    el.loading = "lazy";
    el.decoding = "async";
    return el;
  };

  const intro = document.querySelector(".studio-intro");
  if (intro) {
    intro.prepend(
      img("palette-reactor.svg", "cp3-art cp3-reactor cp3-intro-reactor"),
      img("flow-nodes.svg", "cp3-art cp3-flow cp3-intro-flow")
    );
  }

  const gate = document.querySelector(".studio-mode-gate");
  if (gate) {
    gate.prepend(
      img("layout-prism.svg", "cp3-art cp3-prism cp3-mode-prism"),
      img("wireframe-cube.svg", "cp3-art cp3-cube cp3-mode-cube")
    );
  }

  const wizard = document.querySelector(".wizard-shell");
  if (wizard) {
    wizard.prepend(
      img("bracket-frame.svg", "cp3-wizard-frame"),
      img("layout-prism.svg", "cp3-wizard-prism")
    );
  }

  const topbar = document.querySelector(".wizard-topbar");
  if (topbar && !topbar.querySelector(".cp3-console-state")) {
    const status = document.createElement("span");
    status.className = "cp3-console-state";
    status.innerHTML = `<i></i> DESIGN CONSOLE // LIVE`;
    const reset = topbar.querySelector("#reset-studio");
    if (reset) reset.insertAdjacentElement("beforebegin", status);
    else topbar.append(status);
  }

  document.querySelectorAll(".wizard-step").forEach(step => {
    if (!step.querySelector(".cp3-step-flow")) {
      step.prepend(img("flow-nodes.svg", "cp3-step-flow"));
    }
  });

  const previewSticky = document.querySelector(".preview-sticky");
  if (previewSticky) {
    previewSticky.prepend(
      img("palette-reactor.svg", "cp3-art cp3-preview-reactor"),
      img("wireframe-cube.svg", "cp3-art cp3-preview-cube")
    );
  }

  const previewStage = document.querySelector(".preview-stage");
  const sample = document.querySelector("#sample-site");
  if (previewStage) {
    if (!previewStage.querySelector(".cp3-preview-feed")) {
      const feed = document.createElement("div");
      feed.className = "cp3-preview-feed";
      feed.innerHTML = `<i></i><span>LIVE DESIGN FEED</span>`;
      previewStage.append(feed);

      const coords = document.createElement("div");
      coords.className = "cp3-preview-coordinates";
      coords.textContent = "X 00.0 // Y 00.0";
      previewStage.append(coords);
    }

    const coords = previewStage.querySelector(".cp3-preview-coordinates");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = matchMedia("(hover:hover) and (pointer:fine)").matches;

    if (sample && fine && !reduced) {
      previewStage.addEventListener("pointermove", event => {
        const rect = previewStage.getBoundingClientRect();
        const px = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
        const py = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
        const ry = (px - .5) * 3.2;
        const rx = (.5 - py) * 2.4;
        sample.style.setProperty("--cp3-rx", `${rx.toFixed(2)}deg`);
        sample.style.setProperty("--cp3-ry", `${ry.toFixed(2)}deg`);
        if (coords) coords.textContent = `X ${(px * 100).toFixed(1)} // Y ${(py * 100).toFixed(1)}`;
      }, { passive: true });

      previewStage.addEventListener("pointerleave", () => {
        sample.style.setProperty("--cp3-rx", "0deg");
        sample.style.setProperty("--cp3-ry", "0deg");
        if (coords) coords.textContent = "X 00.0 // Y 00.0";
      });
    }
  }

  // Selection feedback: a short holographic pulse on the actual chosen control.
  const form = document.querySelector("#website-request-form");
  if (form) {
    const ping = target => {
      const card = target.closest(
        ".type-choice-grid label,.theme-choice-grid label,.design-mode-card,.layout-choice-grid label,.palette-option,.check-grid label"
      );
      if (!card) return;
      card.classList.remove("cp3-ping");
      void card.offsetWidth;
      card.classList.add("cp3-ping");
      setTimeout(() => card.classList.remove("cp3-ping"), 560);
    };

    form.addEventListener("change", event => ping(event.target), true);
    form.addEventListener("click", event => {
      const palette = event.target.closest(".palette-option");
      if (palette) ping(palette);
    }, true);
  }

  // Easy/custom mode cards get subtle pointer depth without changing their click behavior.
  if (matchMedia("(hover:hover) and (pointer:fine)").matches &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll(".studio-mode-option").forEach(card => {
      card.addEventListener("pointermove", event => {
        const r = card.getBoundingClientRect();
        const x = (event.clientX - r.left) / r.width - .5;
        const y = (event.clientY - r.top) / r.height - .5;
        card.style.transform = `translateY(-5px) perspective(900px) rotateX(${(-y * 1.2).toFixed(2)}deg) rotateY(${(x * 1.5).toFixed(2)}deg)`;
      }, { passive: true });
      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });
  }
})();