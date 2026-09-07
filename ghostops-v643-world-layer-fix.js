(() => {
  "use strict";
  const path = location.pathname.replace(/\/+$/, "") || "/";
  if (path !== "/") return;

  const install = () => {
    const hero = document.querySelector(".clarity-hero");
    if (!hero || hero.querySelector(":scope > .v643-world-layer")) return;

    const world = document.createElement("div");
    world.className = "v643-world-layer";
    world.setAttribute("aria-hidden","true");
    hero.prepend(world);
  };

  install();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once:true });
  }
})();