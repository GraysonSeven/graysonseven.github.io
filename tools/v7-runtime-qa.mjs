import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { chromium } from "playwright-core";

const args = Object.fromEntries(process.argv.slice(2).map(value => {
  const parts = value.replace(/^--/, "").split("=");
  return [parts.shift(), parts.join("=") || true];
}));

const outputDir = path.resolve(String(args.output || "artifacts/v7-runtime"));
const channel = String(args.channel || "msedge");
const serveRoot = args["serve-root"] ? path.resolve(String(args["serve-root"])) : null;
const port = Number(args.port || 4173);
const baseUrl = String(args.base || ("http://127.0.0.1:" + port + "/experience/"));

const checkpoints = [
  ["00-boot", 0, "boot"],
  ["20-human", 0.20, "human"],
  ["42-projects", 0.42, "projects"],
  ["64-process", 0.64, "process"],
  ["82-forge", 0.82, "forge"],
  ["100-final", 1, "contact"]
];

const profiles = [
  { name: "desktop-1440", width: 1440, height: 1000, hasTouch: false, isMobile: false },
  { name: "split-1024", width: 1024, height: 900, hasTouch: false, isMobile: false },
  { name: "phone-390", width: 390, height: 844, hasTouch: true, isMobile: true }
];

const mime = new Map([
  [".html", "text/html; charset=utf-8"], [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"], [".mjs", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"], [".png", "image/png"],
  [".webp", "image/webp"], [".jpg", "image/jpeg"], [".jpeg", "image/jpeg"],
  [".svg", "image/svg+xml"], [".ico", "image/x-icon"], [".woff2", "font/woff2"]
]);

function startServer(root) {
  const server = http.createServer((req, res) => {
    try {
      const requestUrl = new URL(req.url || "/", "http://127.0.0.1");
      let pathname = decodeURIComponent(requestUrl.pathname);
      if (pathname.endsWith("/")) pathname += "index.html";
      const target = path.resolve(root, "." + pathname);
      if (!target.startsWith(root + path.sep) && target !== root) return res.writeHead(403).end("Forbidden");
      if (!fs.existsSync(target) || !fs.statSync(target).isFile()) return res.writeHead(404).end("Not found");
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
let server = null;
let browser = null;
const profileReports = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}


async function captureCheckpoint(page, file) {
  try {
    await page.screenshot({ path: file, fullPage: false, timeout: 20000 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/screenshot|Timeout/i.test(message)) throw error;
    await page.waitForTimeout(650);
    await page.screenshot({ path: file, fullPage: false, timeout: 40000 });
  }
}

async function qualifyProfile(profile) {
  const profileDir = path.join(outputDir, profile.name);
  fs.mkdirSync(profileDir, { recursive: true });

  const context = await browser.newContext({
    viewport: { width: profile.width, height: profile.height },
    deviceScaleFactor: 1,
    hasTouch: profile.hasTouch,
    isMobile: profile.isMobile
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const networkErrors = [];

  page.on("console", message => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("response", response => {
    if (response.status() >= 400) networkErrors.push(response.status() + " " + response.url());
  });

  try {
    await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForFunction(() => window.__V7_DEBUG__?.ready === true, null, { timeout: 20000 });

    const first = await page.evaluate(() => ({ ...window.__V7_DEBUG__ }));
    await page.waitForTimeout(350);
    const second = await page.evaluate(() => ({ ...window.__V7_DEBUG__ }));

    const layout = await page.evaluate(() => {
      const world = document.querySelector(".v7-world");
      const canvas = document.getElementById("v7-canvas");
      const story = document.querySelector(".v7-story");
      const engine = document.getElementById("v7-engine");
      const fallback = document.querySelector(".v7-fallback");
      const header = document.querySelector(".v7-header");
      const copy = document.querySelector(".v7-copy");
      const headerRect = header?.getBoundingClientRect();
      const copyRect = copy?.getBoundingClientRect();
      return {
        worldZ: Number.parseInt(getComputedStyle(world).zIndex, 10),
        canvasZ: Number.parseInt(getComputedStyle(canvas).zIndex, 10),
        storyZ: Number.parseInt(getComputedStyle(story).zIndex, 10),
        canvasOpacity: Number.parseFloat(getComputedStyle(canvas).opacity),
        engineText: engine?.textContent?.trim() || "",
        engineState: engine?.dataset?.state || "",
        fallbackHidden: Boolean(fallback?.hidden),
        canvasSize: [canvas?.width || 0, canvas?.height || 0],
        viewport: [innerWidth, innerHeight],
        scrollWidth: document.documentElement.scrollWidth,
        header: headerRect ? { left: headerRect.left, right: headerRect.right, width: headerRect.width } : null,
        copy: copyRect ? { left: copyRect.left, right: copyRect.right, width: copyRect.width } : null
      };
    });

    const prefix = profile.name + ": ";
    assert(first.ready === true, prefix + "debug ready is not true");
    assert(first.webgl === true, prefix + "WebGL context is not ready");
    assert(!first.error, prefix + "debug error: " + (first.error || "unknown"));
    assert(second.frames > first.frames, prefix + "render frames are not increasing");
    assert(first.version === "7.3.0", prefix + "expected V7.3.0, found " + first.version);
    assert(first.objects >= 80, prefix + "scene density fell below 80 objects");
    assert(first.machines === 5, prefix + "expected five project machines");
    assert(first.forgePanels === 4, prefix + "expected four forge interface panels");
    assert(layout.canvasZ > layout.worldZ, prefix + "canvas is not above world");
    assert(layout.storyZ > layout.canvasZ, prefix + "story is not above canvas");
    assert(layout.canvasOpacity > 0, prefix + "canvas opacity is zero");
    assert(layout.engineState === "online" && /ONLINE/.test(layout.engineText), prefix + "engine is not online");
    assert(layout.fallbackHidden === true, prefix + "fallback is visible unexpectedly");
    assert(layout.canvasSize[0] > 0 && layout.canvasSize[1] > 0, prefix + "canvas has zero render size");
    assert(layout.scrollWidth <= layout.viewport[0] + 2, prefix + "horizontal overflow: " + layout.scrollWidth + " > " + layout.viewport[0]);
    assert(!layout.header || (layout.header.left >= -1 && layout.header.right <= layout.viewport[0] + 1), prefix + "header escapes viewport");
    assert(!layout.copy || (layout.copy.left >= -1 && layout.copy.right <= layout.viewport[0] + 1), prefix + "primary copy escapes viewport");

    const shots = [];
    for (const [name, progress, expectedScene] of checkpoints) {
      const beforeFrames = await page.evaluate(() => window.__V7_DEBUG__.frames);
      await page.evaluate(value => {
        const max = Math.max(0, document.documentElement.scrollHeight - innerHeight);
        scrollTo(0, Math.round(max * value));
      }, progress);
      await page.waitForTimeout(profile.isMobile ? 520 : 430);

      const state = await page.evaluate(() => ({ ...window.__V7_DEBUG__ }));
      assert(state.frames > beforeFrames, prefix + name + " render loop did not advance");
      assert(!state.error, prefix + name + " debug error: " + (state.error || "unknown"));
      assert(state.activeScene === expectedScene, prefix + name + " expected active scene " + expectedScene + ", found " + state.activeScene);

      const file = path.join(profileDir, name + ".png");
      await captureCheckpoint(page, file);
      shots.push({ name, progress, expectedScene, activeScene: state.activeScene, frames: state.frames, file: path.relative(outputDir, file) });
    }

    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(500);
    const reverse = await page.evaluate(() => ({ ...window.__V7_DEBUG__ }));
    assert(reverse.frames > second.frames, prefix + "render loop stopped on reverse scroll");
    assert(reverse.activeScene === "boot", prefix + "reverse scroll did not return to boot");
    assert(pageErrors.length === 0, prefix + "page errors: " + pageErrors.join(" | "));
    assert(networkErrors.length === 0, prefix + "HTTP errors: " + networkErrors.join(" | "));

    return {
      profile,
      debugStart: first,
      debugAfterWait: second,
      debugAfterReverse: reverse,
      layout,
      checkpoints: shots,
      pageErrors,
      consoleErrors,
      networkErrors
    };
  } finally {
    await context.close();
  }
}

try {
  if (serveRoot) server = await startServer(serveRoot);
  browser = await chromium.launch({ channel, headless: true });

  for (const profile of profiles) {
    try {
      profileReports.push(await qualifyProfile(profile));
    } catch (error) {
      failures.push(profile.name + ": " + (error instanceof Error ? (error.stack || error.message) : String(error)));
    }
  }
} finally {
  if (browser) await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
}

const report = {
  ok: failures.length === 0 && profileReports.length === profiles.length,
  baseUrl,
  channel,
  checkedAt: new Date().toISOString(),
  profiles: profileReports,
  failures
};

fs.writeFileSync(path.join(outputDir, "report.json"), JSON.stringify(report, null, 2));

if (!report.ok) {
  console.error("\nICHARLES V7 RESPONSIVE RUNTIME QA FAIL\n");
  failures.forEach(item => console.error("- " + item));
  process.exit(1);
}

console.log("\nICHARLES V7 RESPONSIVE RUNTIME QA PASS\n");
console.log("Browser: " + channel);
for (const item of profileReports) {
  console.log(
    item.profile.name + ": " +
    item.layout.viewport.join("x") +
    ", objects=" + item.debugStart.objects +
    ", frames=" + item.debugStart.frames + "->" + item.debugAfterWait.frames +
    ", overflow=" + item.layout.scrollWidth +
    ", screenshots=" + item.checkpoints.length
  );
}
console.log("Screenshots: " + profileReports.reduce((sum, item) => sum + item.checkpoints.length, 0));
