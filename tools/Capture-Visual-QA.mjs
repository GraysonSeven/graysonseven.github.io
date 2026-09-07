import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";

const configPath = process.argv.find(a => a.startsWith("--config="))?.slice(9);
if (!configPath) throw new Error("Missing --config=<path>");

const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const outRoot = path.resolve(config.outputRoot);
const shotsDir = path.join(outRoot, "screenshots");
fs.mkdirSync(shotsDir, { recursive: true });

const captures = [];
const failures = [];
const layoutWarnings = [];

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
  try { await page.waitForLoadState("domcontentloaded", { timeout: 20000 }); } catch {}
  try { await page.waitForLoadState("networkidle", { timeout: 4500 }); } catch {}
  try {
    await page.evaluate(async () => {
      if (document.fonts?.ready) await document.fonts.ready;
    });
  } catch {}
  await page.waitForTimeout(900);
}

async function captureOne(route, theme, vp, group) {
  const file = `${route.name}__${theme}__${vp.name}.png`;
  const filePath = path.join(shotsDir, file);
  const cacheBust = Date.now();
  const joiner = route.path.includes("?") ? "&" : "?";
  const url = `${config.baseUrl}${route.path}${joiner}vqa-theme=${theme}&vqa-capture=1&vqa-build=${cacheBust}`;

  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    screen: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
    colorScheme: theme,
    reducedMotion: "reduce",
    locale: "en-US"
  });

  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await settle(page);

    const metrics = await page.evaluate(() => ({
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
      bodyScrollWidth: document.body?.scrollWidth ?? 0
    }));

    if (metrics.innerWidth !== vp.width || metrics.innerHeight !== vp.height) {
      throw new Error(
        `Viewport integrity mismatch: requested ${vp.width}x${vp.height}, got ${metrics.innerWidth}x${metrics.innerHeight}`
      );
    }

    const horizontalOverflow = Math.max(metrics.scrollWidth, metrics.bodyScrollWidth) - metrics.innerWidth;
    if (horizontalOverflow > 2) {
      layoutWarnings.push({
        group,
        route: route.name,
        theme,
        viewport: vp.name,
        horizontalOverflowPx: horizontalOverflow,
        scrollWidth: Math.max(metrics.scrollWidth, metrics.bodyScrollWidth),
        innerWidth: metrics.innerWidth
      });
    }

    await page.screenshot({
      path: filePath,
      type: "png",
      fullPage: false,
      animations: "disabled",
      caret: "hide",
      scale: "css"
    });

    const stat = fs.statSync(filePath);
    if (stat.size < 5000) throw new Error(`Screenshot unexpectedly small: ${stat.size} bytes`);

    captures.push({
      group,
      route: route.name,
      path: route.path,
      theme,
      viewport: vp.name,
      width: vp.width,
      height: vp.height,
      actualViewport: `${metrics.innerWidth}x${metrics.innerHeight}`,
      devicePixelRatio: metrics.devicePixelRatio,
      horizontalOverflowPx: Math.max(0, horizontalOverflow),
      scrollWidth: Math.max(metrics.scrollWidth, metrics.bodyScrollWidth),
      file,
      bytes: stat.size,
      url
    });

    console.log(`CAPTURE ${route.name.padEnd(20)} ${theme.padEnd(5)} ${vp.name.padEnd(13)} ${metrics.innerWidth}x${metrics.innerHeight}`);
  } catch (error) {
    failures.push({
      group,
      route: route.name,
      theme,
      viewport: vp.name,
      error: error?.message || String(error)
    });
    console.error(`FAIL ${route.name} / ${theme} / ${vp.name}: ${error?.message || error}`);
  } finally {
    await context.close();
  }
}

const themes = ["dark", "light"];
for (const groupDef of config.groups) {
  for (const route of groupDef.routes) {
    for (const theme of themes) {
      for (const vp of groupDef.viewports) {
        await captureOne(route, theme, vp, groupDef.group);
      }
    }
  }
}

await browser.close();

const uniqueNames = new Set(captures.map(c => c.file));
if (uniqueNames.size !== captures.length) {
  failures.push({ error: `Filename collision: ${captures.length} captures but ${uniqueNames.size} unique files.` });
}

const actualFiles = fs.readdirSync(shotsDir).filter(x => x.toLowerCase().endsWith(".png"));
if (actualFiles.length !== captures.length) {
  failures.push({ error: `Screenshot count mismatch: ${captures.length} capture records but ${actualFiles.length} PNG files.` });
}

const manifest = {
  version: "6.3.2",
  engine: "Playwright Core controlling installed Microsoft Edge",
  generated_at: new Date().toISOString(),
  label: config.label,
  base_url: config.baseUrl,
  deep: !!config.deep,
  capture_count: captures.length,
  failure_count: failures.length,
  layout_warning_count: layoutWarnings.length,
  captures,
  layout_warnings: layoutWarnings,
  failures
};
fs.writeFileSync(path.join(outRoot, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

const cards = captures.map(c => `
<article class="card">
  <header>
    <strong>${safeHtml(c.route)}</strong>
    <span>${safeHtml(c.theme)} · ${safeHtml(c.viewport)} · ${c.actualViewport}</span>
  </header>
  <img src="screenshots/${safeHtml(c.file)}" alt="${safeHtml(c.route)} ${safeHtml(c.theme)} ${safeHtml(c.viewport)}">
  <footer>
    <span>${safeHtml(c.path)}</span>
    <b>${c.horizontalOverflowPx > 2 ? `OVERFLOW +${c.horizontalOverflowPx}px` : "WIDTH OK"}</b>
  </footer>
</article>`).join("\n");

const warningBlock = layoutWarnings.length
  ? `<section class="warn"><strong>${layoutWarnings.length} layout warning(s)</strong><pre>${safeHtml(
      layoutWarnings.map(w => `${w.route} / ${w.theme} / ${w.viewport}: +${w.horizontalOverflowPx}px horizontal overflow`).join("\n")
    )}</pre></section>`
  : `<section class="pass"><strong>No horizontal-overflow warnings detected.</strong></section>`;

const failureBlock = failures.length
  ? `<section class="fail"><strong>${failures.length} capture failure(s)</strong><pre>${safeHtml(
      failures.map(f => `${f.route || "system"} / ${f.theme || ""} / ${f.viewport || ""}: ${f.error}`).join("\n")
    )}</pre></section>`
  : `<section class="pass"><strong>All requested screenshots were captured with exact viewport emulation.</strong></section>`;

const gallery = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>iCharles Visual QA — ${safeHtml(config.label)}</title>
<style>
:root{color-scheme:dark}*{box-sizing:border-box}
body{margin:0;background:#05080d;color:#eef6ff;font:14px/1.5 system-ui,Segoe UI,sans-serif}
.top{position:sticky;top:0;z-index:3;padding:18px 22px;background:rgba(5,8,13,.94);border-bottom:1px solid #17405a;backdrop-filter:blur(12px)}
.top h1{margin:0 0 4px;font-size:18px}.top p{margin:0;color:#8da7bb}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:18px;padding:20px}
.card{margin:0;border:1px solid #173d55;background:#07111b;overflow:hidden}
.card header,.card footer{padding:10px 12px}.card header,.card footer{display:flex;justify-content:space-between;gap:12px}
.card header{border-bottom:1px solid #173d55}.card footer{border-top:1px solid #173d55;color:#88a0b5;font-size:12px}
.card footer b{color:#4dffb0}.card header span{color:#88a0b5;font-size:12px}
.card img{display:block;width:100%;height:auto;background:#020408}
.pass,.fail,.warn{margin:20px;padding:14px;border:1px solid #1c5747;background:#071912}
.fail{border-color:#7b2930;background:#1b090b}.warn{border-color:#785f21;background:#181407}
pre{white-space:pre-wrap;margin-bottom:0}
</style>
</head><body>
<div class="top">
<h1>iCharles Visual QA — ${safeHtml(config.label)}</h1>
<p>${safeHtml(config.baseUrl)} · ${captures.length} captures · exact Playwright viewport emulation</p>
</div>
${failureBlock}
${warningBlock}
<main class="grid">${cards}</main>
</body></html>`;
fs.writeFileSync(path.join(outRoot, "VISUAL-QA-GALLERY.html"), gallery, "utf8");

const readme = `ICHARLES AUTOMATED VISUAL QA
============================

Target: ${config.baseUrl}
Label: ${config.label}
Generated: ${new Date().toISOString()}
Engine: Playwright Core controlling installed Microsoft Edge

IMPORTANT
The old Edge --window-size method could produce a 390px screenshot while the CSS layout viewport was still wider.
This version uses browser-context viewport emulation and verifies window.innerWidth/window.innerHeight before every capture.

Captures: ${captures.length}
Failures: ${failures.length}
Layout warnings: ${layoutWarnings.length}

Open VISUAL-QA-GALLERY.html to browse the screenshots.
Upload this generated ZIP to ChatGPT for visual inspection.

Each capture record in manifest.json now includes:
- requested width/height
- actualViewport
- devicePixelRatio
- scrollWidth
- horizontalOverflowPx

Nothing is uploaded automatically.
`;
fs.writeFileSync(path.join(outRoot, "README.txt"), readme, "utf8");

if (failures.length) process.exitCode = 2;
