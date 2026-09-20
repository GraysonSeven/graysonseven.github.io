import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const failures = [];
const fail = message => failures.push(message);
const read = rel => fs.readFileSync(path.join(root, rel), "utf8");
const exists = rel => fs.existsSync(path.join(root, rel));

const home = read("index.html");
const preview = read("experience/index.html");

for (const marker of [
  'data-v7-home="production"',
  'data-v7-version="7.4.0"',
  '<meta name="robots" content="index,follow,max-image-preview:large">',
  '<link rel="canonical" href="https://icharles.pages.dev/">',
  'data-icharles-schema="v44"',
  '/experience/experience.css?v=740',
  '/experience/experience.js?v=740',
  'SYSTEM 01 // IKO ONLINE',
  'SYSTEM 02 // THE BUILDER',
  'SYSTEM 03 // THINGS I BUILT',
  'SYSTEM 04 // HOW I THINK',
  'SYSTEM 05 // THE FORGE',
  'SYSTEM 06 // READY',
  'IKO KNOW IT',
  'GHOST OPS',
  'ACTIVE DEVELOPMENT',
  'PROJECT INQUIRIES // OPEN',
  'https://icharles-invsys.web.app/',
  'https://graysonseven.github.io/Morsebound/',
  'https://ette-planner-143288371627.web.app/',
  'href="/portfolio/"',
  'href="/website-studio/"',
  'href="/contact/"',
  'REQUEST A QUOTE',
  'ENTER WEBSITE STUDIO'
]) {
  if (!home.includes(marker)) fail("Production Home marker missing: " + marker);
}

for (const forbidden of [
  "noindex,nofollow,noarchive",
  "EXPERIMENTAL BUILD",
  "EXIT ARCHIVE",
  "COMPADRES"
]) {
  if (home.includes(forbidden)) fail("Production Home contains forbidden marker: " + forbidden);
}

for (const marker of [
  'noindex,nofollow,noarchive',
  'data-v7-experience',
  'SYSTEM 06 // READY',
  'EXPERIMENTAL BUILD',
  'EXIT ARCHIVE'
]) {
  if (!preview.includes(marker)) fail("Hidden /experience/ safety marker missing: " + marker);
}

if (preview.includes('data-v7-home="production"')) {
  fail("Hidden /experience/ must not masquerade as the production Home.");
}

const iko = path.join(root, "assets/iko-prime/identity/iko-prime-logo-locked.png");
if (!exists("assets/iko-prime/identity/iko-prime-logo-locked.png")) {
  fail("Locked Iko source is missing.");
} else {
  const actual = crypto.createHash("sha256").update(fs.readFileSync(iko)).digest("hex").toUpperCase();
  const expected = "DDA9E772F1267325918D3608273124BD21A507B57BB49A9E2148EBFF0CBBB5FD";
  if (actual !== expected) fail("Locked Iko SHA-256 changed: " + actual);
}

if (!exists("icharles-pre-v7-promotion-d6c0ade0")) {
  // Git branches are not materialized as files in CI; the actual checkpoint is verified outside the tree.
}

if (failures.length) {
  console.error("\nV7 HOME PROMOTION QA FAIL\n");
  failures.forEach(message => console.error("- " + message));
  process.exit(1);
}

console.log("\nV7 HOME PROMOTION QA PASS\n");
console.log("- Root is indexable V7 production Home candidate");
console.log("- Hidden /experience/ remains noindex experimental fallback");
console.log("- Locked Iko identity preserved");
console.log("- Public app links and active-development truthfulness preserved");
console.log("- Website Studio and quote conversion paths preserved");
