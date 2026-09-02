(() => {
  "use strict";
  const body = document.body;
  if (!body || body.dataset.cp1Ready === "1") return;
  body.dataset.cp1Ready = "1";

  // Global line/corner language. Deliberately no particles or floating navigation.
  const global = document.createElement("div");
  global.className = "cp1-global-layer";
  global.setAttribute("aria-hidden", "true");
  global.innerHTML = `
    <i class="cp1-edge-rail left"></i>
    <i class="cp1-edge-rail right"></i>
    <i class="cp1-corner tr"></i>
    <i class="cp1-corner bl"></i>
    <i class="cp1-global-pulse"></i>`;
  body.prepend(global);

  // Part 1 is intentionally home-heavy. Other pages receive only the restrained edge language.
  if (!body.classList.contains("clarity-home")) return;

  const hero = document.querySelector(".clarity-hero");
  if (hero && !hero.querySelector(".cp1-hero-art")) {
    const art = document.createElement("div");
    art.className = "cp1-hero-art";
    art.setAttribute("aria-hidden", "true");
    art.innerHTML = `
      <div class="cp1-hero-city"></div>
      <div class="cp1-grid-horizon"></div>
      <div class="cp1-horizon-beam"></div>
      <div class="cp1-hud-orbit"></div>
      <div class="cp1-scan"></div>`;
    hero.prepend(art);
  }

  // A single art interlude gives the site a visual signature without turning every section into wallpaper.
  const anchor = document.querySelector("#what-i-do");
  if (anchor && !document.querySelector(".cp1-art-break")) {
    const figure = document.createElement("figure");
    figure.className = "cp1-art-break scroll-reveal";
    figure.setAttribute("aria-label", "Cyberpunk digital systems artwork");
    figure.innerHTML = `
      <img src="/assets/cyberpunk/system-hudscape.webp" alt="" loading="lazy" decoding="async">
      <div class="cp1-art-shade" aria-hidden="true"></div>
      <div class="cp1-art-mark" aria-hidden="true"></div>
      <figcaption class="cp1-art-caption">
        <span>ART // SYSTEMS IN MOTION</span>
        <strong>BUILD WHAT<br><em>SHOULD EXIST.</em></strong>
        <p>Software, websites and systems start as an idea. I like turning that idea into something real, useful and distinct.</p>
      </figcaption>`;
    anchor.insertAdjacentElement("afterend", figure);

    // Existing reveal system has already initialized by the time this script runs, so reveal this one independently.
    if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      figure.style.opacity = "0";
      figure.style.transform = "translateY(22px)";
      figure.style.transition = "opacity .65s ease, transform .75s cubic-bezier(.2,.75,.25,1)";
      const observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          figure.style.opacity = "1";
          figure.style.transform = "translateY(0)";
          observer.disconnect();
        }
      }, { threshold: .12 });
      observer.observe(figure);
    }
  }

  // Small pointer parallax for the art only; no cursor dots and no scroll hijacking.
  if (
    !matchMedia("(prefers-reduced-motion: reduce)").matches &&
    matchMedia("(hover:hover) and (pointer:fine)").matches
  ) {
    const city = document.querySelector(".cp1-hero-city");
    hero?.addEventListener("pointermove", event => {
      if (!city) return;
      const rect = hero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      city.style.setProperty("--cp1-x", `${x * 7}px`);
      city.style.setProperty("--cp1-y", `${y * 5}px`);
      city.style.marginLeft = `${x * -6}px`;
      city.style.marginTop = `${y * -4}px`;
    }, { passive: true });
    hero?.addEventListener("pointerleave", () => {
      if (!city) return;
      city.style.marginLeft = "";
      city.style.marginTop = "";
    });
  }
})();