import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { chromium } from "playwright-core";

const args = Object.fromEntries(process.argv.slice(2).map(value => {
  const parts = value.replace(/^--/, "").split("=");
  return [parts.shift(), parts.join("=") || true];
}));

const outputDir = path.resolve(String(args.output || "artifacts/v7-theme"));
const channel = String(args.channel || "msedge");
const serveRoot = args["serve-root"] ? path.resolve(String(args["serve-root"])) : null;
const port = Number(args.port || 4175);
const origin = String(args.origin || ("http://127.0.0.1:" + port));
const experienceUrl = origin.replace(/\/+$/, "") + "/experience/";
const homeUrl = origin.replace(/\/+$/, "") + "/";
const failures = [];
const results = [];
let browser = null;
let server = null;

const mime = new Map([
  [".html", "text/html; charset=utf-8"], [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"], [".mjs", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"], [".png", "image/png"],
  [".webp", "image/webp"], [".jpg", "image/jpeg"], [".jpeg", "image/jpeg"],
  [".svg", "image/svg+xml"], [".ico", "image/x-icon"], [".woff2", "font/woff2"]
]);

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function startServer(root) {
  const srv = http.createServer((req, res) => {
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
    srv.once("error", reject);
    srv.listen(port, "127.0.0.1", () => resolve(srv));
  });
}

async function readTheme(page) {
  return page.evaluate(() => ({
    theme: document.documentElement.dataset.uiTheme || "",
    colorScheme: document.documentElement.style.colorScheme || "",
    visualQa: document.documentElement.dataset.visualQa || "",
    inApp: document.documentElement.dataset.inAppBrowser || "",
    stored: localStorage.getItem("icharles-ui-theme"),
    v7Button: document.getElementById("v7-theme")
      ? {
          text: document.getElementById("v7-theme").textContent?.trim() || "",
          disabled: document.getElementById("v7-theme").disabled,
          aria: document.getElementById("v7-theme").getAttribute("aria-label") || ""
        }
      : null
  }));
}

async function freshDarkIgnoresOsLight() {
  const context = await browser.newContext({
    viewport: { width: 1024, height: 900 },
    colorScheme: "light"
  });
  const page = await context.newPage();
  try {
    await page.goto(experienceUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    const state = await readTheme(page);
    assert(state.theme === "dark", "fresh visit under OS light did not default to dark");
    assert(state.colorScheme === "dark", "fresh visit did not set dark colorScheme");
    assert(state.stored === null, "fresh visit unexpectedly persisted a theme");
    results.push({ case: "fresh-dark-os-light", state });
  } finally {
    await context.close();
  }
}

async function manualLightPersists() {
  const context = await browser.newContext({ viewport: { width: 1024, height: 900 } });
  const page = await context.newPage();
  try {
    await page.goto(experienceUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    const before = await readTheme(page);
    assert(before.theme === "dark", "manual persistence case did not start dark");
    await page.click("#v7-theme");
    const afterClick = await readTheme(page);
    assert(afterClick.theme === "light", "theme button did not switch to light");
    assert(afterClick.stored === "light", "manual light choice was not persisted");
    await page.reload({ waitUntil: "domcontentloaded", timeout: 30000 });
    const afterReload = await readTheme(page);
    assert(afterReload.theme === "light", "saved manual light choice did not survive reload");
    assert(afterReload.v7Button?.text === "LIGHT", "theme button did not sync to saved light");
    results.push({ case: "manual-light-persists", before, afterClick, afterReload });
  } finally {
    await context.close();
  }
}

async function inAppStaysDark() {
  const userAgent = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 [FBAN/EMA;FBAV/480.0.0.0.0;FB_IAB/MESSENGER]";
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent,
    hasTouch: true,
    isMobile: true,
    colorScheme: "light"
  });
  const page = await context.newPage();
  try {
    await page.goto(experienceUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.evaluate(() => localStorage.setItem("icharles-ui-theme", "light"));
    await page.reload({ waitUntil: "domcontentloaded", timeout: 30000 });
    const experienceState = await readTheme(page);
    assert(experienceState.theme === "dark", "in-app experience allowed saved light theme");
    assert(experienceState.inApp === "1", "in-app experience did not expose lock state");
    assert(experienceState.v7Button?.disabled === true, "in-app experience theme button is not disabled");
    assert(/locked/i.test(experienceState.v7Button?.aria || ""), "in-app experience theme control does not explain the lock");

    await page.goto(homeUrl, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForSelector("#v7-theme, .v60-theme-toggle", { timeout: 15000 });
    const homeState = await page.evaluate(() => {
      const button = document.querySelector("#v7-theme, .v60-theme-toggle");
      return {
        theme: document.documentElement.dataset.uiTheme || "",
        inApp: document.documentElement.dataset.inAppBrowser || "",
        stored: localStorage.getItem("icharles-ui-theme"),
        control: button?.id === "v7-theme" ? "v7" : button?.classList.contains("v60-theme-toggle") ? "v60" : "",
        disabled: Boolean(button?.disabled),
        aria: button?.getAttribute("aria-label") || ""
      };
    });
    assert(homeState.theme === "dark", "public Home allowed saved light theme in in-app browser");
    assert(homeState.inApp === "1", "public Home did not retain in-app lock state");
    assert(homeState.disabled === true, "public Home theme toggle is not disabled in in-app browser");
    assert(/locked/i.test(homeState.aria), "public Home theme control does not explain the lock");
    results.push({ case: "in-app-dark-lock", experienceState, homeState });
  } finally {
    await context.close();
  }
}

async function qaOverrideWins() {
  const userAgent = "Mozilla/5.0 [FBAN/FB4A;FBAV/500.0.0.0.0]";
  const context = await browser.newContext({
    viewport: { width: 1024, height: 900 },
    userAgent,
    colorScheme: "dark"
  });
  const page = await context.newPage();
  try {
    await page.goto(experienceUrl + "?vqa-theme=light", { waitUntil: "domcontentloaded", timeout: 30000 });
    const state = await readTheme(page);
    assert(state.theme === "light", "Visual QA light override did not win over in-app lock");
    assert(state.visualQa === "1", "Visual QA marker missing");
    assert(state.inApp === "", "in-app lock should not be set during explicit Visual QA override");
    assert(state.v7Button?.disabled === false, "theme control stayed disabled during Visual QA override");
    results.push({ case: "qa-override-wins", state });
  } finally {
    await context.close();
  }
}

try {
  fs.mkdirSync(outputDir, { recursive: true });
  if (serveRoot) server = await startServer(serveRoot);
  browser = await chromium.launch({ channel, headless: true });

  await freshDarkIgnoresOsLight();
  await manualLightPersists();
  await inAppStaysDark();
  await qaOverrideWins();

  const report = {
    ok: failures.length === 0,
    channel,
    origin,
    checkedAt: new Date().toISOString(),
    results,
    failures
  };
  fs.writeFileSync(path.join(outputDir, "report.json"), JSON.stringify(report, null, 2));

  if (!report.ok) {
    console.error("\nICHARLES THEME CONTRACT QA FAIL\n");
    failures.forEach(item => console.error("- " + item));
    process.exitCode = 1;
  } else {
    console.log("\nICHARLES THEME CONTRACT QA PASS\n");
    console.log("Fresh visit: DARK even when OS is LIGHT");
    console.log("Manual LIGHT: persists in normal browser");
    console.log("Facebook/Messenger in-app: DARK locked on experience + public Home");
    console.log("Visual QA override: deterministic and highest priority");
  }
} finally {
  if (browser) await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
}
