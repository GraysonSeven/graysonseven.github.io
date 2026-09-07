(() => {
  "use strict";

  const path = location.pathname.replace(/\/+$/, "") || "/";
  if (path !== "/") return;

  const body = document.body;
  if (!body || body.dataset.v64ReferenceHome === "1") return;
  body.dataset.v64ReferenceHome = "1";
  body.classList.add("v64-reference-home");

  const hero = document.querySelector(".clarity-hero");
  if (!hero) return;

  const svg = {
    services:`<svg viewBox="0 0 32 32" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="8" height="8"/><rect x="20" y="4" width="8" height="8"/><rect x="4" y="20" width="8" height="8"/><rect x="20" y="20" width="8" height="8"/></g></svg>`,
    terminal:`<svg viewBox="0 0 32 32" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square"><path d="M5 8l8 8-8 8"/><path d="M16 24h11"/></g></svg>`,
    apps:`<svg viewBox="0 0 32 32" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="6" width="24" height="16" rx="1"/><path d="M10 27h12M16 22v5"/></g></svg>`,
    website:`<svg viewBox="0 0 32 32" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2"><path d="M16 3l11 6v14l-11 6-11-6V9z"/><path d="M5 9l11 7 11-7M16 16v13"/></g></svg>`,
    studies:`<svg viewBox="0 0 32 32" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2"><path d="M5 27h22"/><path d="M8 23v-8h5v8M15 23V9h5v14M22 23V4h5v19"/></g></svg>`
  };

  // Turn the existing CTA pair into the reference-style launch controls.
  const actions = hero.querySelectorAll(".hero-actions a");
  if (actions[0] && !actions[0].querySelector(".v64-action-icon")) {
    actions[0].insertAdjacentHTML("afterbegin", `<span class="v64-action-icon">${svg.services}</span>`);
  }
  if (actions[1] && !actions[1].querySelector(".v64-action-icon")) {
    actions[1].insertAdjacentHTML("afterbegin", `<span class="v64-action-icon">${svg.terminal}</span>`);
  }

  // Move the three visitor choices into a full-width command deck like the target.
  const proof = hero.querySelector(".clarity-proof");
  if (proof) {
    proof.classList.add("v64-proof-deck");
    if (proof.parentElement !== hero) hero.append(proof);

    const cards = [...proof.querySelectorAll(":scope > a")];
    const icons = [svg.apps, svg.website, svg.studies];
    cards.forEach((card,index) => {
      if (!card.querySelector(".v64-proof-icon")) {
        card.insertAdjacentHTML("afterbegin", `<i class="v64-proof-icon" aria-hidden="true">${icons[index] || svg.apps}</i>`);
      }
      const desc = card.querySelector(":scope > span");
      const arrow = desc?.querySelector("b");
      if (arrow && arrow.parentElement !== card) {
        arrow.classList.add("v64-proof-arrow");
        card.append(arrow);
      }
    });
  }

  // Replace the early V6 HUD text with the final reference-style perimeter data.
  const hud = hero.querySelector(".v60-hero-hud");
  if (hud) {
    hud.innerHTML = `
      <div class="v60-left-index"><b>01</b><span>02</span><span>03</span><span>04</span></div>
      <div class="v60-right-mission">
        <small>CHARLES LIOC</small>
        <strong>BUILDING USEFUL THINGS.</strong>
        <i></i>
        <span>SOFTWARE</span>
        <span>WEBSITES</span>
        <span>SYSTEMS</span>
        <span>WORKFLOWS</span>
        <span>REAL IMPACT</span>
        <div class="v64-mission-line">SAME MISSION.<br>HIGHER STANDARDS.</div>
        <div class="v64-system-code">IKO // CL-001<br>STATE // ACTIVE</div>
      </div>
      <div class="v60-side-quote"><i></i><span>BUILD.<br>IMPROVE.<br>CREATE.</span></div>`;
  }

  // Finish the viewport with the same continuous lower identity rail.
  if (!hero.querySelector(".v64-bottom-strip")) {
    const strip = document.createElement("div");
    strip.className = "v64-bottom-strip";
    strip.setAttribute("aria-hidden","true");
    strip.innerHTML = `
      <strong>CHARLES LIOC</strong>
      <i></i>
      <span>SOFTWARE · WEBSITES · SYSTEMS · A MORE EFFICIENT TOMORROW</span>
      <b></b>
      <span class="v64-built">BUILT DIFFERENT.</span>`;
    hero.append(strip);
  }
})();