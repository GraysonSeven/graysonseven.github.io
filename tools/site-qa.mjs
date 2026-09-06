import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const failures = [];
const notes = [];

const requiredPages = [
  "index.html",
  "try/index.html",
  "portfolio/index.html",
  "portfolio/projects/trade-core.html",
  "portfolio/projects/trade-core-custom-business.html",
  "portfolio/projects/morsebound.html",
  "portfolio/projects/ette-planner.html",
  "services/index.html",
  "website-studio/index.html",
  "about/index.html",
  "contact/index.html",
  "privacy/index.html",
  "404.html",
];

const schemaPages = requiredPages.filter(x =>
  !["privacy/index.html", "404.html"].includes(x)
);

const read = rel => fs.readFileSync(path.join(root, rel), "utf8");
const exists = rel => fs.existsSync(path.join(root, rel));
const fail = msg => failures.push(msg);
const note = msg => notes.push(msg);

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if ([".git", "node_modules"].includes(entry.name)) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

for (const p of requiredPages) {
  if (!exists(p)) fail(`Missing required page: ${p}`);
}
for (const p of ["projects/index.html", "lab/index.html", "website-request-sent/index.html", "project-inquiry-sent/index.html"]) {
  if (!exists(p)) fail(`Missing support page: ${p}`);
}

const allFiles = walk(root);
const htmlFiles = allFiles.filter(f => f.endsWith(".html"));
const jsFiles = allFiles.filter(f => f.endsWith(".js") || f.endsWith(".mjs"));

function stripUrl(raw) {
  const s = raw.trim();
  if (!s || s.startsWith("#")) return null;
  if (/^(?:https?:|mailto:|tel:|javascript:|data:|blob:|\/\/)/i.test(s)) return null;
  const clean = s.split("#")[0].split("?")[0];
  if (!clean) return null;
  try { return decodeURIComponent(clean); } catch { return clean; }
}

function resolveLocal(htmlFile, raw) {
  const clean = stripUrl(raw);
  if (!clean) return null;
  let target;
  if (clean.startsWith("/")) target = path.join(root, clean.slice(1));
  else target = path.resolve(path.dirname(htmlFile), clean);

  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    target = path.join(target, "index.html");
  } else if (!path.extname(target) && !fs.existsSync(target)) {
    const asIndex = path.join(target, "index.html");
    if (fs.existsSync(asIndex)) target = asIndex;
  }
  return target;
}

const attrRe = /\b(?:href|src)\s*=\s*(["'])(.*?)\1/gi;
for (const file of htmlFiles) {
  const rel = path.relative(root, file).replaceAll("\\", "/");
  const html = fs.readFileSync(file, "utf8");
  let m;
  while ((m = attrRe.exec(html))) {
    const target = resolveLocal(file, m[2]);
    if (target && !fs.existsSync(target)) fail(`Broken local reference in ${rel}: ${m[2]}`);
  }
}

for (const p of requiredPages.filter(x => x !== "404.html")) {
  if (!exists(p)) continue;
  const html = read(p);
  if (!/<title>[^<]+<\/title>/i.test(html)) fail(`Missing title: ${p}`);
  if (!/<meta\s+name=["']description["'][^>]+content=["'][^"']+/i.test(html) &&
      !/<meta\s+content=["'][^"']+["'][^>]+name=["']description["']/i.test(html)) {
    fail(`Missing meta description: ${p}`);
  }
  if (!/<link\s+rel=["']canonical["']/i.test(html) &&
      !/<link[^>]+rel=["']canonical["']/i.test(html)) {
    fail(`Missing canonical URL: ${p}`);
  }
}

for (const p of schemaPages) {
  if (!exists(p)) continue;
  const html = read(p);
  const blocks = [...html.matchAll(
    /<script\s+type=["']application\/ld\+json["']\s+data-icharles-schema=["']v44["']>([\s\S]*?)<\/script>/gi
  )];
  if (!blocks.length) {
    fail(`Missing V4.4 structured data: ${p}`);
    continue;
  }
  for (const block of blocks) {
    try { JSON.parse(block[1]); }
    catch (e) { fail(`Invalid JSON-LD in ${p}: ${e.message}`); }
  }
}

const publicHtml = htmlFiles.map(f => fs.readFileSync(f, "utf8")).join("\n");
if (/\bCOMPADRES\b/i.test(publicHtml)) fail("Forbidden client-specific Compadres branding found in public HTML.");
if (exists("try/try.js")) fail("Old simulated demo JavaScript try/try.js still exists.");

if (!exists("assets/apps/trade-core.png")) fail("Trade Core icon missing.");
if (!exists("assets/apps/morsebound.png")) fail("Morsebound icon missing.");
if (!exists("assets/apps/ette-planner.png")) fail("ETTE Planner icon missing.");

if (exists("try/index.html")) {
  const live = read("try/index.html");
  for (const url of [
    "https://icharles-invsys.web.app/",
    "https://graysonseven.github.io/Morsebound/",
    "https://ette-planner-143288371627.web.app/",
  ]) {
    if (!live.includes(url)) fail(`Real app URL missing from Apps page: ${url}`);
  }
}

if (exists("website-studio/index.html")) {
  const studio = read("website-studio/index.html");
  if (!studio.includes("https://formsubmit.co/icharles.development@gmail.com")) {
    fail("Website Studio FormSubmit endpoint missing.");
  }
  if (!studio.includes("NO EXTRA DESIGN FEE")) {
    fail("Website Studio no-extra-design-fee wording missing.");
  }
}

if (exists("contact/index.html")) {
  const contact = read("contact/index.html");
  if (!contact.includes('class="v48-project-form"')) fail("General project inquiry form missing.");
  if (!contact.includes("https://formsubmit.co/icharles.development@gmail.com")) {
    fail("General project inquiry FormSubmit endpoint missing.");
  }
  if (!contact.includes("project-inquiry-sent/")) fail("General inquiry success destination missing.");
}

if (exists("experience.js") &&
    !/const\s+allowParticles\s*=\s*false\s*;/.test(read("experience.js"))) {
  fail("Particle network is not explicitly disabled.");
}

if (exists("v4.js") && !read("v4.js").includes("V4.2.3 SLIDE PANEL NAVIGATION")) {
  fail("V4.2.3 slide-panel navigation marker missing.");
}

if (exists("portfolio/assets/charles-lioc-logo-locked.svg") ||
    exists("portfolio/assets/favicon.svg")) {
  fail("Duplicate 2.4 MB portfolio logo copies still exist.");
}

if (!exists("_headers")) fail("Cloudflare _headers file missing.");
else {
  const h = read("_headers");
  for (const expected of [
    "X-Content-Type-Options: nosniff",
    "Referrer-Policy: strict-origin-when-cross-origin",
    "Permissions-Policy:",
    "Cache-Control:",
  ]) {
    if (!h.includes(expected)) fail(`Missing production header rule: ${expected}`);
  }
}

if (!exists(".well-known/security.txt")) fail("security.txt missing.");

if (exists("sitemap.xml")) {
  const sitemap = read("sitemap.xml");
  for (const p of [
    "https://icharles.pages.dev/",
    "https://icharles.pages.dev/try/",
    "https://icharles.pages.dev/portfolio/",
    "https://icharles.pages.dev/services/",
    "https://icharles.pages.dev/website-studio/",
    "https://icharles.pages.dev/about/",
    "https://icharles.pages.dev/contact/",
  ]) {
    if (!sitemap.includes(`<loc>${p}</loc>`)) fail(`Sitemap entry missing: ${p}`);
  }
} else fail("sitemap.xml missing.");

if (!exists("conversion-v45.css")) fail("V4.5 conversion CSS missing.");
if (!exists("conversion-v45.js")) fail("V4.5 conversion JavaScript missing.");

if (exists("readability-v46.css")) {
  fail("V4.6 readability CSS should be merged into the authoritative visual system in V4.8.");
}

if (!exists("visual-system-v47.css")) fail("Authoritative visual-system CSS missing.");
if (!exists("visual-system-v47.js")) fail("Visual-system JavaScript missing.");
if (exists("visual-system-v47.css")) {
  const visual = read("visual-system-v47.css");
  if (!visual.includes("iCHARLES V4.8 FINAL CLEANUP + WORK UPDATES")) {
    fail("V4.8 final visual-system marker missing.");
  }
  for (const selector of [
    ".privacy-actions a:first-child",
    ".sent-actions a:first-child",
    ".case-try-demo",
    ".v48-project-form",
    ".skip-link"
  ]) {
    if (!visual.includes(selector)) fail(`V4.8 visual coverage missing: ${selector}`);
  }
}

const canonicalNavHrefs = [
  'href="/"',
  'href="/try/"',
  'href="/portfolio/"',
  'href="/services/"',
  'href="/website-studio/"',
  'href="/about/"',
  'href="/contact/"'
];
for (const p of [
  "index.html",
  "try/index.html",
  "portfolio/index.html",
  "services/index.html",
  "website-studio/index.html",
  "about/index.html",
  "contact/index.html",
  "privacy/index.html",
  "projects/index.html",
  "lab/index.html",
  "project-inquiry-sent/index.html"
]) {
  if (!exists(p)) continue;
  const html = read(p);
  const header = html.match(/<header\b[\s\S]*?<\/header>/i)?.[0] || "";
  for (const href of canonicalNavHrefs) {
    if (!header.includes(href)) fail(`Native canonical navigation missing ${href} in ${p}`);
  }
  if (!html.includes("/visual-system-v47.css?v=2")) fail(`V4.8 visual CSS cache version missing from ${p}`);
  if (!html.includes("/v4.js?v=7")) fail(`V4.8 v4.js cache version missing from ${p}`);
  if (html.includes("readability-v46.css")) fail(`Old readability stylesheet tag remains in ${p}`);
}

for (const [p, version] of [
  ["portfolio/projects/trade-core.html", "2.7.0+61"],
  ["portfolio/projects/morsebound.html", "1.2.0+15"],
  ["portfolio/projects/ette-planner.html", "3.0.0+27"],
]) {
  if (exists(p) && !read(p).includes(version)) fail(`Current work version missing from ${p}: ${version}`);
}

if (exists("lab/index.html")) {
  const lab = read("lab/index.html");
  if (!lab.includes("IKO KNOW IT")) fail("Iko Know It current-development entry missing from Lab.");
  if (!lab.includes("GHOST OPS")) fail("Ghost Ops current-development entry missing from Lab.");
}
if (exists("projects/index.html") && !read("projects/index.html").includes("CURRENT DEVELOPMENT")) {
  fail("Current development entry missing from project directory.");
}

for (const stale of [
  "WEBSITE CLIENTS // OPEN",
  "WEBSITE CLIENTS ARE OPEN",
  "CURRENTLY LOOKING FOR CLIENTS",
  "EMPTY ON PURPOSE.",
  "BEING DOCUMENTED",
  "ARCHIVE GROWING",
  "RESUME / CV",
  "TO BE ADDED"
]) {
  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, "utf8");
    if (html.includes(stale)) {
      fail(`Stale/incomplete public wording remains in ${path.relative(root, file).replaceAll("\\", "/")}: ${stale}`);
    }
  }
}

if (exists("404.html")) {
  const e = read("404.html");
  if (/\bLab\b/.test(e)) fail("404 page still promotes the unfinished Lab.");
}

for (const p of [
  "portfolio/projects/trade-core.html",
  "portfolio/projects/trade-core-custom-business.html",
  "portfolio/projects/morsebound.html",
  "portfolio/projects/ette-planner.html"
]) {
  if (exists(p) && !read(p).includes('class="skip-link"')) {
    fail(`Accessible skip link class missing from ${p}`);
  }
}

for (const file of jsFiles) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) {
    fail(`JavaScript syntax error in ${path.relative(root, file)}:\n${result.stderr.trim()}`);
  }
}

note(`Checked ${htmlFiles.length} HTML files.`);
note(`Checked ${jsFiles.length} JavaScript files.`);
note("Checked links/assets, SEO basics, JSON-LD, canonical native navigation, real app URLs, V4.8 work updates, FormSubmit paths, protected branding, security headers and accessibility baselines.");

if (failures.length) {
  console.error("\nICHARLES SITE QA FAIL\n");
  for (const f of failures) console.error(`- ${f}`);
  process.exit(1);
}

console.log("\nICHARLES SITE QA PASS\n");
for (const n of notes) console.log(`- ${n}`);
