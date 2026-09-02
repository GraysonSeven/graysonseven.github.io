(() => {
  "use strict";

  const root = document.documentElement;
  const body = document.body;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  root.classList.add("fx-ready");

  // ---------- Atmosphere ----------
  const atmosphere = document.createElement("div");
  atmosphere.className = "fx-atmosphere";
  atmosphere.setAttribute("aria-hidden", "true");
  body.prepend(atmosphere);

  const pointerLight = document.createElement("div");
  pointerLight.className = "fx-pointer-light";
  pointerLight.setAttribute("aria-hidden", "true");
  body.append(pointerLight);

  // ---------- One short boot sequence per tab session ----------
  const bootKey = "cl-immersive-boot-v3";
  let showBoot = false;
  try {
    showBoot = !sessionStorage.getItem(bootKey) && !reduceMotion && !body.classList.contains("clarity-home") && !body.classList.contains("studio-body");
    if (showBoot) sessionStorage.setItem(bootKey, "1");
  } catch (_) {}

  if (showBoot) {
    const boot = document.createElement("div");
    boot.className = "fx-boot";
    boot.setAttribute("aria-hidden", "true");
    boot.innerHTML = `
      <div class="fx-boot-box">
        <strong>CHARLES LIOC // INITIALIZING</strong>
        <div class="fx-boot-line"><span>IDENTITY CORE</span><b>ONLINE</b></div>
        <div class="fx-boot-line"><span>PROJECT ARCHIVE</span><b>READY</b></div>
        <div class="fx-boot-line"><span>INTERACTION LAYER</span><b>ACTIVE</b></div>
        <div class="fx-boot-progress"><i></i></div>
      </div>`;
    body.append(boot);
    setTimeout(() => boot.classList.add("done"), 1120);
    setTimeout(() => boot.remove(), 1700);
  }

  // ---------- Particle network ----------
  if (!reduceMotion) {
    const canvas = document.createElement("canvas");
    canvas.className = "fx-particle-field";
    canvas.setAttribute("aria-hidden", "true");
    body.prepend(canvas);
    const ctx = canvas.getContext("2d", { alpha: true });
    let w = 0, h = 0, dpr = 1;
    let particles = [];
    let mouse = { x: -9999, y: -9999, active: false };
    let scrollSpeed = 0;
    let lastScroll = scrollY;

    const makeParticles = () => {
      const count = innerWidth < 760 ? 24 : Math.min(76, Math.max(42, Math.round(innerWidth / 22)));
      particles = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - .5) * .16,
        vy: (Math.random() - .5) * .13,
        r: i % 9 === 0 ? 1.45 : .7 + Math.random() * .45,
        pink: i % 4 === 0
      }));
    };

    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = innerWidth;
      h = innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      makeParticles();
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const maxDist = innerWidth < 760 ? 105 : 145;

      for (const p of particles) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (mouse.active && dist < 150 && dist > .01) {
          const force = (150 - dist) / 150 * .028;
          p.vx += dx / dist * force;
          p.vy += dy / dist * force;
        }
        p.vx *= .985;
        p.vy *= .985;
        p.vx += (Math.random() - .5) * .006;
        p.vy += (Math.random() - .5) * .005;
        p.x += p.vx;
        p.y += p.vy + scrollSpeed * .008;
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;
      }

      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d > maxDist) continue;
          const alpha = (1 - d / maxDist) * .095;
          ctx.strokeStyle = `rgba(${a.pink ? "255,43,214" : "0,239,255"},${alpha})`;
          ctx.lineWidth = .7;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
        ctx.fillStyle = a.pink ? "rgba(255,43,214,.36)" : "rgba(0,239,255,.34)";
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fill();
      }

      scrollSpeed *= .88;
      requestAnimationFrame(draw);
    };

    addEventListener("scroll", () => {
      const now = scrollY;
      scrollSpeed = clamp(now - lastScroll, -36, 36);
      lastScroll = now;
    }, { passive: true });
    addEventListener("resize", resize, { passive: true });
    addEventListener("pointermove", e => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    }, { passive: true });
    document.addEventListener("pointerleave", () => { mouse.active = false; });
    resize();
    draw();
  }

  // ---------- Cursor, pointer aura, hero parallax ----------
  if (finePointer && !reduceMotion) {
    const dot = document.createElement("div");
    const ring = document.createElement("div");
    dot.className = "fx-cursor-dot";
    ring.className = "fx-cursor-ring";
    dot.setAttribute("aria-hidden", "true");
    ring.setAttribute("aria-hidden", "true");
    body.append(dot, ring);

    let mx = -100, my = -100, rx = -100, ry = -100;
    let raf = null;
    const animateCursor = () => {
      rx += (mx - rx) * .16;
      ry += (my - ry) * .16;
      dot.style.transform = `translate3d(${mx}px,${my}px,0)`;
      ring.style.transform = `translate3d(${rx}px,${ry}px,0)`;
      pointerLight.style.transform = `translate3d(${mx}px,${my}px,0)`;
      raf = requestAnimationFrame(animateCursor);
    };
    animateCursor();

    addEventListener("pointermove", e => {
      mx = e.clientX;
      my = e.clientY;
      body.classList.add("fx-pointer-on");
      const px = (e.clientX / innerWidth - .5) * 2;
      const py = (e.clientY / innerHeight - .5) * 2;
      root.style.setProperty("--fx-hero-shift", `${py * -3}px`);
      root.style.setProperty("--fx-hero-visual-shift", `${py * 7}px`);
      root.style.setProperty("--fx-pointer-x", `${e.clientX}px`);
      root.style.setProperty("--fx-pointer-y", `${e.clientY}px`);
    }, { passive: true });

    document.addEventListener("pointerleave", () => body.classList.remove("fx-pointer-on"));
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && raf) cancelAnimationFrame(raf);
    });

    const hot = "a,button,[role='button'],.featured-card,.card,.project-tab,.discipline-card,.principle-card,.capability-row,.method-step";
    qsa(hot).forEach(el => {
      el.addEventListener("pointerenter", () => body.classList.add("fx-cursor-active"));
      el.addEventListener("pointerleave", () => body.classList.remove("fx-cursor-active"));
    });
  }

  // ---------- Add live clock to existing status area ----------
  const statusHost = document.querySelector(".header-node, .header-status");
  if (statusHost) {
    const clock = document.createElement("span");
    clock.className = "fx-clock";
    statusHost.append(clock);
    const tickClock = () => {
      const d = new Date();
      clock.textContent = `LOCAL ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
    };
    tickClock();
    setInterval(tickClock, 30000);
  }

  // ---------- Moving ticker after hero ----------
  const hero = document.querySelector("main > .hero, main section.hero");
  if (hero && !document.querySelector(".fx-marquee")) {
    const marquee = document.createElement("div");
    marquee.className = "fx-marquee";
    marquee.setAttribute("aria-hidden", "true");
    const sequence = `
      <span>BUILD WHAT SHOULD EXIST</span><b>◆</b>
      <span>SOFTWARE + SYSTEMS</span><b>◆</b>
      <span>ANDROID + WEB</span><b>◆</b>
      <span>WEBSITE CLIENTS OPEN</span><b>◆</b>
      <span>DESIGN YOUR SITE LIVE</span><b>◆</b>
      <span>CUSTOM WEBSITES + PORTFOLIOS</span><b>◆</b>
      <span>LOCAL-FIRST THINKING</span><b>◆</b>
      <span>REAL WORKFLOWS</span><b>◆</b>
      <span>BUILD // TEST // IMPROVE</span><b>◆</b>`;
    marquee.innerHTML = `<div class="fx-marquee-track">${sequence}${sequence}</div>`;
    hero.insertAdjacentElement("afterend", marquee);
  }

  // ---------- Reveal choreography ----------
  const revealTargets = [
    ...qsa("main > section:not(.hero)"),
    ...qsa(".featured-card,.card,.project-tab,.discipline-card,.principle-card,.capability-row,.terminal-line,.method-step,.signal-card,.capability-tile")
  ];
  revealTargets.forEach((el, i) => {
    if (el.classList.contains("scroll-reveal")) return;
    el.classList.add("fx-reveal", `fx-delay-${(i % 3) + 1}`);
  });
  qsa("h1,h2").forEach(h => h.classList.add("fx-heading"));

  if ("IntersectionObserver" in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("fx-visible");
        const heading = entry.target.matches("h1,h2") ? entry.target : entry.target.querySelector("h1,h2");
        if (heading) heading.classList.add("fx-visible");
        revealObserver.unobserve(entry.target);
      }
    }, { threshold: .08, rootMargin: "0px 0px -6% 0px" });
    revealTargets.forEach(el => revealObserver.observe(el));
    qsa("h1,h2").forEach(el => revealObserver.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add("fx-visible"));
    qsa("h1,h2").forEach(el => el.classList.add("fx-visible"));
  }

  // ---------- Card spotlight + subtle 3D tilt ----------
  const cardSelectors = [
    ".featured-card", ".shell .card", ".project-tab", ".discipline-card", ".principle-card",
    ".capability-row", ".contact-terminal", ".terminal", ".signal-card", ".capability-tile", ".client-service-card", ".client-project-cta"
  ].join(",");
  const cards = qsa(cardSelectors);
  cards.forEach(card => {
    card.dataset.fxCard = "";
    if (!card.querySelector(":scope > .fx-card-glow")) {
      const glow = document.createElement("i");
      glow.className = "fx-card-glow";
      glow.setAttribute("aria-hidden", "true");
      card.append(glow);
    }
  });

  if (finePointer && !reduceMotion) {
    cards.forEach(card => {
      card.addEventListener("pointermove", e => {
        const r = card.getBoundingClientRect();
        const x = clamp((e.clientX - r.left) / r.width, 0, 1);
        const y = clamp((e.clientY - r.top) / r.height, 0, 1);
        card.style.setProperty("--fx-card-x", `${x * 100}%`);
        card.style.setProperty("--fx-card-y", `${y * 100}%`);
        const maxTilt = card.matches(".featured-card,.shell .card,.signal-card,.capability-tile,.client-service-card") ? 2.2 : 1.2;
        const ry = (x - .5) * maxTilt * 2;
        const rx = (.5 - y) * maxTilt * 2;
        card.style.transform = `perspective(1100px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-3px)`;
      });
      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
        card.style.removeProperty("--fx-card-x");
        card.style.removeProperty("--fx-card-y");
      });
    });
  }

  // ---------- Magnetic controls ----------
  if (finePointer && !reduceMotion) {
    qsa(".primary-btn,.secondary-btn,.btn,.portfolio-bridge,.closing-link,.back-top,.fx-command-trigger,.client-availability,.fx-client-badge,.fx-try-badge").forEach(el => {
      el.addEventListener("pointermove", e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) / r.width;
        const y = (e.clientY - (r.top + r.height / 2)) / r.height;
        el.style.translate = `${x * 7}px ${y * 5}px`;
      });
      el.addEventListener("pointerleave", () => { el.style.translate = ""; });
    });
  }

  // ---------- Click pulse ----------
  if (!reduceMotion) {
    document.addEventListener("pointerdown", e => {
      if (!e.target.closest("a,button,.card,.featured-card,.project-tab,.method-step,.client-service-card")) return;
      const ripple = document.createElement("i");
      ripple.className = "fx-ripple";
      ripple.style.left = `${e.clientX}px`;
      ripple.style.top = `${e.clientY}px`;
      ripple.setAttribute("aria-hidden", "true");
      body.append(ripple);
      setTimeout(() => ripple.remove(), 650);
    }, { passive: true });
  }

  // ---------- Scroll depth targets ----------
  const scanner = document.createElement("div");
  scanner.className = "fx-scroll-scanner";
  scanner.setAttribute("aria-hidden", "true");
  body.prepend(scanner);

  const parallaxTargets = qsa(".card-visual,.mini-art,.project-stage,.discipline-art,.visual,.identity-mark-wrap");
  parallaxTargets.forEach(el => el.dataset.fxParallax = "");

  // ---------- Scroll variables ----------
  let lastY = scrollY;
  let scrollRAF = false;
  const updateScrollVars = () => {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const p = clamp(scrollY / max, 0, 1);
    const velocity = clamp(scrollY - lastY, -60, 60);
    lastY = scrollY;
    root.style.setProperty("--fx-scroll", p.toFixed(4));
    root.style.setProperty("--fx-velocity", velocity.toFixed(2));
    root.style.setProperty("--fx-hero-shift", `${clamp(scrollY * -.018, -22, 0)}px`);
    root.style.setProperty("--fx-hero-visual-shift", `${clamp(scrollY * .025, 0, 34)}px`);
    root.style.setProperty("--fx-scan-y", `${Math.round(p * innerHeight)}px`);
    if (!reduceMotion) {
      parallaxTargets.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -120 || r.top > innerHeight + 120) return;
        const center = r.top + r.height / 2;
        const normalized = (center - innerHeight / 2) / innerHeight;
        const amount = clamp(normalized * (i % 2 ? -18 : -24), -26, 26);
        el.style.setProperty("--fx-parallax-y", `${amount.toFixed(1)}px`);
      });
    }
    scrollRAF = false;
  };
  addEventListener("scroll", () => {
    if (!scrollRAF) {
      scrollRAF = true;
      requestAnimationFrame(updateScrollVars);
    }
  }, { passive: true });
  updateScrollVars();

  // ---------- Method step activation ----------
  const methodSteps = qsa("[data-method-step]");
  if (methodSteps.length && "IntersectionObserver" in window) {
    const methodObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        methodSteps.forEach(s => s.classList.toggle("is-active", s === entry.target));
      });
    }, { rootMargin: "-38% 0px -42% 0px", threshold: 0 });
    methodSteps.forEach(s => methodObserver.observe(s));
    methodSteps[0].classList.add("is-active");
  }

  // ---------- Chapter rail ----------
  const railSections = qsa("main > section[id]").filter(s => s.offsetHeight > 180);
  if (railSections.length >= 2) {
    const rail = document.createElement("nav");
    rail.className = "fx-section-rail";
    rail.setAttribute("aria-label", "Page sections");
    railSections.slice(0, 8).forEach((section, index) => {
      const btn = document.createElement("button");
      const label = (section.id || `SECTION ${index + 1}`).replace(/-/g, " ").toUpperCase();
      btn.type = "button";
      btn.dataset.label = label;
      btn.setAttribute("aria-label", `Go to ${label}`);
      btn.addEventListener("click", () => section.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" }));
      rail.append(btn);
    });
    body.append(rail);
    const railBtns = qsa("button", rail);
    if ("IntersectionObserver" in window) {
      const sectionObserver = new IntersectionObserver(entries => {
        const current = entries.filter(e => e.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!current) return;
        const idx = railSections.indexOf(current.target);
        railBtns.forEach((b,i) => b.classList.toggle("active", i === idx));
      }, { rootMargin: "-32% 0px -56% 0px", threshold: [0,.1,.35,.6] });
      railSections.forEach(s => sectionObserver.observe(s));
    }
    if (railBtns[0]) railBtns[0].classList.add("active");
  }

  // ---------- Toast ----------
  const toast = document.createElement("div");
  toast.className = "fx-toast";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  body.append(toast);
  let toastTimer = null;
  const showToast = message => {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
  };

  // ---------- Copy email control ----------
  const email = "icharles.development@gmail.com";
  const emailLink = document.querySelector(`a[href="mailto:${email}"]`);
  if (emailLink && !document.querySelector(".fx-copy-email")) {
    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "fx-copy-email";
    copy.textContent = "COPY EMAIL";
    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(email);
        showToast("EMAIL COPIED // READY TO PASTE");
      } catch (_) {
        const ta = document.createElement("textarea");
        ta.value = email;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        body.append(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        showToast("EMAIL COPIED // READY TO PASTE");
      }
    });
    const line = emailLink.closest(".line,.terminal-line") || emailLink.parentElement;
    line?.append(copy);
  }

  // ---------- Persistent primary actions ----------
  if (!document.querySelector(".fx-try-badge") && !body.classList.contains("studio-body") && !body.classList.contains("try-body")) {
    const tryBadge = document.createElement("a");
    tryBadge.className = "fx-try-badge";
    tryBadge.href = "/try/";
    tryBadge.setAttribute("aria-label", "Try interactive demos of Charles Lioc's builds");
    tryBadge.innerHTML = `<span><small>INTERACTIVE SHOWROOM</small><strong>TRY MY BUILDS</strong></span><b>↗</b>`;
    body.append(tryBadge);
  }

  // ---------- Website client availability badge ----------
  if (!document.querySelector(".fx-client-badge")) {
    const clientBadge = document.createElement("a");
    clientBadge.className = "fx-client-badge";
    clientBadge.href = "/website-studio/";
    clientBadge.setAttribute("aria-label", "Website clients open — design your website in the Website Studio");
    clientBadge.innerHTML = `<i></i><span><small>WEBSITE STUDIO</small><strong>START HERE</strong></span><b>↗</b>`;
    body.append(clientBadge);
  }

  // ---------- Command palette ----------
  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "fx-command-trigger";
  trigger.setAttribute("aria-label", "Open quick navigation");
  trigger.innerHTML = `<span>QUICK NAV</span><kbd>CTRL K</kbd>`;
  body.append(trigger);

  const palette = document.createElement("div");
  palette.className = "fx-command-palette";
  palette.setAttribute("aria-hidden", "true");
  const base = location.origin;
  const navItems = [
    ["01", "HOME", `${base}/`, "START HERE"],
    ["02", "TRY MY BUILDS", `${base}/try/`, "INTERACTIVE DEMOS // SAMPLE DATA"],
    ["03", "PORTFOLIO", `${base}/portfolio/`, "PROJECT CASE STUDIES"],
    ["04", "WEBSITE STUDIO", `${base}/website-studio/`, "DESIGN YOUR SITE // FREE TO REQUEST"],
    ["05", "PROJECTS", `${base}/projects/`, "PROJECT DIRECTORY"],
    ["06", "ABOUT", `${base}/about/`, "WHO I AM + HOW I BUILD"],
    ["07", "LAB", `${base}/lab/`, "EXPERIMENTS + WORK IN PROGRESS"],
    ["08", "CONTACT", `${base}/contact/#website-projects`, "DIRECT CONTACT + PROJECT QUESTIONS"],
  ];
  palette.innerHTML = `
    <div class="fx-command-box" role="dialog" aria-modal="true" aria-label="Quick navigation">
      <div class="fx-command-top"><span>CL://COMMAND CENTER</span><b>ONLINE</b></div>
      <div class="fx-command-list">
        ${navItems.map(([n,label,href,desc]) => `<a href="${href}"><span>${n}</span><span>${label}</span><em>${desc}</em></a>`).join("")}
        <button type="button" data-copy-email><span>09</span><span>COPY EMAIL</span><em>ICHARLES.DEVELOPMENT@GMAIL.COM</em></button>
      </div>
      <div class="fx-command-foot"><span>ENTER TO OPEN</span><span>ESC TO CLOSE</span></div>
    </div>`;
  body.append(palette);

  const openPalette = () => {
    palette.classList.add("open");
    palette.setAttribute("aria-hidden", "false");
    body.style.overflow = "hidden";
    setTimeout(() => palette.querySelector("a,button")?.focus(), 30);
  };
  const closePalette = () => {
    palette.classList.remove("open");
    palette.setAttribute("aria-hidden", "true");
    body.style.overflow = "";
    trigger.focus({ preventScroll: true });
  };
  trigger.addEventListener("click", () => palette.classList.contains("open") ? closePalette() : openPalette());
  palette.addEventListener("click", e => { if (e.target === palette) closePalette(); });
  palette.querySelector("[data-copy-email]")?.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(email); } catch (_) {}
    showToast("EMAIL COPIED // READY TO PASTE");
    closePalette();
  });
  addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      palette.classList.contains("open") ? closePalette() : openPalette();
    } else if (e.key === "Escape" && palette.classList.contains("open")) {
      closePalette();
    }
  });
})();
