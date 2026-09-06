import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const fail = x => failures.push(x);
const exists = rel => fs.existsSync(path.join(root, rel));
const read = rel => fs.readFileSync(path.join(root, rel), "utf8");

const corePages = [
  "index.html",
  "services/index.html",
  "try/index.html",
  "portfolio/index.html",
  "website-studio/index.html",
  "about/index.html",
  "contact/index.html",
  "privacy/index.html",
  "404.html"
];

if (!exists("visual-system-v47.css")) fail("V4.7 visual-system CSS missing.");
if (!exists("visual-system-v47.js")) fail("V4.7 visual-system JavaScript missing.");

for (const p of corePages) {
  if (!exists(p)) continue;
  const html = read(p);
  if (!html.includes('/visual-system-v47.css?v=1')) {
    fail(`V4.7 stylesheet missing from ${p}`);
  }
  if (!html.includes('/visual-system-v47.js?v=1')) {
    fail(`V4.7 JavaScript missing from ${p}`);
  }
  for (const obsolete of [
    "nav-clarity-v461",
    "header-overlap-v462",
    "contrast-v463",
    "cta-rebalance-v464"
  ]) {
    if (html.includes(obsolete)) fail(`Obsolete ${obsolete} tag remains in ${p}`);
  }
}

for (const obsoleteFile of [
  "nav-clarity-v461.css",
  "nav-clarity-v461.js",
  "header-overlap-v462.css",
  "contrast-v463.css",
  "cta-rebalance-v464.css"
]) {
  if (exists(obsoleteFile)) fail(`Obsolete visual patch file still exists: ${obsoleteFile}`);
}

const visual = exists("visual-system-v47.css") ? read("visual-system-v47.css") : "";
for (const selector of [
  ".primary-btn",
  ".btn-primary",
  ".try-primary",
  ".live-open",
  ".studio-primary",
  ".v45-button.primary",
  ".launch-card b",
  ".v4-unified-nav a[aria-current=\"page\"]",
  "@media(max-width:1279px)"
]) {
  if (!visual.includes(selector)) fail(`V4.7 visual coverage missing: ${selector}`);
}

if (visual.includes("linear-gradient(100deg,#00efff,#5ec7ff)")) {
  fail("Old sky-blue live-open gradient leaked into V4.7.");
}

const publicHtml = corePages.filter(exists).map(read).join("\n");
for (const staleCopy of [
  "WHAT YOU GET // NO INVENTED CLAIMS",
  "NO FAKE PROOF",
  "NOT A CLAIM COUNTER",
  "The bright button opens",
  "Start with an live web app",
  "PUBLIC EMAIL CONNECTED // OTHER CHANNELS PENDING",
  "NO FAKE CONTACT DETAILS ADDED",
  "TO BE CONNECTED"
]) {
  if (publicHtml.includes(staleCopy)) fail(`Stale public copy remains: ${staleCopy}`);
}

if (!read("v4.js").includes('["SERVICES", "/services/"]')) {
  fail("Services is not part of the canonical V4 navigation source.");
}
if (!read("v4.js").includes("PROJECT INQUIRIES // OPEN")) {
  fail("V4 slide panel does not use project-inquiry wording.");
}

if (failures.length) {
  console.error("\nICHARLES V4.7 VISUAL QA FAIL\n");
  failures.forEach(x => console.error(`- ${x}`));
  process.exit(1);
}

console.log("\nICHARLES V4.7 VISUAL QA PASS");
console.log("- One authoritative visual layer");
console.log("- Dark high-contrast CTA system");
console.log("- Collision-proof header behavior");
console.log("- Single active navigation state");
console.log("- Professional proof language");
console.log("- Obsolete V4.6.1–V4.6.4 layers removed");
