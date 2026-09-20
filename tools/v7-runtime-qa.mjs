import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { chromium } from "playwright-core";

const args = Object.fromEntries(process.argv.slice(2).map(value => {
  const parts = value.replace(/^--/, "").split("=");
  const key = parts.shift();
  return [key, parts.join("=") || true];
}));

const outputDir = path.resolve(String(args.output || "artifacts/v7-runtime"));
const channel = String(args.channel || "msedge");
const serveRoot = args["serve-root"] ? path.resolve(String(args["serve-root"])) : null;
const port = Number(args.port || 4173);
const baseUrl = String(args.base || ("http://127.0.0.1:" + port + "/experience/"));

const checkpoints = [
  ["00-boot", 0],
  ["20-human", 0.20],
  ["42-projects", 0.42],
  ["64-process", 0.64],
  ["82-forge", 0.82],
  ["100-final", 1]
];

const mime = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".webp", "image/webp"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".svg", "image/svg+xml"],
  [".ico", "image/x-icon"],
  [".woff2", "font/woff2"]
]);

function startServer(root) {
  const server = http.createServer((req, res) => {
    try {
      const requestUrl = new URL(req.url || "/", "http://127.0.0.1");
      let pathname = decodeURIComponent(requestUrl.pathname);
      if (pathname.endsWith("/")) pathname += "index.html";
      const target = path.resolve(root, "." + pathname);
      if (!target.startsWith(root + path.sep) && target !== root) {
        res.writeHead(403).end("Forbidden");
        return;
      }
      if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
        res.writeHead(404).end("Not found");
        return;
      }
      res.setHeader("Content-Type", mime.get(path.extname(target).toLowerCase()) || "application/octet-stream");
      res.setHeader("Cache-Control", "no-store");
      fs.createReadStream(target).pipe(res);
    } catch (error) {
      res.writeHead(500).end(String(error));
    }
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}

fs.mkdirSync(outputDir, { recursive: true });
const failures = [];
const consoleErrors = [];
const pageErrors = [];
let server = null;
let browser = null;
let report = null;

function assert(condition, message) {
  if (!condition) failures.push(message);
}

try {
  if (serveRoot) server = await startServer(serveRoot);

  browser = await chromium.launch({ channel, headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();

  page.on("console", message => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", error => pageErrors.push(error.message));

  await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForFunction(() => window.__V7_DEBUG__?.ready === true, null, { timeout: 20000 });

  const first = await page.evaluate(() => ({ ...window.__V7_DEBUG__ }));
  await page.waitForTimeout(350);
  const second = await page.evaluate(() => ({ ...window.__V7_DEBUG__ }));

  const layers = await page.evaluate(() => {
    const world = document.querySelector(".v7-world");
    const canvas = document.getElementById("v7-canvas");
    const story = document.querySelector(".v7-story");
    const engine = document.getElementById("v7-engine");
    const fallback = document.querySelector(".v7-fallback");
    return {
      worldZ: Number.parseInt(getComputedStyle(world).zIndex, 10),
      canvasZ: Number.parseInt(getComputedStyle(canvas).zIndex, 10),
      storyZ: Number.parseInt(getComputedStyle(story).zIndex, 10),
      canvasOpacity: Number.parseFloat(getComputedStyle(canvas).opacity),
      bodyBackground: getComputedStyle(document.body).backgroundColor,
      engineText: engine?.textContent?.trim() || "",
      engineState: engine?.dataset?.state || "",
      fallbackHidden: Boolean(fallback?.hidden),
      canvasSize: [canvas?.width || 0, canvas?.height || 0],
      viewport: [innerWidth, innerHeight]
    };
  });

  assert(first.ready === true, "window.__V7_DEBUG__.ready is not true");
  assert(first.webgl === true, "WebGL context is not reported ready");
  assert(!first.error, "V7 debug reported an error: " + (first.error || "unknown"));
  assert(second.frames > first.frames, "Render frames are not increasing (" + first.frames + " -> " + second.frames + ")");
  assert(first.objects >= 40, "Expected a substantial 3D scene, found only " + first.objects + " objects");
  assert(layers.canvasZ > layers.worldZ, "Canvas z-index " + layers.canvasZ + " is not above world " + layers.worldZ);
  assert(layers.storyZ > layers.canvasZ, "Story z-index " + layers.storyZ + " is not above canvas " + layers.canvasZ);
  assert(layers.canvasOpacity > 0, "Canvas is visually transparent by CSS opacity");
  assert(layers.engineState === "online" && /ONLINE/.test(layers.engineText), "3D ENGINE // ONLINE indicator is missing");
  assert(layers.fallbackHidden === true, "3D fallback is visible despite successful initialization");
  assert(layers.canvasSize[0] > 0 && layers.canvasSize[1] > 0, "Canvas has zero render size");

  const shots = [];
  for (const entry of checkpoints) {
    const name = entry[0];
    const progress = entry[1];
    await page.evaluate(value => {
      const max = Math.max(0, document.documentElement.scrollHeight - innerHeight);
      scrollTo(0, Math.round(max * value));
    }, progress);
    await page.waitForTimeout(750);
    const state = await page.evaluate(() => ({ ...window.__V7_DEBUG__ }));
    const file = path.join(outputDir, name + ".png");
    await page.screenshot({ path: file, fullPage: false });
    shots.push({
      name,
      progress,
      file: path.basename(file),
      frames: state.frames,
      activeScene: state.activeScene
    });
  }

  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(700);
  const reverse = await page.evaluate(() => ({ ...window.__V7_DEBUG__ }));
  assert(reverse.frames > second.frames, "Render loop stopped during reverse scrolling");
  assert(!reverse.error, "Reverse scrolling produced an error: " + (reverse.error || "unknown"));

  report = {
    ok: failures.length === 0 && pageErrors.length === 0,
    baseUrl,
    channel,
    checkedAt: new Date().toISOString(),
    debugStart: first,
    debugAfterWait: second,
    debugAfterReverse: reverse,
    layers,
    checkpoints: shots,
    pageErrors,
    consoleErrors,
    failures
  };
} catch (error) {
  failures.push(error instanceof Error ? (error.stack || error.message) : String(error));
  report = {
    ok: false,
    baseUrl,
    channel,
    checkedAt: new Date().toISOString(),
    pageErrors,
    consoleErrors,
    failures
  };
} finally {
  if (browser) await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
}

fs.writeFileSync(path.join(outputDir, "report.json"), JSON.stringify(report, null, 2));

if (!report.ok) {
  console.error("\nICHARLES V7 RUNTIME QA FAIL\n");
  failures.forEach(item => console.error("- " + item));
  pageErrors.forEach(item => console.error("- Page error: " + item));
  process.exit(1);
}

console.log("\nICHARLES V7 RUNTIME QA PASS\n");
console.log("Browser: " + channel);
console.log("Frames: " + report.debugStart.frames + " -> " + report.debugAfterWait.frames);
console.log("Objects: " + report.debugStart.objects);
console.log("Layers: world " + report.layers.worldZ + " < canvas " + report.layers.canvasZ + " < story " + report.layers.storyZ);
console.log("Screenshots: " + report.checkpoints.length);
