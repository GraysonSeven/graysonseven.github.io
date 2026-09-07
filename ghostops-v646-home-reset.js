(() => {
  "use strict";

  const path = location.pathname.replace(/\/+$/, "") || "/";
  if (path !== "/") return;

  // Deterministic QA theme application. Normal visitors are untouched.
  const params = new URLSearchParams(location.search);
  if (params.get("vqa-capture") === "1") {
    const qaTheme = params.get("vqa-theme");
    if (qaTheme === "dark" || qaTheme === "light") {
      document.documentElement.dataset.uiTheme = qaTheme;
    }
  }

  const install = () => {
    const hero = document.querySelector(".clarity-hero");
    if (!hero || hero.dataset.v646Reset === "1") return;
    hero.dataset.v646Reset = "1";

    // Dedicated predictable identity stage using the existing production
    // 1024px Iko derivative. No asset is regenerated or modified.
    const stage = document.createElement("div");
    stage.className = "v646-identity-stage";
    stage.setAttribute("aria-hidden","true");

    const orbit = document.createElement("img");
    orbit.className = "v646-identity-orbit";
    orbit.src = "/assets/iko-prime/ghostops/home-v642/home-orbit-dark-v642.webp?v=646";
    orbit.alt = "";
    orbit.decoding = "async";

    const logo = document.createElement("img");
    logo.className = "v646-identity-logo";
    logo.src = "/assets/iko-prime/identity/iko-prime-logo-1024.webp?v=55";
    logo.alt = "";
    logo.decoding = "async";
    logo.loading = "eager";
    logo.fetchPriority = "high";

    const tags = document.createElement("div");
    tags.className = "v646-identity-tags";
    tags.innerHTML = "<span>SOFTWARE</span><span>WEBSITES</span><span>SYSTEMS</span>";

    stage.append(orbit, logo, tags);

    const copy = hero.querySelector(".hero-copy");
    if (copy?.nextSibling) hero.insertBefore(stage, copy.nextSibling);
    else hero.append(stage);

    const mission = document.createElement("div");
    mission.className = "v646-mission";
    mission.setAttribute("aria-hidden","true");
    mission.innerHTML = `
      <small>CHARLES LIOC</small>
      <strong>BUILDING USEFUL THINGS.</strong>
      <span>SOFTWARE</span>
      <span>WEBSITES</span>
      <span>SYSTEMS</span>
      <span>WORKFLOWS</span>
      <span>REAL IMPACT</span>
      <b>IKO // CL-001<br>STATE // ACTIVE</b>`;
    hero.append(mission);

    const left = document.createElement("div");
    left.className = "v646-left-index";
    left.setAttribute("aria-hidden","true");
    left.innerHTML = "<b>01</b><span>02</span><span>03</span><span>04</span>";
    hero.append(left);
  };

  install();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once:true });
  }
})();