(() => {
  "use strict";

  const form = document.getElementById("website-request-form");
  if (!form) return;

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const site = $("#sample-site");
  let step = 1;
  let studioMode = null; // "assist" or "customize"
  const stepOrder = () => studioMode === "assist" ? [1, 2, 4, 5] : [1, 2, 3, 4, 5];

  const state = {
    bg: "#070A10",
    primary: "#00F0FF",
    accent: "#8B5CFF",
    palette: "Cyber Cyan"
  };

  const requestId = `WEB-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  $("#request-id").value = requestId;
  $("#form-next").value = `https://icharles.pages.dev/website-request-sent/?id=${encodeURIComponent(requestId)}`;

  const selected = name => form.elements[name]?.value || "";
  const vals = name => $$(`input[name="${name}"]:checked`, form).map(x => x.value);
  const esc = value => String(value || "").replace(/[&<>\"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]));

  const stepNames = {
    1: "WHAT DO YOU NEED?",
    2: "TELL ME ABOUT IT",
    3: "CHOOSE THE DESIGN",
    4: "WHAT'S INCLUDED?",
    5: "REVIEW + SEND"
  };

  const hints = {
    1: "Click one card. You can change it later.",
    2: "Only the website name is required.",
    3: "Pick a direction, use Choose for me, or request a custom design at no extra design fee.",
    4: "A sensible starter set is already selected. Keeping it is completely fine.",
    5: "Review your details, then send the free request."
  };

  function showStep(next, doScroll = true) {
    const order = stepOrder();
    if (!order.includes(next)) next = order[0];
    step = next;
    const index = order.indexOf(step);
    const nextStep = order[index + 1];
    const backStep = order[index - 1];
    $$(".wizard-step").forEach(x => x.classList.toggle("active", Number(x.dataset.step) === step));
    $("#progress-title").textContent = `${index + 1} OF ${order.length} — ${stepNames[step]}`;
    $("#progress-fill").style.width = `${(index + 1) / order.length * 100}%`;
    $("#wizard-back").disabled = index === 0;
    $("#wizard-next").hidden = step === 5;
    $("#wizard-submit").hidden = step !== 5;
    $("#wizard-next").textContent = nextStep ? `NEXT: ${stepNames[nextStep]} →` : "NEXT →";
    $("#wizard-hint").textContent = hints[step] || "Continue when ready.";
    $("#wizard-back").dataset.targetStep = backStep || "";
    $("#wizard-next").dataset.targetStep = nextStep || "";
    if (step === 5) updateVisibleSummary();
    try { history.replaceState(null, "", `#builder-step-${step}`); } catch (_) {}
    if (doScroll) {
      document.getElementById("builder").scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start"
      });
    }
  }

  function validateCurrent() {
    if (!studioMode) return false;
    if (step === 2) {
      const name = $("#brand-name");
      if (!name.value.trim()) {
        name.focus();
        name.reportValidity();
        return false;
      }
    }
    return true;
  }

  $("#wizard-next").addEventListener("click", () => {
    if (!validateCurrent()) return;
    const target = Number($("#wizard-next").dataset.targetStep);
    if (target) showStep(target);
  });
  $("#wizard-back").addEventListener("click", () => {
    const target = Number($("#wizard-back").dataset.targetStep);
    if (target) showStep(target);
  });

  const recommendations = {
    "Business / Services": {
      pages: ["Home", "About", "Services", "Testimonials", "Contact"],
      features: ["Contact form", "Scroll animation / motion", "Basic SEO / social metadata"],
      text: "Home, About, Services, Reviews and Contact work well for a service business."
    },
    "Portfolio": {
      pages: ["Home", "About", "Portfolio / Work", "Contact"],
      features: ["Contact form", "Scroll animation / motion", "Social links", "Basic SEO / social metadata"],
      text: "Home, About, Work and Contact create a simple portfolio flow."
    },
    "Landing Page": {
      pages: ["Home", "FAQ", "Contact"],
      features: ["Contact form", "Scroll animation / motion", "Basic SEO / social metadata", "Analytics"],
      text: "A focused landing page usually needs one main page, FAQ and a clear contact/action."
    },
    "Product / Showcase": {
      pages: ["Home", "About", "Gallery", "FAQ", "Contact"],
      features: ["Contact form", "Scroll animation / motion", "Social links", "Basic SEO / social metadata", "Analytics"],
      text: "A product site benefits from a clear overview, visuals, FAQ and a direct action."
    },
    "Restaurant / Local Business": {
      pages: ["Home", "About", "Services", "Gallery", "Contact"],
      features: ["Contact form", "Map / location", "Social links", "Basic SEO / social metadata"],
      text: "Local businesses usually need clear services/menu information, photos, location and contact."
    },
    "Redesign Existing Website": {
      pages: ["Home", "About", "Services", "Contact"],
      features: ["Contact form", "Scroll animation / motion", "Basic SEO / social metadata", "Analytics"],
      text: "For a redesign, this is a safe starter structure. I will also review the existing site."
    }
  };

  function applyRecommendation() {
    const r = recommendations[selected("Website_Type")] || recommendations["Business / Services"];
    $$('input[name="Pages[]"]').forEach(x => x.checked = r.pages.includes(x.value));
    $$('input[name="Features[]"]').forEach(x => x.checked = r.features.includes(x.value));
    $("#recommendation-text").textContent = r.text;
    updatePreview();
  }

  $$('input[name="Website_Type"]').forEach(x => x.addEventListener("change", applyRecommendation));
  $$("[data-choose]").forEach(b => b.addEventListener("click", () => {
    const x = $(`input[name="Website_Type"][value="${b.dataset.choose}"]`);
    if (x) {
      x.checked = true;
      applyRecommendation();
    }
  }));

  function designModeChanged() {
    const custom = selected("Design_Mode") === "Custom design by Charles";
    $("#custom-design-note").hidden = !custom;
    site.classList.toggle("custom-design-mode", custom);
    updatePreview();
  }
  $$('input[name="Design_Mode"]').forEach(x => x.addEventListener("change", designModeChanged));

  function summaryText() {
    const customRequest = $("#custom-design-request")?.value.trim();
    return [
      `Request ${requestId}`,
      `Type: ${selected("Website_Type")}`,
      `Studio mode: ${studioMode === "assist" ? "Design it for me" : "Customize the design"}`,
      `Design mode: ${selected("Design_Mode")}`,
      `Theme: ${selected("Theme")}`,
      `Layout: ${selected("Layout_Style")}`,
      `Palette: ${state.palette}`,
      `Font: ${selected("Font_Style")}`,
      `Text: ${selected("Text_Size")}`,
      `Motion: ${selected("Motion_Level")}`,
      `Corners: ${selected("Corner_Style")}`,
      customRequest ? `Custom design notes: ${customRequest}` : "",
      `Pages: ${vals("Pages[]").join(", ") || "Not selected"}`,
      `Features: ${vals("Features[]").join(", ") || "Not selected"}`
    ].filter(Boolean).join(" | ");
  }

  function updateVisibleSummary() {
    const type = selected("Website_Type").replace(" / Services", "");
    const custom = selected("Design_Mode") === "Custom design by Charles";
    $("#request-summary-visible").querySelector("strong").textContent =
      `${type.toUpperCase()} · ${studioMode === "assist" ? "DESIGN BY CHARLES" : (custom ? "CUSTOM DESIGN" : selected("Theme").toUpperCase())} · ${selected("Layout_Style").toUpperCase()}`;
    const pages = vals("Pages[]");
    const features = vals("Features[]");
    $("#request-summary-visible").querySelector("p").textContent =
      `${pages.join(", ") || "No pages selected"} · ${features.join(", ") || "No extra features selected"}`;
  }

  function updateSummary() {
    $("#design-summary").value = summaryText();
    updateVisibleSummary();
  }

  function updatePreview() {
    const brand = $("#brand-name").value.trim() || "YOUR BRAND";
    const industry = $("#industry").value.trim() || "YOUR BUSINESS // ONLINE";
    const tagline = $("#tagline").value.trim() || "Your message becomes clear, memorable and easy to act on.";
    const goal = $("#goal").value;
    const type = selected("Website_Type");
    const theme = $("input[name='Theme']:checked");
    const layout = $("input[name='Layout_Style']:checked");
    const font = $("input[name='Font_Style']:checked");
    const size = $("input[name='Text_Size']:checked");
    const radius = $("input[name='Corner_Style']:checked");
    const motion = $("input[name='Motion_Level']:checked");
    const custom = selected("Design_Mode") === "Custom design by Charles";

    site.dataset.theme = theme?.dataset.theme || "future";
    site.dataset.layout = layout?.dataset.layout || "split";
    site.dataset.font = font?.dataset.font || "modern";
    site.dataset.size = size?.dataset.size || "balanced";
    site.dataset.radius = radius?.dataset.radius || "sharp";
    site.dataset.motion = motion?.dataset.motion || "dynamic";
    site.classList.toggle("custom-design-mode", custom);
    site.style.setProperty("--site-bg", state.bg);
    site.style.setProperty("--site-primary", state.primary);
    site.style.setProperty("--site-accent", state.accent);

    if (["light", "minimal"].includes(site.dataset.theme) && state.bg.toLowerCase() === "#070a10") {
      site.style.setProperty("--site-bg", "#f4f4f2");
    }

    $("#preview-brand").textContent = brand.toUpperCase();
    $("#sample-mark").textContent = brand.charAt(0).toUpperCase() || "Y";
    $("#preview-industry").textContent = custom ? "CUSTOM DESIGN DIRECTION // INCLUDED" : industry.toUpperCase();
    $("#preview-tagline").textContent = custom
      ? ($("#custom-design-request")?.value.trim() || "Tell me the feeling, references or direction you want. I will design it around your project.")
      : tagline;

    const headline = {
      "Business / Services": "MAKE YOUR BUSINESS EASY TO UNDERSTAND.",
      "Portfolio": "PUT YOUR BEST WORK IN FRONT OF PEOPLE.",
      "Landing Page": "ONE OFFER. ONE CLEAR NEXT STEP.",
      "Product / Showcase": "GIVE YOUR PRODUCT A HOME WORTH VISITING.",
      "Restaurant / Local Business": "HELP LOCAL CUSTOMERS FIND AND CHOOSE YOU.",
      "Redesign Existing Website": "MAKE THE WEBSITE FEEL CURRENT AGAIN."
    }[type] || "A WEBSITE THAT FEELS LIKE YOUR BRAND.";

    const customHeadline = "A CUSTOM DESIGN BUILT AROUND YOUR IDEA.";
    const words = (custom ? customHeadline : headline).split(" ");
    const cut = Math.max(2, Math.floor(words.length * .52));
    $("#preview-title").innerHTML =
      `${esc(words.slice(0, cut).join(" "))}<br><em>${esc(words.slice(cut).join(" "))}</em>`;

    $("#preview-cta").textContent = {
      "Contact / inquire": "GET IN TOUCH",
      "Book an appointment": "BOOK NOW",
      "View my work": "VIEW WORK",
      "Learn about my business": "LEARN MORE",
      "Visit my location": "FIND US",
      "Buy / ask about a product": "VIEW PRODUCT",
      "Something else": "START HERE"
    }[goal] || "GET IN TOUCH";

    $("#read-theme").textContent = custom ? "CUSTOM DESIGN" : selected("Theme").replace(" Dark", "").toUpperCase();
    $("#read-layout").textContent = selected("Layout_Style").toUpperCase();
    $("#read-palette").textContent = state.palette.toUpperCase();
    $("#read-type").textContent = type.replace(" / Services", "").toUpperCase();

    $("#primary-color-hidden").value = state.primary;
    $("#accent-color-hidden").value = state.accent;
    $("#background-color-hidden").value = state.bg;
    $("#palette-name").value = state.palette;

    $$(".palette-option").forEach(btn => {
      const label = btn.querySelector("b");
      if (label) label.textContent = btn.classList.contains("active") ? "SELECTED ✓" : "SELECT";
    });

    updateSummary();
    saveDraft();
  }

  $$(".palette-option").forEach(btn => btn.addEventListener("click", () => {
    $$(".palette-option").forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    state.palette = btn.dataset.name;
    state.bg = btn.dataset.bg;
    state.primary = btn.dataset.primary;
    state.accent = btn.dataset.accent;
    $("#color-bg").value = state.bg;
    $("#color-primary").value = state.primary;
    $("#color-accent").value = state.accent;
    updatePreview();
  }));

  [["#color-bg", "bg"], ["#color-primary", "primary"], ["#color-accent", "accent"]].forEach(([id, key]) => {
    $(id).addEventListener("input", e => {
      state[key] = e.target.value;
      state.palette = "Custom";
      $$(".palette-option").forEach(x => x.classList.remove("active"));
      updatePreview();
    });
  });

  form.addEventListener("input", updatePreview);
  form.addEventListener("change", updatePreview);

  $$("[data-view]").forEach(btn => btn.addEventListener("click", () => {
    $$("[data-view]").forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    site.classList.toggle("mobile", btn.dataset.view === "mobile");
  }));

  $("#choose-for-me").addEventListener("click", () => {
    const type = selected("Website_Type");
    const choice = {
      "Business / Services": ["Clean Light", "Ocean", "Split Hero"],
      "Portfolio": ["Premium Dark", "Midnight Gold", "Showcase Cards"],
      "Landing Page": ["Bold Creative", "Rose", "Centered Hero"],
      "Product / Showcase": ["Futuristic Dark", "Cyber Cyan", "Split Hero"],
      "Restaurant / Local Business": ["Elegant", "Midnight Gold", "Editorial"],
      "Redesign Existing Website": ["Clean Light", "Ocean", "Split Hero"]
    }[type] || ["Clean Light", "Ocean", "Split Hero"];

    const themeRadio = $(`input[name="Theme"][value="${choice[0]}"]`);
    const layoutRadio = $(`input[name="Layout_Style"][value="${choice[2]}"]`);
    const paletteButton = $(`.palette-option[data-name="${choice[1]}"]`);
    const normalMode = $('input[name="Design_Mode"][value="Use selected design direction"]');
    if (normalMode) normalMode.checked = true;
    if (themeRadio) themeRadio.checked = true;
    if (layoutRadio) layoutRadio.checked = true;
    designModeChanged();
    if (paletteButton) paletteButton.click();
    else updatePreview();
  });

  function bodyMode(selectedMode) {
    document.body.classList.toggle("studio-v4-mode-selected", Boolean(selectedMode));
    document.body.classList.toggle("studio-assist-mode", selectedMode === "assist");
    $("#studio-mode-hidden").value = selectedMode === "assist" ? "Design it for me (recommended)" : selectedMode === "customize" ? "Customize the design" : "";
    $("#studio-mode-label").textContent = selectedMode === "assist" ? "DESIGN IT FOR ME" : selectedMode === "customize" ? "CUSTOMIZE IT" : "NOT CHOSEN";
  }

  function setStudioMode(mode, doScroll = true) {
    studioMode = mode;
    bodyMode(mode);
    if (mode === "assist") {
      const customRadio = $('input[name="Design_Mode"][value="Custom design by Charles"]');
      if (customRadio) customRadio.checked = true;
    } else {
      const normalRadio = $('input[name="Design_Mode"][value="Use selected design direction"]');
      if (normalRadio) normalRadio.checked = true;
    }
    designModeChanged();
    applyRecommendation();
    showStep(1, doScroll);
  }

  $$("[data-studio-mode]").forEach(button => button.addEventListener("click", () => {
    setStudioMode(button.dataset.studioMode, true);
  }));

  $("#change-studio-mode")?.addEventListener("click", () => {
    studioMode = null;
    bodyMode(false);
    document.getElementById("start-mode")?.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start"
    });
  });

  function snapshot() {
    return {
      studioMode,
      brand: $("#brand-name").value,
      industry: $("#industry").value,
      tagline: $("#tagline").value,
      goal: $("#goal").value,
      type: selected("Website_Type"),
      designMode: selected("Design_Mode"),
      customDesign: $("#custom-design-request")?.value || "",
      theme: selected("Theme"),
      themeData: $("input[name='Theme']:checked")?.dataset.theme,
      layout: selected("Layout_Style"),
      layoutData: $("input[name='Layout_Style']:checked")?.dataset.layout,
      font: selected("Font_Style"),
      fontData: $("input[name='Font_Style']:checked")?.dataset.font,
      size: selected("Text_Size"),
      sizeData: $("input[name='Text_Size']:checked")?.dataset.size,
      radius: selected("Corner_Style"),
      radiusData: $("input[name='Corner_Style']:checked")?.dataset.radius,
      motion: selected("Motion_Level"),
      motionData: $("input[name='Motion_Level']:checked")?.dataset.motion,
      palette: state.palette,
      bg: state.bg,
      primary: state.primary,
      accent: state.accent
    };
  }

  function saveDraft() {
    try {
      localStorage.setItem("icharles-website-studio-draft-v3", JSON.stringify(snapshot()));
    } catch (_) {}
  }

  $("#open-preview").addEventListener("click", () => {
    const s = snapshot();
    const brand = esc(s.brand || "YOUR BRAND");
    const industry = esc(s.industry || "YOUR BUSINESS");
    const custom = s.designMode === "Custom design by Charles";
    const tagline = esc(custom ? (s.customDesign || "A custom visual direction built around your project.") : (s.tagline || "Your message becomes clear, memorable and easy to act on."));
    const light = ["light", "minimal"].includes(s.themeData);
    const center = s.layoutData === "center";
    const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${brand} — Concept</title><style>
      *{box-sizing:border-box}body{margin:0;background:${s.bg};color:${light ? "#15191f" : "#eef7ff"};font-family:${s.fontData==="serif"?"Georgia,serif":s.fontData==="mono"?"ui-monospace,Consolas,monospace":s.fontData==="friendly"?"Trebuchet MS,Arial,sans-serif":"Arial,sans-serif"}}
      header{height:78px;padding:0 6vw;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid ${s.primary}33}header b{letter-spacing:.08em}nav{display:flex;gap:24px;color:#7f8c9e;font-size:12px}
      .hero{min-height:calc(100vh - 78px);padding:12vh 8vw;position:relative;overflow:hidden;${center?"text-align:center;display:grid;place-items:center;align-content:center":""}}
      .hero:after{content:"";position:absolute;width:45vw;height:45vw;border:1px solid ${s.primary}55;border-radius:${s.layoutData==="editorial"?"3%":"50%"};right:${center?"27vw":"-12vw"};top:2vh;box-shadow:0 0 130px ${s.primary}18}
      .eyebrow{position:relative;z-index:2;color:${s.primary};font-size:11px;letter-spacing:.13em}.hero h1{position:relative;z-index:2;max-width:${center?"1100px":"1000px"};font-size:clamp(58px,9vw,140px);line-height:.86;letter-spacing:-.06em;margin:25px ${center?"auto":"0"}}.hero h1 span{color:${s.primary}}
      .hero p{position:relative;z-index:2;max-width:650px;color:#8997aa;font-size:20px;line-height:1.6;${center?"margin-left:auto;margin-right:auto":""}}.hero button{position:relative;z-index:2;margin-top:24px;padding:16px 20px;border:0;background:${s.primary};color:${s.bg};font-weight:900}
      small{position:fixed;right:18px;bottom:15px;color:#66758b;font:10px ui-monospace;letter-spacing:.08em}@media(max-width:700px){nav{display:none}.hero{padding:10vh 7vw}.hero h1{font-size:17vw}}
    </style></head><body><header><b>${brand}</b><nav><span>ABOUT</span><span>SERVICES</span><span>CONTACT</span></nav></header><section class="hero"><div class="eyebrow">${custom ? "CUSTOM DESIGN // NO EXTRA DESIGN FEE" : industry.toUpperCase()+" // WEBSITE CONCEPT"}</div><h1>${brand}<br><span>${custom ? "YOUR WAY." : "ONLINE."}</span></h1><p>${tagline}</p><button>START HERE →</button></section><small>CONCEPT PREVIEW BY CHARLES LIOC · NOT FINAL WEBSITE</small></body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    const win = window.open(url, "_blank", "noopener");
    if (!win) location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  });

  $("#reset-studio").addEventListener("click", () => {
    if (!confirm("Reset your Website Studio choices?")) return;
    form.reset();
    state.bg = "#070A10";
    state.primary = "#00F0FF";
    state.accent = "#8B5CFF";
    state.palette = "Cyber Cyan";
    $$(".palette-option").forEach((x, i) => x.classList.toggle("active", i === 0));
    $("#color-bg").value = state.bg;
    $("#color-primary").value = state.primary;
    $("#color-accent").value = state.accent;
    $("#custom-design-note").hidden = true;
    studioMode = null;
    bodyMode(false);
    applyRecommendation();
    showStep(1, false);
    document.getElementById("start-mode")?.scrollIntoView({ behavior: "smooth", block: "start" });
    try { localStorage.removeItem("icharles-website-studio-draft-v3"); } catch (_) {}
  });

  form.addEventListener("submit", e => {
    if (!studioMode) {
      e.preventDefault();
      document.getElementById("start-mode")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    updateSummary();
    if (!form.checkValidity()) {
      e.preventDefault();
      form.reportValidity();
      return;
    }
    const submit = $("#wizard-submit");
    submit.disabled = true;
    submit.querySelector("span").textContent = "SENDING REQUEST...";
    try { localStorage.removeItem("icharles-website-studio-draft-v3"); } catch (_) {}
  });

  applyRecommendation();
  designModeChanged();
  updatePreview();
  bodyMode(false);
  showStep(1, false);
})();