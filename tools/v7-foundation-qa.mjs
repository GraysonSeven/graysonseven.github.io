import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const failures = [];
const fail = message => failures.push(message);
const exists = rel => fs.existsSync(path.join(root, rel));
const read = rel => fs.readFileSync(path.join(root, rel), "utf8");
const lockedIko = "assets/iko-prime/identity/iko-prime-logo-locked.png";

if (!exists(lockedIko)) {
  fail("Locked Iko missing");
} else {
  const actual = crypto.createHash("sha256").update(fs.readFileSync(path.join(root, lockedIko))).digest("hex").toUpperCase();
  const expected = "DDA9E772F1267325918D3608273124BD21A507B57BB49A9E2148EBFF0CBBB5FD";
  if (actual !== expected) fail("Locked Iko changed: " + actual);
}

for (const rel of [
  "experience/index.html",
  "experience/experience.css",
  "experience/experience.js",
  "assets/v7/charles-profile-source.webp",
  "assets/v7/charles-operator-v7.webp",
  "assets/v7/iko-archive-world-dark.webp",
  "assets/v7/iko-archive-world-light.webp",
  "assets/vendor/v7/three.module.min.js",
  "assets/vendor/v7/three.core.min.js",
  "assets/vendor/v7/gsap.min.js",
  "assets/vendor/v7/ScrollTrigger.min.js",
  "V7_SAFETY_POINT.json",
  "ghostops-theme-boot-v60.js",
  "ghostops-v60.js",
  "tools/v7-theme-contract-qa.mjs"
]) {
  if (!exists(rel)) fail("Missing " + rel);
}

if (exists("experience/index.html")) {
  const html = read("experience/index.html");
  for (const marker of [
    "noindex,nofollow,noarchive",
    "data-v7-version=\"7.4.0\"",
    "SYSTEM 01 // IKO ONLINE",
    "SYSTEM 02 // THE BUILDER",
    "SYSTEM 03 // THINGS I BUILT",
    "IKO KNOW IT",
    "GHOST OPS",
    "ACTIVE DEVELOPMENT",
    "PRIVATE PREVIEW",
    "AGREE SCOPE",
    "ENTER WEBSITE STUDIO",
    "REQUEST A QUOTE",
    "3D ENGINE // BOOTING",
    "experience.css?v=740",
    "experience.js?v=740"
  ]) {
    if (!html.includes(marker)) fail("HTML marker missing: " + marker);
  }
}

if (exists("experience/experience.css")) {
  const css = read("experience/experience.css");
  if (!/\.v7-world\{[^}]*z-index:0/.test(css)) fail("World plate must be z-index 0");
  if (!/#v7-canvas\{[^}]*z-index:2/.test(css)) fail("WebGL canvas must be z-index 2");
  if (!/\.v7-story\{[^}]*z-index:10/.test(css)) fail("HTML story must be z-index 10");
  if (!/body\{[^}]*background:transparent/.test(css)) fail("Body must expose the WebGL canvas");
  if (!css.includes(".v7-engine")) fail("3D engine runtime badge styling missing");
  if (!css.includes('html[data-v7-render="fallback"] #v7-canvas')) fail("WebGL fallback canvas state missing");
  if (!css.includes('html[data-v7-motion="reduced"]')) fail("Reduced-motion render state styling missing");
}

if (exists("experience/experience.js")) {
  const js = read("experience/experience.js");
  for (const marker of [
    "window.__V7_DEBUG__",
    "IcosahedronGeometry",
    "OctahedronGeometry",
    "TetrahedronGeometry",
    "tunnelGroup",
    "archiveCores",
    "portalRings",
    "makeTradeCoreMachine",
    "makeMorseMachine",
    "makeEtteMachine",
    "makeIkoKnowItMachine",
    "makeGhostOpsMachine",
    "forgePanels",
    "launchCore",
    "cameraTarget",
    "setupPointer",
    "setupSceneStateTracking",
    "renderOnce",
    "v7Render",
    "v7Motion",
    "3D ENGINE // ONLINE",
    "isInAppThemeLocked"
  ]) {
    if (!js.includes(marker)) fail("JS marker missing: " + marker);
  }
}

if (failures.length) {
  console.error("\nV7 QA FAIL\n");
  failures.forEach(message => console.error("- " + message));
  process.exit(1);
}

console.log("\nICHARLES V7.4 FINAL THEME CONTRACT QA PASS\n");


if (exists("ghostops-theme-boot-v60.js")) {
  const boot = read("ghostops-theme-boot-v60.js");
  for (const marker of ["FBAN", "FBAV", "FB_IAB", "inAppBrowser", "visualQa"]) {
    if (!boot.includes(marker)) fail("Theme boot marker missing: " + marker);
  }
}

if (exists("ghostops-v60.js")) {
  const publicTheme = read("ghostops-v60.js");
  if (!publicTheme.includes("isInAppLocked")) fail("Public in-app theme lock missing");
  if (!publicTheme.includes("Dark theme locked in in-app browser")) fail("Public in-app lock accessibility label missing");
}
