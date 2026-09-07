import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";

const configPath = process.argv.find(a => a.startsWith("--config="))?.slice(9);
if (!configPath) throw new Error("Missing --config=<path>");

const rawConfig = fs.readFileSync(configPath, "utf8").replace(/^\uFEFF/, "");
const config = JSON.parse(rawConfig);
const outRoot = path.resolve(config.outputRoot);
const shotsDir = path.join(outRoot, "screenshots");
fs.mkdirSync(shotsDir, { recursive: true });

const captures = [];
const failures = [];
const layoutWarnings = [];
const assetWarnings = [];

const navTimeoutMs = Number(config.navigationTimeoutMs || 75000);
const maxAttempts = Math.max(1, Number(config.navigationAttempts || 3));
const assetTimeoutMs = Number(config.visualAssetTimeoutMs || 22000);

const browser = await chromium.launch({
  channel: "msedge",
  headless: true,
  args: [
    "--disable-notifications",
    "--disable-features=TranslateUI",
    "--no-first-run"
  ]
});

const safeHtml = value => String(value)
  .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
  .replaceAll('"',"&quot;").replaceAll("'","&#39;");

async function settle(page) {
  try { await page.waitForLoadState("domcontentloaded", { timeout: 30000 }); } catch {}
  try { await page.waitForSelector("body", { state:"attached", timeout:20000 }); } catch {}
  try { await page.waitForLoadState("networkidle", { timeout:5000 }); } catch {}

  // V6.4.6 creates the deterministic Home identity stage by JS.
  try {
    await page.waitForSelector(".v646-identity-stage", {
      state:"attached",
      timeout:15000
    });
  } catch {}

  try {
    await page.evaluate(async () => {
      if (document.fonts?.ready) {
        await Promise.race([
          document.fonts.ready,
          new Promise(resolve => setTimeout(resolve, 5000))
        ]);
      }
    });
  } catch {}

  await page.waitForTimeout(650);
}

async function navigateWithRetry(page, url, label) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await page.goto(url, {
        waitUntil:"commit",
        timeout:navTimeoutMs
      });

      await settle(page);

      const ready = await page.evaluate(() => ({
        hasDocument:!!document.documentElement,
        hasBody:!!document.body,
        readyState:document.readyState
      }));

      if (!ready.hasDocument || !ready.hasBody) {
        throw new Error(`Document did not become usable (${ready.readyState})`);
      }

      if (attempt > 1) {
        console.log(`RETRY PASS ${label} on attempt ${attempt}/${maxAttempts}`);
      }
      return;
    } catch (error) {
      lastError = error;
      console.warn(`RETRY ${label} attempt ${attempt}/${maxAttempts}: ${error?.message || error}`);

      if (attempt < maxAttempts) {
        try { await page.goto("about:blank", { waitUntil:"commit", timeout:10000 }); } catch {}
        await page.waitForTimeout(1200 * attempt);
      }
    }
  }

  throw lastError || new Error(`Navigation failed after ${maxAttempts} attempts`);
}

async function waitForOneImage(page, selector, label, warningBucket) {
  try {
    await page.waitForSelector(selector, { state:"attached", timeout:12000 });
  } catch {
    warningBucket.push(`${label}: element not attached before capture`);
    return;
  }

  const firstPass = await page.evaluate(async ({ selector, timeoutMs }) => {
    const img = document.querySelector(selector);
    if (!img) return { ok:false, reason:"missing" };

    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    const start = performance.now();

    while (performance.now() - start < timeoutMs) {
      if (img.complete && img.naturalWidth > 0) {
        try {
          if (typeof img.decode === "function") await img.decode();
        } catch {}
        if (img.naturalWidth > 0) {
          return {
            ok:true,
            src:img.currentSrc || img.src,
            width:img.naturalWidth,
            height:img.naturalHeight
          };
        }
      }
      await wait(250);
    }

    return {
      ok:false,
      reason:"timeout",
      src:img.currentSrc || img.src
    };
  }, { selector, timeoutMs:assetTimeoutMs });

  if (firstPass.ok) return;

  warningBucket.push(`${label}: first load timed out; retrying asset request`);

  // Retry the exact same visual asset with a cache-busting query.
  await page.evaluate(({ selector }) => {
    const img = document.querySelector(selector);
    if (!img) return;
    try {
      const u = new URL(img.currentSrc || img.src, location.href);
      u.searchParams.set("vqaAssetRetry", Date.now().toString());
      img.src = u.href;
    } catch {}
  }, { selector });

  const secondPass = await page.evaluate(async ({ selector }) => {
    const img = document.querySelector(selector);
    if (!img) return { ok:false, reason:"missing-after-retry" };

    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    const start = performance.now();

    while (performance.now() - start < 12000) {
      if (img.complete && img.naturalWidth > 0) {
        try {
          if (typeof img.decode === "function") await img.decode();
        } catch {}
        if (img.naturalWidth > 0) {
          return { ok:true, width:img.naturalWidth, height:img.naturalHeight };
        }
      }
      await wait(250);
    }
    return { ok:false, reason:"retry-timeout" };
  }, { selector });

  if (!secondPass.ok) {
    warningBucket.push(`${label}: retry also timed out; screenshot retained for visual diagnosis`);
  }
}

async function waitForHeroBackground(page, warningBucket) {
  const urls = await page.evaluate(() => {
    const hero = document.querySelector(".clarity-hero");
    if (!hero) return [];
    const value = getComputedStyle(hero).backgroundImage || "";
    return [...value.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(m => {
      try { return new URL(m[1], location.href).href; } catch { return m[1]; }
    });
  });

  for (const url of urls) {
    try {
      await page.evaluate(async ({ url, timeoutMs }) => {
        const img = new Image();
        img.src = url;

        const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
        const start = performance.now();

        while (performance.now() - start < timeoutMs) {
          if (img.complete && img.naturalWidth > 0) {
            try { if (typeof img.decode === "function") await img.decode(); } catch {}
            if (img.naturalWidth > 0) return;
          }
          await wait(250);
        }

        throw new Error(`background timeout: ${url}`);
      }, { url, timeoutMs:assetTimeoutMs });
    } catch {
      warningBucket.push(`hero background: load timeout; screenshot retained`);
    }
  }
}

async function captureOne(route, theme, vp, group) {
  const file = `${route.name}__${theme}__${vp.name}.png`;
  const filePath = path.join(shotsDir, file);
  const cacheBust = Date.now();
  const joiner = route.path.includes("?") ? "&" : "?";
  const url = `${config.baseUrl}${route.path}${joiner}vqa-theme=${theme}&vqa-capture=1&vqa-build=${cacheBust}`;

  const context = await browser.newContext({
    viewport:{ width:vp.width, height:vp.height },
    screen:{ width:vp.width, height:vp.height },
    deviceScaleFactor:1,
    colorScheme:theme,
    reducedMotion:"reduce",
    locale:"en-US",
    serviceWorkers:"block"
  });

  context.setDefaultNavigationTimeout(navTimeoutMs);
  context.setDefaultTimeout(30000);

  const page = await context.newPage();
  const localAssetWarnings = [];

  try {
    await navigateWithRetry(
      page,
      url,
      `${route.name} / ${theme} / ${vp.name}`
    );

    // Wait for the actual V6.4.6 stage before checking critical assets.
    try {
      await page.waitForSelector(".v646-identity-stage", {
        state:"attached",
        timeout:15000
      });
    } catch {
      localAssetWarnings.push("V6.4.6 identity stage not attached before asset checks");
    }

    await waitForOneImage(page, ".brand img", "header identity", localAssetWarnings);
    await waitForOneImage(page, ".v646-identity-logo", "Home Iko 1024", localAssetWarnings);
    await waitForOneImage(page, ".v646-identity-orbit", "Home orbit", localAssetWarnings);
    await waitForHeroBackground(page, localAssetWarnings);

    // Always capture after the best-effort asset settle.
    await page.evaluate(() =>
      new Promise(resolve =>
        requestAnimationFrame(() =>
          requestAnimationFrame(resolve)
        )
      )
    );
    await page.waitForTimeout(900);

    const metrics = await page.evaluate(() => ({
      innerWidth:window.innerWidth,
      innerHeight:window.innerHeight,
      devicePixelRatio:window.devicePixelRatio,
      scrollWidth:document.documentElement.scrollWidth,
      scrollHeight:document.documentElement.scrollHeight,
      bodyScrollWidth:document.body?.scrollWidth ?? 0,
      ikoPresent:!!document.querySelector(".v646-identity-logo"),
      ikoLoaded:(() => {
        const img=document.querySelector(".v646-identity-logo");
        return !!(img && img.complete && img.naturalWidth > 0);
      })(),
      orbitLoaded:(() => {
        const img=document.querySelector(".v646-identity-orbit");
        return !!(img && img.complete && img.naturalWidth > 0);
      })()
    }));

    if (metrics.innerWidth !== vp.width || metrics.innerHeight !== vp.height) {
      throw new Error(
        `Viewport integrity mismatch: requested ${vp.width}x${vp.height}, got ${metrics.innerWidth}x${metrics.innerHeight}`
      );
    }

    const horizontalOverflow =
      Math.max(metrics.scrollWidth, metrics.bodyScrollWidth) - metrics.innerWidth;

    if (horizontalOverflow > 2) {
      layoutWarnings.push({
        group,
        route:route.name,
        theme,
        viewport:vp.name,
        horizontalOverflowPx:horizontalOverflow,
        scrollWidth:Math.max(metrics.scrollWidth, metrics.bodyScrollWidth),
        innerWidth:metrics.innerWidth
      });
    }

    await page.screenshot({
      path:filePath,
      type:"png",
      fullPage:false,
      animations:"disabled",
      caret:"hide",
      scale:"css",
      timeout:30000
    });

    const stat = fs.statSync(filePath);
    if (stat.size < 5000) {
      throw new Error(`Screenshot unexpectedly small: ${stat.size} bytes`);
    }

    for (const warning of localAssetWarnings) {
      assetWarnings.push({
        group,
        route:route.name,
        theme,
        viewport:vp.name,
        warning
      });
    }

    captures.push({
      group,
      route:route.name,
      path:route.path,
      theme,
      viewport:vp.name,
      width:vp.width,
      height:vp.height,
      actualViewport:`${metrics.innerWidth}x${metrics.innerHeight}`,
      devicePixelRatio:metrics.devicePixelRatio,
      horizontalOverflowPx:Math.max(0,horizontalOverflow),
      scrollWidth:Math.max(metrics.scrollWidth,metrics.bodyScrollWidth),
      ikoPresent:metrics.ikoPresent,
      ikoLoadedAtCapture:metrics.ikoLoaded,
      orbitLoadedAtCapture:metrics.orbitLoaded,
      assetWarningCount:localAssetWarnings.length,
      file,
      bytes:stat.size,
      url
    });

    console.log(
      `CAPTURE ${route.name.padEnd(20)} ${theme.padEnd(5)} ${vp.name.padEnd(13)} ` +
      `${metrics.innerWidth}x${metrics.innerHeight} ` +
      `IKO=${metrics.ikoLoaded ? "READY" : "NOT-READY"} ` +
      `WARN=${localAssetWarnings.length}`
    );
  } catch (error) {
    failures.push({
      group,
      route:route.name,
      theme,
      viewport:vp.name,
      error:error?.message || String(error)
    });

    console.error(
      `FAIL ${route.name} / ${theme} / ${vp.name}: ${error?.message || error}`
    );
  } finally {
    await context.close();
  }
}

const themes = ["dark","light"];

for (const groupDef of config.groups) {
  for (const route of groupDef.routes) {
    for (const theme of themes) {
      for (const vp of groupDef.viewports) {
        await captureOne(route,theme,vp,groupDef.group);
      }
    }
  }
}

await browser.close();

const actualFiles = fs.readdirSync(shotsDir)
  .filter(x => x.toLowerCase().endsWith(".png"));

if (actualFiles.length !== captures.length) {
  failures.push({
    error:`Screenshot count mismatch: ${captures.length} records but ${actualFiles.length} PNG files`
  });
}

const manifest = {
  version:"6.4.6B",
  engine:"Playwright Core controlling installed Microsoft Edge",
  generated_at:new Date().toISOString(),
  label:config.label,
  base_url:config.baseUrl,
  navigation_timeout_ms:navTimeoutMs,
  navigation_attempts:maxAttempts,
  visual_asset_timeout_ms:assetTimeoutMs,
  visual_asset_wait:"best-effort-with-retry",
  capture_even_on_asset_warning:true,
  capture_count:captures.length,
  failure_count:failures.length,
  layout_warning_count:layoutWarnings.length,
  asset_warning_count:assetWarnings.length,
  captures,
  asset_warnings:assetWarnings,
  layout_warnings:layoutWarnings,
  failures
};

fs.writeFileSync(
  path.join(outRoot,"manifest.json"),
  JSON.stringify(manifest,null,2),
  "utf8"
);

const cards = captures.map(c => `
<article class="card">
  <header>
    <strong>${safeHtml(c.route)}</strong>
    <span>${safeHtml(c.theme)} · ${safeHtml(c.viewport)} · ${c.actualViewport}</span>
  </header>
  <img src="screenshots/${safeHtml(c.file)}" alt="${safeHtml(c.route)} ${safeHtml(c.theme)} ${safeHtml(c.viewport)}">
  <footer>
    <span>IKO ${c.ikoLoadedAtCapture ? "READY" : "NOT READY"} · WARN ${c.assetWarningCount}</span>
    <b>${c.horizontalOverflowPx > 2 ? `OVERFLOW +${c.horizontalOverflowPx}px` : "WIDTH OK"}</b>
  </footer>
</article>`).join("\n");

const warningText = assetWarnings.length
  ? assetWarnings.map(w =>
      `${w.route} / ${w.theme} / ${w.viewport}: ${w.warning}`
    ).join("\n")
  : "No critical asset warnings.";

const gallery = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>iCharles Visual QA — ${safeHtml(config.label)}</title>
<style>
:root{color-scheme:dark}*{box-sizing:border-box}
body{margin:0;background:#05080d;color:#eef6ff;font:14px/1.5 system-ui,Segoe UI,sans-serif}
.top{padding:18px 22px;background:#05080d;border-bottom:1px solid #17405a}
.top h1{margin:0 0 4px;font-size:18px}.top p{margin:0;color:#8da7bb}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:18px;padding:20px}
.card{border:1px solid #173d55;background:#07111b;overflow:hidden}
.card header,.card footer{padding:10px 12px;display:flex;justify-content:space-between;gap:12px}
.card header{border-bottom:1px solid #173d55}.card footer{border-top:1px solid #173d55;color:#88a0b5;font-size:12px}
.card footer b{color:#4dffb0}.card header span{color:#88a0b5;font-size:12px}
.card img{display:block;width:100%;height:auto}
.warn{margin:20px;padding:14px;border:1px solid #785f21;background:#181407}
pre{white-space:pre-wrap;margin:8px 0 0}
</style></head>
<body>
<div class="top">
<h1>iCharles Visual QA — ${safeHtml(config.label)}</h1>
<p>${captures.length} captures · asset warnings do not discard screenshots</p>
</div>
<section class="warn">
<strong>Asset warnings: ${assetWarnings.length}</strong>
<pre>${safeHtml(warningText)}</pre>
</section>
<main class="grid">${cards}</main>
</body></html>`;

fs.writeFileSync(
  path.join(outRoot,"VISUAL-QA-GALLERY.html"),
  gallery,
  "utf8"
);

fs.writeFileSync(
  path.join(outRoot,"README.txt"),
  `ICHARLES HOME VISUAL QA 6.4.6B
===============================
Target: ${config.baseUrl}
Captures: ${captures.length}
Hard failures: ${failures.length}
Layout warnings: ${layoutWarnings.length}
Asset warnings: ${assetWarnings.length}

Important:
Asset-load timeouts no longer discard screenshots.
The engine retries the Iko/orbit once, then keeps the screenshot for visual diagnosis.
`,
  "utf8"
);

if (failures.length) process.exitCode = 2;
