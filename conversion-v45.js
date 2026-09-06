(() => {
  "use strict";
  const body = document.body;
  if (!body || body.dataset.v45Ready === "1") return;
  body.dataset.v45Ready = "1";

  const path = location.pathname.replace(/\/+$/, "") || "/";

  // Add SERVICES to the current V4 navigation without replacing the established nav system.
  document.querySelectorAll("nav.v4-unified-nav").forEach(nav => {
    if (nav.querySelector('a[href="/services/"]')) return;
    const before = nav.querySelector('a[href="/website-studio/"]');
    const a = document.createElement("a");
    a.href = "/services/";
    a.textContent = "SERVICES";
    a.className = "v45-nav-services";
    if (path === "/services") a.setAttribute("aria-current", "page");
    if (before) nav.insertBefore(a, before); else nav.append(a);
  });

  const panelNav = document.querySelector(".v423-panel-nav");
  if (panelNav && !panelNav.querySelector('a[href="/services/"]')) {
    const before = panelNav.querySelector('a[href="/website-studio/"]');
    const a = document.createElement("a");
    a.href = "/services/";
    a.className = "v45-panel-services";
    a.innerHTML = `<span>04</span><div><strong>SERVICES</strong><small>Websites, software and business systems</small></div><b>→</b>`;
    if (before) panelNav.insertBefore(a, before); else panelNav.append(a);

    // Renumber following visual labels only.
    [...panelNav.querySelectorAll(":scope > a")].forEach((item, i) => {
      const n = item.querySelector(":scope > span");
      if (n) n.textContent = String(i + 1).padStart(2, "0");
    });
  }

  const footerNav = document.querySelector(".v4-unified-footer nav");
  if (footerNav && !footerNav.querySelector('a[href="/services/"]')) {
    const before = footerNav.querySelector('a[href="/website-studio/"]');
    const a = document.createElement("a");
    a.href = "/services/";
    a.textContent = "SERVICES";
    if (before) footerNav.insertBefore(a, before); else footerNav.append(a);
  }
  const footerNote = document.querySelector(".v4-footer-note");
  if (footerNote) {
    footerNote.textContent = "THIS WEBSITE WAS DESIGNED AND BUILT BY CHARLES LIOC. PROJECT INQUIRIES ARE CURRENTLY OPEN.";
  }

  // Strengthen the path from proof-heavy pages to a commercial next step.
  const shouldAddStrip =
    path === "/try" ||
    path === "/portfolio" ||
    path.startsWith("/portfolio/projects/") ||
    path === "/about";

  if (shouldAddStrip && !document.querySelector(".v45-project-strip")) {
    const strip = document.createElement("section");
    strip.className = "v45-project-strip";
    strip.setAttribute("aria-label", "Start a project with Charles Lioc");

    let headline = "NEED SOMETHING BUILT AROUND YOUR OWN GOAL?";
    let copy = "See what I can build, then contact me directly when you are ready to discuss the problem.";
    if (path === "/try") {
      headline = "THESE ARE REAL BUILDS. YOUR PROJECT CAN START WITH A CONVERSATION.";
      copy = "If you need a website, app or business system, start with the service that matches the job.";
    } else if (path.startsWith("/portfolio/projects/")) {
      headline = "HAVE A PROBLEM THAT NEEDS ITS OWN SYSTEM?";
      copy = "I build around the actual workflow instead of forcing every project into the same template.";
    }

    strip.innerHTML = `
      <div>
        <small>PROJECT INQUIRIES // OPEN</small>
        <strong>${headline}</strong>
        <p>${copy}</p>
      </div>
      <nav aria-label="Project next steps">
        <a href="/services/">VIEW SERVICES →</a>
        <a href="/contact/">CONTACT CHARLES ↗</a>
      </nav>`;
    const footer = document.querySelector(".v4-unified-footer");
    if (footer) footer.insertAdjacentElement("beforebegin", strip);
    else document.body.append(strip);
  }
})();