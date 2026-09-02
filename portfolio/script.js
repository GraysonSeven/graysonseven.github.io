(() => {
  const root = document.documentElement;
  const canvas = document.getElementById("cyber-grid");
  const ctx = canvas.getContext("2d");
  const logoStage = document.getElementById("logo-stage");
  const navToggle = document.querySelector(".nav-toggle");
  const siteNav = document.querySelector(".site-nav");
  const navLinks = siteNav.querySelectorAll("a");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.getElementById("year").textContent = new Date().getFullYear();

  // Mobile navigation
  const closeMenu = () => {
    siteNav.classList.remove("open");
    document.body.classList.remove("menu-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");
  };

  navToggle.addEventListener("click", () => {
    const open = !siteNav.classList.contains("open");
    siteNav.classList.toggle("open", open);
    document.body.classList.toggle("menu-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });

  navLinks.forEach(link => link.addEventListener("click", closeMenu));

  // Mouse-reactive hero emblem — subtle, never essential.
  if (!reduceMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    window.addEventListener("pointermove", (event) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 2;
      const y = (event.clientY / window.innerHeight - 0.5) * 2;
      logoStage.style.transform =
        `rotateY(${x * 4.5}deg) rotateX(${y * -3.2}deg) translate3d(${x * 4}px, ${y * 3}px, 0)`;
    });

    document.addEventListener("mouseleave", () => {
      logoStage.style.transform = "";
    });
  }

  // Animated perspective cyber grid.
  let width = 0;
  let height = 0;
  let dpr = 1;
  let raf = null;
  let time = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawGrid() {
    ctx.clearRect(0, 0, width, height);

    const horizon = height * 0.57;
    const vanishX = width * 0.72;

    // vertical perspective rays
    ctx.lineWidth = 1;
    for (let i = -10; i <= 10; i++) {
      const bottomX = vanishX + i * Math.max(80, width * 0.075);
      const gradient = ctx.createLinearGradient(vanishX, horizon, bottomX, height);
      gradient.addColorStop(0, "rgba(0,239,255,0)");
      gradient.addColorStop(0.4, i % 2 === 0 ? "rgba(0,239,255,0.065)" : "rgba(255,43,214,0.045)");
      gradient.addColorStop(1, "rgba(71,105,167,0.075)");
      ctx.strokeStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(vanishX, horizon);
      ctx.lineTo(bottomX, height);
      ctx.stroke();
    }

    // horizontal perspective rows
    const rows = 16;
    for (let i = 0; i < rows; i++) {
      const p = i / rows;
      const eased = p * p;
      const y = horizon + eased * (height - horizon);
      const alpha = 0.025 + p * 0.045;
      ctx.strokeStyle = `rgba(64, 169, 255, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // drifting data particles
    for (let i = 0; i < 34; i++) {
      const px = ((i * 179 + time * (i % 3 + 1) * 0.018) % (width + 200)) - 100;
      const py = (i * 97) % Math.max(1, height);
      const r = i % 5 === 0 ? 1.7 : 0.8;
      ctx.fillStyle = i % 3 === 0
        ? "rgba(255,43,214,0.25)"
        : "rgba(0,239,255,0.22)";
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function tick() {
    time += 1;
    drawGrid();
    raf = requestAnimationFrame(tick);
  }

  resize();
  drawGrid();

  if (!reduceMotion) {
    tick();
  }

  window.addEventListener("resize", resize, { passive: true });

  // Pause background work when tab is hidden.
  document.addEventListener("visibilitychange", () => {
    if (reduceMotion) return;
    if (document.hidden) {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    } else if (!raf) {
      tick();
    }
  });

  // Part 2 — interactive featured-project showcase.
  const showcase = document.querySelector("[data-project-showcase]");
  if (showcase) {
    const tabs = [...showcase.querySelectorAll(".project-tab")];
    const previews = [...showcase.querySelectorAll(".project-ui")];
    const title = document.getElementById("project-title");
    const kicker = document.getElementById("project-kicker");
    const description = document.getElementById("project-description");
    const tags = document.getElementById("project-tags");
    const open = document.getElementById("project-open");
    const stageLabel = document.getElementById("stage-label");

    const activateProject = (tab) => {
      const key = tab.dataset.project;

      tabs.forEach((item) => {
        const active = item === tab;
        item.classList.toggle("active", active);
        item.setAttribute("aria-selected", String(active));
      });

      previews.forEach((preview) => {
        preview.classList.toggle("active", preview.dataset.preview === key);
      });

      title.textContent = tab.dataset.title;
      kicker.textContent = tab.dataset.kicker;
      description.textContent = tab.dataset.description;
      open.href = tab.dataset.link;
      stageLabel.textContent = `PROJECT // ${tab.dataset.number}`;

      tags.replaceChildren(
        ...tab.dataset.tags.split("|").map((tag) => {
          const el = document.createElement("span");
          el.textContent = tag;
          return el;
        })
      );
    };

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => activateProject(tab));
      tab.addEventListener("keydown", (event) => {
        const index = tabs.indexOf(tab);
        let next = null;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          next = tabs[(index + 1) % tabs.length];
        }
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          next = tabs[(index - 1 + tabs.length) % tabs.length];
        }
        if (next) {
          event.preventDefault();
          next.focus();
          activateProject(next);
        }
      });
    });
  }


  // Part 3 — discipline console.
  const disciplineConsole = document.querySelector("[data-discipline-console]");
  if (disciplineConsole) {
    const disciplineTabs = [...disciplineConsole.querySelectorAll(".discipline-tab")];
    const disciplinePanels = [...disciplineConsole.querySelectorAll(".discipline-panel")];

    const activateDiscipline = (tab) => {
      const key = tab.dataset.discipline;

      disciplineTabs.forEach((item) => {
        const active = item === tab;
        item.classList.toggle("active", active);
        item.setAttribute("aria-selected", String(active));
        const state = item.querySelector(".discipline-state");
        if (state) state.textContent = active ? "ACTIVE" : "OPEN";
      });

      disciplinePanels.forEach((panel) => {
        panel.classList.toggle("active", panel.dataset.disciplinePanel === key);
      });
    };

    disciplineTabs.forEach((tab) => {
      tab.addEventListener("click", () => activateDiscipline(tab));
      tab.addEventListener("keydown", (event) => {
        const index = disciplineTabs.indexOf(tab);
        let next = null;

        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          next = disciplineTabs[(index + 1) % disciplineTabs.length];
        }
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          next = disciplineTabs[(index - 1 + disciplineTabs.length) % disciplineTabs.length];
        }

        if (next) {
          event.preventDefault();
          next.focus();
          activateDiscipline(next);
        }
      });
    });
  }


  // Part 4 — process track scroll activation.
  const processSteps = [...document.querySelectorAll("[data-process-step]")];
  if (processSteps.length) {
    if ("IntersectionObserver" in window && !reduceMotion) {
      const processObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active-process");
          }
        });
      }, { threshold: 0.55 });

      processSteps.forEach((step) => processObserver.observe(step));
    } else {
      processSteps.forEach((step) => step.classList.add("active-process"));
    }
  }


  // Part 5 — production polish.

  // Scroll progress + sticky-header state.
  const progressBar = document.getElementById("scroll-progress-bar");
  const header = document.querySelector(".site-header");

  const updateScrollUI = () => {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = Math.max(0, Math.min(1, window.scrollY / max));

    if (progressBar) {
      progressBar.style.width = `${progress * 100}%`;
    }

    if (header) {
      header.classList.toggle("scrolled", window.scrollY > 18);
    }
  };

  updateScrollUI();
  window.addEventListener("scroll", updateScrollUI, { passive: true });
  window.addEventListener("resize", updateScrollUI, { passive: true });

  // Scroll-reveal choreography.
  const revealItems = [...document.querySelectorAll(".scroll-reveal")];
  if (revealItems.length) {
    if ("IntersectionObserver" in window && !reduceMotion) {
      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            revealObserver.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.12,
        rootMargin: "0px 0px -7% 0px"
      });

      revealItems.forEach((item) => revealObserver.observe(item));
    } else {
      revealItems.forEach((item) => item.classList.add("in-view"));
    }
  }

  // Active navigation based on the section closest to the reading position.
  const navSections = [...document.querySelectorAll("[data-nav-section]")];
  const headerNavLinks = [...document.querySelectorAll(".site-nav a[href^='#']")];

  const setActiveNav = (sectionId) => {
    headerNavLinks.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `#${sectionId}`);
    });
  };

  if ("IntersectionObserver" in window && navSections.length) {
    const sectionObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (visible[0]) {
        setActiveNav(visible[0].target.id);
      }
    }, {
      rootMargin: "-20% 0px -62% 0px",
      threshold: [0, .05, .15, .3, .5]
    });

    navSections.forEach((section) => sectionObserver.observe(section));
  }

  // Transition only real internal HTML-page navigations.
  const pageTransition = document.querySelector(".page-transition");
  const transitionLinks = [...document.querySelectorAll("a[href]")].filter((link) => {
    const href = link.getAttribute("href");
    if (!href) return false;
    if (href.startsWith("#")) return false;
    if (href.startsWith("mailto:") || href.startsWith("tel:")) return false;
    if (link.target === "_blank") return false;
    return href.endsWith(".html") || href.includes(".html#");
  });

  if (pageTransition && !reduceMotion) {
    transitionLinks.forEach((link) => {
      link.addEventListener("click", (event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

        const destination = link.href;
        if (!destination) return;

        event.preventDefault();
        pageTransition.classList.add("transitioning");

        window.setTimeout(() => {
          window.location.href = destination;
        }, 360);
      });
    });
  }

})();
