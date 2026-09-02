(() => {
  "use strict";
  const form = document.getElementById("website-request-form");
  if (!form) return;
  const site = document.getElementById("sample-site");
  const $ = (s, c=document) => c.querySelector(s);
  const $$ = (s, c=document) => [...c.querySelectorAll(s)];
  const state = { bg:"#070A10", primary:"#00F0FF", accent:"#8B5CFF", palette:"Cyber Cyan" };

  const requestId = `WEB-${new Date().toISOString().slice(0,10).replaceAll("-","")}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
  $("#request-id").value = requestId;
  $("#form-next").value = `https://icharles.pages.dev/website-request-sent/?id=${encodeURIComponent(requestId)}`;

  const selected = name => form.elements[name]?.value || "";
  const selectedValues = name => $$(`input[name="${name}"]:checked`, form).map(x => x.value);
  const esc = s => String(s || "").replace(/[&<>\"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));

  function updateSummary(){
    const summary = [
      `Request ${requestId}`,
      `Type: ${selected("Website_Type")}`,
      `Theme: ${selected("Theme")}`,
      `Palette: ${$("#palette-name").value}`,
      `Font: ${selected("Font_Style")}`,
      `Text: ${selected("Text_Size")}`,
      `Motion: ${selected("Motion_Level")}`,
      `Corners: ${selected("Corner_Style")}`,
      `Pages: ${selectedValues("Pages[]").join(", ") || "Not selected"}`,
      `Features: ${selectedValues("Features[]").join(", ") || "Not selected"}`
    ].join(" | ");
    $("#design-summary").value = summary;
  }

  function updatePreview(){
    const brand = $("#brand-name").value.trim() || "YOUR BRAND";
    const industry = $("#industry").value.trim() || "YOUR BUSINESS // ONLINE";
    const tagline = $("#tagline").value.trim() || "Your message becomes clear, memorable and easy to act on.";
    const goal = $("#goal").value;
    const themeRadio = $("input[name='Theme']:checked");
    const fontRadio = $("input[name='Font_Style']:checked");
    const sizeRadio = $("input[name='Text_Size']:checked");
    const radiusRadio = $("input[name='Corner_Style']:checked");
    const motionRadio = $("input[name='Motion_Level']:checked");
    const type = selected("Website_Type");

    site.dataset.theme = themeRadio?.dataset.theme || "future";
    site.dataset.font = fontRadio?.dataset.font || "modern";
    site.dataset.size = sizeRadio?.dataset.size || "balanced";
    site.dataset.radius = radiusRadio?.dataset.radius || "sharp";
    site.dataset.motion = motionRadio?.dataset.motion || "dynamic";
    site.style.setProperty("--site-bg", state.bg);
    site.style.setProperty("--site-primary", state.primary);
    site.style.setProperty("--site-accent", state.accent);
    if (["light","minimal"].includes(site.dataset.theme)) {
      if (state.bg.toLowerCase() === "#070a10") site.style.setProperty("--site-bg", "#f4f4f2");
    }

    $("#preview-brand").textContent = brand.toUpperCase();
    $("#sample-mark").textContent = brand.charAt(0).toUpperCase() || "Y";
    $("#preview-industry").textContent = industry.toUpperCase();
    $("#preview-tagline").textContent = tagline;
    const headline = {
      "Business / Services":"MAKE YOUR BUSINESS EASY TO UNDERSTAND.",
      "Portfolio":"PUT YOUR BEST WORK IN FRONT OF PEOPLE.",
      "Landing Page":"ONE OFFER. ONE CLEAR NEXT STEP.",
      "Product / Showcase":"GIVE YOUR PRODUCT A HOME WORTH VISITING.",
      "Restaurant / Local Business":"HELP LOCAL CUSTOMERS FIND AND CHOOSE YOU.",
      "Redesign Existing Website":"MAKE THE WEBSITE FEEL CURRENT AGAIN."
    }[type] || "A WEBSITE THAT FEELS LIKE YOUR BRAND.";
    const words = headline.split(" ");
    const cut = Math.max(2, Math.floor(words.length*.52));
    $("#preview-title").innerHTML = `${esc(words.slice(0,cut).join(" "))}<br><em>${esc(words.slice(cut).join(" "))}</em>`;
    const cta = {"Contact / inquire":"GET IN TOUCH","Book an appointment":"BOOK NOW","View my work":"VIEW WORK","Learn about my business":"LEARN MORE","Visit my location":"FIND US","Buy / ask about a product":"VIEW PRODUCT","Something else":"START HERE"}[goal] || "GET IN TOUCH";
    $("#preview-cta").textContent = cta;
    $("#read-theme").textContent = selected("Theme").toUpperCase();
    $("#read-palette").textContent = state.palette.toUpperCase();
    $("#read-type").textContent = type.toUpperCase();
    $("#primary-color-hidden").value = state.primary;
    $("#accent-color-hidden").value = state.accent;
    $("#background-color-hidden").value = state.bg;
    updateSummary();
    saveDraft();
  }

  $$(".palette-option").forEach(btn => btn.addEventListener("click", () => {
    $$(".palette-option").forEach(x => x.classList.remove("active")); btn.classList.add("active");
    state.palette = btn.dataset.name; state.bg = btn.dataset.bg; state.primary = btn.dataset.primary; state.accent = btn.dataset.accent;
    $("#palette-name").value = state.palette;
    $("#color-bg").value = state.bg; $("#color-primary").value = state.primary; $("#color-accent").value = state.accent;
    updatePreview();
  }));

  [["#color-bg","bg"],["#color-primary","primary"],["#color-accent","accent"]].forEach(([id,key]) => $(id).addEventListener("input", e => {
    state[key] = e.target.value; state.palette = "Custom"; $("#palette-name").value = "Custom"; $$(".palette-option").forEach(x => x.classList.remove("active")); updatePreview();
  }));

  form.addEventListener("input", updatePreview); form.addEventListener("change", updatePreview);
  $$("[data-view]").forEach(btn => btn.addEventListener("click", () => { $$("[data-view]").forEach(x=>x.classList.remove("active")); btn.classList.add("active"); site.classList.toggle("mobile",btn.dataset.view==="mobile"); }));

  function snapshot(){ return { brand:$("#brand-name").value,industry:$("#industry").value,tagline:$("#tagline").value,goal:$("#goal").value,type:selected("Website_Type"),theme:selected("Theme"),themeData:$("input[name='Theme']:checked")?.dataset.theme,font:selected("Font_Style"),fontData:$("input[name='Font_Style']:checked")?.dataset.font,size:selected("Text_Size"),sizeData:$("input[name='Text_Size']:checked")?.dataset.size,radius:selected("Corner_Style"),radiusData:$("input[name='Corner_Style']:checked")?.dataset.radius,motion:selected("Motion_Level"),motionData:$("input[name='Motion_Level']:checked")?.dataset.motion,palette:state.palette,bg:state.bg,primary:state.primary,accent:state.accent}; }
  function saveDraft(){ try{localStorage.setItem("icharles-website-studio-draft",JSON.stringify(snapshot()));}catch(_){} }

  $("#open-preview").addEventListener("click", () => {
    const s=snapshot(), brand=esc(s.brand||"YOUR BRAND"), industry=esc(s.industry||"YOUR BUSINESS"), tagline=esc(s.tagline||"Your message becomes clear, memorable and easy to act on.");
    const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${brand} — Concept</title><style>*{box-sizing:border-box}body{margin:0;background:${s.bg};color:${["light","minimal"].includes(s.themeData)?"#15191f":"#eef7ff"};font-family:${s.fontData==="serif"?"Georgia,serif":s.fontData==="mono"?"ui-monospace,Consolas,monospace":s.fontData==="friendly"?"Trebuchet MS,Arial,sans-serif":"Arial,sans-serif"}}header{height:78px;padding:0 6vw;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid ${s.primary}33}header b{letter-spacing:.08em}nav{display:flex;gap:24px;color:#7f8c9e;font-size:12px}.hero{min-height:calc(100vh - 78px);padding:12vh 8vw;position:relative;overflow:hidden}.hero:after{content:"";position:absolute;width:45vw;height:45vw;border:1px solid ${s.primary}55;border-radius:50%;right:-12vw;top:2vh;box-shadow:0 0 130px ${s.primary}18}.eyebrow{color:${s.primary};font-size:11px;letter-spacing:.13em}.hero h1{position:relative;z-index:2;max-width:1000px;font-size:clamp(58px,9vw,140px);line-height:.86;letter-spacing:-.06em;margin:25px 0}.hero h1 span{color:${s.primary}}.hero p{position:relative;z-index:2;max-width:650px;color:#8997aa;font-size:20px;line-height:1.6}.hero button{position:relative;z-index:2;margin-top:24px;padding:16px 20px;border:0;background:${s.primary};color:${s.bg};font-weight:900}small{position:fixed;right:18px;bottom:15px;color:#66758b;font:10px ui-monospace;letter-spacing:.08em}@media(max-width:700px){nav{display:none}.hero{padding:10vh 7vw}.hero h1{font-size:17vw}}</style></head><body><header><b>${brand}</b><nav><span>ABOUT</span><span>SERVICES</span><span>CONTACT</span></nav></header><section class="hero"><div class="eyebrow">${industry.toUpperCase()} // WEBSITE CONCEPT</div><h1>${brand}<br><span>ONLINE.</span></h1><p>${tagline}</p><button>START HERE →</button></section><small>CONCEPT PREVIEW BY CHARLES LIOC · NOT FINAL WEBSITE</small></body></html>`;
    const url=URL.createObjectURL(new Blob([html],{type:"text/html"})); const win=window.open(url,"_blank","noopener"); if(!win) location.href=url; setTimeout(()=>URL.revokeObjectURL(url),60000);
  });

  $("#reset-studio").addEventListener("click", () => { if (!confirm("Reset your Website Studio choices?")) return; form.reset(); state.bg="#070A10";state.primary="#00F0FF";state.accent="#8B5CFF";state.palette="Cyber Cyan";$("#palette-name").value=state.palette;$$('.palette-option').forEach((x,i)=>x.classList.toggle('active',i===0));$("#color-bg").value=state.bg;$("#color-primary").value=state.primary;$("#color-accent").value=state.accent;try{localStorage.removeItem("icharles-website-studio-draft")}catch(_){} updatePreview(); });

  form.addEventListener("submit", e => {
    updateSummary();
    if (!form.checkValidity()) { e.preventDefault(); form.reportValidity(); return; }
    const submit=form.querySelector(".submit-request"); submit.disabled=true; submit.querySelector("span").textContent="SENDING REQUEST...";
    try{localStorage.removeItem("icharles-website-studio-draft")}catch(_){}
  });

  updatePreview();
})();
