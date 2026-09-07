(() => {
  "use strict";
  const path = location.pathname.replace(/\/+$/, "") || "/";
  if (path !== "/") return;

  const install = () => {
    const hero = document.querySelector(".clarity-hero");
    if (!hero || hero.querySelector(":scope > .v644-world-media")) return;

    const media = document.createElement("div");
    media.className = "v644-world-media";
    media.setAttribute("aria-hidden","true");

    const dark = document.createElement("img");
    dark.className = "v644-world-dark";
    dark.src = "/assets/iko-prime/ghostops/home-v642/home-world-dark-v642.webp?v=644";
    dark.alt = "";
    dark.decoding = "async";
    dark.fetchPriority = "high";

    const light = document.createElement("img");
    light.className = "v644-world-light";
    light.src = "/assets/iko-prime/ghostops/home-v642/home-world-light-v642.webp?v=644";
    light.alt = "";
    light.decoding = "async";
    light.fetchPriority = "high";

    media.append(dark, light);

    const firstContent = hero.firstElementChild;
    if (firstContent) hero.insertBefore(media, firstContent);
    else hero.append(media);
  };

  install();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once:true });
  }
})();