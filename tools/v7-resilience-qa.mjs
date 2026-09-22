import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { chromium } from "playwright-core";

const args = Object.fromEntries(process.argv.slice(2).map(value => {
  const parts = value.replace(/^--/, "").split("=");
  return [parts.shift(), parts.join("=") || true];
}));

const outputDir = path.resolve(String(args.output || "artifacts/v7-resilience"));
const channel = String(args.channel || "msedge");
const serveRoot = args["serve-root"] ? path.resolve(String(args["serve-root"])) : null;
const port = Number(args.port || 4174);
const baseUrl = String(args.base || ("http://127.0.0.1:" + port + "/experience/"));
const failures = [];
let server = null;
let browser = null;

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

async function testReducedMotion() {
  const dir = path.join(outputDir, "reduced-motion");
  fs.mkdirSync(dir, { recursive: true });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce"
  });
  const page = await context.newPage();
  const pageErrors = [];
  const networkErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("response", response => {
    if (response.status() >= 400) networkErrors.push(response.status() + " " + response.url());
  });

  try {
    await page.goto(baseUrl, { waitUntil: "load", timeout: 30000 });
    await page.waitForFunction(() => window.__V7_DEBUG__?.ready === true, null, { timeout: 20000 });

    const first = await page.evaluate(() => ({
      debug: { ...window.__V7_DEBUG__ },
      engine: document.getElementById("v7-engine")?.textContent?.trim() || "",
      motion: document.documentElement.dataset.v7Motion || "",
      render: document.documentElement.dataset.v7Render || ""
    }));

    await page.waitForTimeout(900);
    const second = await page.evaluate(() => ({ ...window.__V7_DEBUG__ }));

    assert(first.debug.version === "7.4.0", "reduced-motion: wrong V7 version " + first.debug.version);
    assert(first.debug.reducedMotion === true, "reduced-motion: debug flag is false");
    assert(first.debug.webgl === true, "reduced-motion: WebGL did not initialize");
    assert(first.debug.fallback === false, "reduced-motion: fallback activated unexpectedly");
    assert(first.motion === "reduced", "reduced-motion: html motion state is " + first.motion);
    assert(first.render === "webgl", "reduced-motion: render state is " + first.render);
    assert(/STATIC/.test(first.engine), "reduced-motion: engine badge does not report STATIC");
    assert(second.frames === first.debug.frames, "reduced-motion: continuous animation is still running (" + first.debug.frames + " -> " + second.frames + ")");
    assert(pageErrors.length === 0, "reduced-motion: page errors: " + pageErrors.join(" | "));
    assert(networkErrors.length === 0, "reduced-motion: HTTP errors: " + networkErrors.join(" | "));

    const checkpoints = [
      ["00-boot", "boot"],
      ["20-human", "human"],
      ["42-projects", "projects"],
      ["64-process", "process"],
      ["82-forge", "forge"],
      ["100-final", "contact"]
    ];

    const states = [];
    for (const [name, expected] of checkpoints) {
      const target = await page.evaluate(sceneName => {
        const section = document.querySelector('.v7-scene[data-scene="' + sceneName + '"]');
        if (!section) return null;
        const max = Math.max(0, document.documentElement.scrollHeight - innerHeight);
        const center = section.offsetTop + section.offsetHeight * 0.5 - innerHeight * 0.5;
        const y = Math.max(0, Math.min(max, Math.round(center)));
        scrollTo({ top: y, behavior: "instant" });
        return { y, max, top: section.offsetTop, height: section.offsetHeight };
      }, expected);
      assert(Boolean(target), "reduced-motion: missing scene section " + expected);
      if (!target) continue;
      await page.waitForFunction(
        sceneName => window.__V7_DEBUG__?.activeScene === sceneName,
        expected,
        { timeout: 2000 }
      ).catch(() => {});
      const state = await page.evaluate(() => ({ ...window.__V7_DEBUG__ }));
      assert(state.activeScene === expected, "reduced-motion: " + name + " expected " + expected + ", found " + state.activeScene);
      states.push({ name, expected, actual: state.activeScene, frames: state.frames, target });
      if (name === "00-boot" || name === "100-final") {
        await page.screenshot({ path: path.join(dir, name + ".png"), fullPage: false });
      }
    }

    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(180);
    const reverse = await page.evaluate(() => ({ ...window.__V7_DEBUG__ }));
    assert(reverse.activeScene === "boot", "reduced-motion: reverse scroll did not restore boot state");
    assert(reverse.frames === first.debug.frames, "reduced-motion: static renderer produced unsolicited frames during scrolling");

    return {
      initial: first,
      afterIdle: second,
      afterReverse: reverse,
      checkpoints: states,
      pageErrors,
      networkErrors
    };
  } finally {
    await context.close();
  }
}

async function testWebGLFallback() {
  const dir = path.join(outputDir, "webgl-fallback");
  fs.mkdirSync(dir, { recursive: true });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true
  });

  await context.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      if (type === "webgl" || type === "webgl2" || type === "experimental-webgl") return null;
      return original.call(this, type, ...args);
    };
  });

  const page = await context.newPage();
  const pageErrors = [];
  const networkErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("response", response => {
    if (response.status() >= 400) networkErrors.push(response.status() + " " + response.url());
  });

  try {
    await page.goto(baseUrl, { waitUntil: "load", timeout: 30000 });
    await page.waitForFunction(() => window.__V7_DEBUG__?.fallback === true, null, { timeout: 20000 });

    const state = await page.evaluate(() => {
      const debug = { ...window.__V7_DEBUG__ };
      const fallback = document.querySelector(".v7-fallback");
      const canvas = document.getElementById("v7-canvas");
      const engine = document.getElementById("v7-engine");
      const firstHeading = document.querySelector(".v7-copy h1");
      return {
        debug,
        render: document.documentElement.dataset.v7Render || "",
        fallbackHidden: Boolean(fallback?.hidden),
        fallbackDisplay: fallback ? getComputedStyle(fallback).display : "",
        canvasDisplay: canvas ? getComputedStyle(canvas).display : "",
        engineState: engine?.dataset?.state || "",
        engineText: engine?.textContent?.trim() || "",
        headingVisible: Boolean(firstHeading && firstHeading.getBoundingClientRect().width > 0),
        scrollWidth: document.documentElement.scrollWidth,
        viewportWidth: innerWidth
      };
    });

    assert(state.debug.ready === false, "fallback: debug ready should remain false");
    assert(state.debug.webgl === false, "fallback: webgl flag should be false");
    assert(state.debug.fallback === true, "fallback: fallback debug flag is false");
    assert(Boolean(state.debug.error), "fallback: error reason is missing");
    assert(state.render === "fallback", "fallback: html render state is " + state.render);
    assert(state.fallbackHidden === false && state.fallbackDisplay !== "none", "fallback: status panel is not visible");
    assert(state.canvasDisplay === "none", "fallback: failed WebGL canvas is still visible");
    assert(state.engineState === "error" && /FALLBACK/.test(state.engineText), "fallback: engine badge is not in fallback state");
    assert(state.headingVisible, "fallback: primary HTML content is not visible");
    assert(state.scrollWidth <= state.viewportWidth + 2, "fallback: horizontal overflow on phone");
    assert(pageErrors.length === 0, "fallback: page errors: " + pageErrors.join(" | "));
    assert(networkErrors.length === 0, "fallback: HTTP errors: " + networkErrors.join(" | "));

    const quoteLocator = page.locator('.v7-final-actions a[href="/contact/"]');
    await quoteLocator.scrollIntoViewIfNeeded();
    await page.waitForTimeout(180);
    const final = await page.evaluate(() => {
      const quote = document.querySelector('.v7-final-actions a[href="/contact/"]');
      const work = document.querySelector('.v7-final-actions a[href="/portfolio/"]');
      const quoteRect = quote?.getBoundingClientRect();
      const centerX = quoteRect ? quoteRect.left + quoteRect.width / 2 : -1;
      const centerY = quoteRect ? quoteRect.top + quoteRect.height / 2 : -1;
      const hit = centerX >= 0 && centerY >= 0 ? document.elementFromPoint(centerX, centerY) : null;
      return {
        quoteVisible: Boolean(quoteRect && quoteRect.width > 0 && quoteRect.height > 0 && quoteRect.top < innerHeight && quoteRect.bottom > 0),
        quoteUnobstructed: Boolean(quote && hit && (hit === quote || quote.contains(hit))),
        quoteHref: quote?.getAttribute("href") || "",
        workHref: work?.getAttribute("href") || ""
      };
    });

    assert(final.quoteVisible, "fallback: request quote CTA is not visible at final scene");
    assert(final.quoteUnobstructed, "fallback: request quote CTA is visually obstructed");
    assert(final.quoteHref === "/contact/", "fallback: request quote route changed");
    assert(final.workHref === "/portfolio/", "fallback: portfolio route changed");
    await page.screenshot({ path: path.join(dir, "fallback-final-cta.png"), fullPage: false });

    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(180);
    const notice = await page.evaluate(() => {
      const panel = document.querySelector(".v7-fallback");
      const rect = panel?.getBoundingClientRect();
      return {
        visible: Boolean(rect && rect.width > 0 && rect.height > 0 && rect.top < innerHeight && rect.bottom > 0),
        position: panel ? getComputedStyle(panel).position : ""
      };
    });
    assert(notice.visible, "fallback: notice is not reachable at page end");
    assert(notice.position === "relative", "fallback: notice should be in normal flow, found " + notice.position);
    await page.screenshot({ path: path.join(dir, "fallback-notice.png"), fullPage: false });

    return { state, final, notice, pageErrors, networkErrors };
  } finally {
    await context.close();
  }
}

try {
  if (serveRoot) server = await startServer(serveRoot);
  browser = await chromium.launch({ channel, headless: true });

  let reducedReport = null;
  let fallbackReport = null;

  try {
    reducedReport = await testReducedMotion();
  } catch (error) {
    failures.push("reduced-motion: " + (error instanceof Error ? (error.stack || error.message) : String(error)));
  }

  try {
    fallbackReport = await testWebGLFallback();
  } catch (error) {
    failures.push("webgl-fallback: " + (error instanceof Error ? (error.stack || error.message) : String(error)));
  }

  const report = {
    ok: failures.length === 0 && Boolean(reducedReport) && Boolean(fallbackReport),
    baseUrl,
    channel,
    checkedAt: new Date().toISOString(),
    reducedMotion: reducedReport,
    webglFallback: fallbackReport,
    failures
  };

  fs.writeFileSync(path.join(outputDir, "report.json"), JSON.stringify(report, null, 2));

  if (!report.ok) {
    console.error("\nICHARLES V7 RESILIENCE QA FAIL\n");
    failures.forEach(item => console.error("- " + item));
    process.exitCode = 1;
  } else {
    console.log("\nICHARLES V7 RESILIENCE QA PASS\n");
    console.log("Browser: " + channel);
    console.log("Reduced motion: static WebGL, 6 scene states, 0 continuous frames");
    console.log("WebGL fallback: HTML content + final CTAs usable on 390x844");
  }
} finally {
  if (browser) await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
}
