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
  "V7_SAFETY_POINT.json"
]) {
  if (!exists(rel)) fail("Missing " + rel);
}

if (exists("experience/index.html")) {
  const html = read("experience/index.html");
  for (const marker of [
    "noindex,nofollow,noarchive",
    "data-v7-version=\"7.1.0\"",
    "SYSTEM 01 // IKO ONLINE",
    "SYSTEM 02 // THE BUILDER",
    "REQUEST A QUOTE",
    "3D ENGINE // BOOTING",
    "experience.css?v=710",
    "experience.js?v=710"
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
    "cameraTarget",
    "setupPointer",
    "3D ENGINE // ONLINE"
  ]) {
    if (!js.includes(marker)) fail("JS marker missing: " + marker);
  }
}

if (failures.length) {
  console.error("\nV7 QA FAIL\n");
  failures.forEach(message => console.error("- " + message));
  process.exit(1);
}

console.log("\nICHARLES V7.1 CINEMATIC CORE QA PASS\n");
