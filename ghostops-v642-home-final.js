(() => {
  "use strict";
  const path = location.pathname.replace(/\/+$/, "") || "/";
  if (path !== "/") return;

  const apply = () => {
    const hero = document.querySelector(".clarity-hero");
    const core = hero?.querySelector(".hero-core");
    if (!hero || !core || hero.dataset.v642Final === "1") return;
    hero.dataset.v642Final = "1";

    const orbit = document.createElement("div");
    orbit.className = "v642-orbit-frame";
    orbit.setAttribute("aria-hidden","true");
    core.prepend(orbit);

    const mission = document.createElement("div");
    mission.className = "v642-mission-panel";
    mission.setAttribute("aria-hidden","true");
    hero.append(mission);

    const rail = document.createElement("div");
    rail.className = "v642-left-rail";
    rail.setAttribute("aria-hidden","true");
    hero.append(rail);

    // The original proof links contain text labels OPEN/START/EXPLORE.
    // The approved reference uses a single clean arrow to avoid clipping.
    hero.querySelectorAll(".clarity-proof.v64-proof-deck .v64-proof-arrow").forEach(arrow => {
      arrow.textContent = "→";
      arrow.setAttribute("aria-hidden","true");
    });
  };

  // V6.4 runs earlier as a defer script, so normal execution is enough.
  // The DOMContentLoaded fallback also makes the patch robust if ordering changes.
  apply();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", apply, { once:true });
  }
})();