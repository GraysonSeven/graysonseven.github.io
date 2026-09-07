import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";

const root = process.cwd();
const failures = [];
const fail = msg => failures.push(msg);
const read = rel => fs.readFileSync(path.join(root, rel), "utf8");
const exists = rel => fs.existsSync(path.join(root, rel));

const required = [
  "iko-prime-v5.css",
  "iko-prime-v5.js",
  "assets/iko-prime/identity/iko-prime-logo-locked.png",
  "assets/iko-prime/identity/iko-prime-logo-512.webp",
  "assets/iko-prime/identity/iko-prime-logo-256.webp",
  "assets/iko-prime/identity/iko-prime-logo-128.png",
  "assets/iko-prime/identity/iko-prime-og.png",
  "assets/iko-prime/character/iko-prime-character.webp",
  "assets/iko-prime/hud/iko-orbital-reactor.webp",
  "assets/iko-prime/hud/iko-signal-rail.webp",
  "assets/iko-prime/hud/iko-portal-emblem.webp",
  "assets/iko-prime/backgrounds/home-command-center.webp",
  "assets/iko-prime/backgrounds/services-workspace.webp",
  "assets/iko-prime/backgrounds/try-apps-network.webp",
  "assets/iko-prime/backgrounds/portfolio-control-city.webp",
  "assets/iko-prime/backgrounds/studio-design-console.webp",
  "assets/iko-prime/backgrounds/about-skyline.webp",
  "assets/iko-prime/backgrounds/contact-horizon.webp"
];
for (const file of required) if (!exists(file)) fail(`Missing V5 asset: ${file}`);

if (exists("assets/iko-prime/identity/iko-prime-logo-locked.png")) {
  const sha = crypto.createHash("sha256")
    .update(fs.readFileSync(path.join(root, "assets/iko-prime/identity/iko-prime-logo-locked.png")))
    .digest("hex").toUpperCase();
  if (sha !== "0C224033CC16D2B19D2ECCF27631E948DB8B551863D3EB4EF626953E70728044") fail(`IKO locked-logo hash mismatch: ${sha}`);
}

const htmlFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
    if ([".git","node_modules"].includes(entry.name)) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (p.endsWith(".html")) htmlFiles.push(p);
  }
}
walk(root);

for (const file of htmlFiles) {
  const rel = path.relative(root, file).replaceAll("\\","/");
  const html = fs.readFileSync(file,"utf8");
  if (!html.includes("/iko-prime-v5.css?v=1")) fail(`V5 CSS missing from ${rel}`);
  if (!html.includes("/iko-prime-v5.js?v=1")) fail(`V5 JS missing from ${rel}`);
  if (/cyberpunk-part[1-4]\.(?:css|js)/i.test(html)) fail(`Legacy cyberpunk runtime still loaded by ${rel}`);
  if (/charles-lioc-logo-locked\.svg/i.test(html)) fail(`Old visible logo reference remains in ${rel}`);
  if (/charles-lioc-og\.png/i.test(html)) fail(`Old social/logo image reference remains in ${rel}`);
}

for (const old of [
  "cyberpunk-part1.css","cyberpunk-part1.js",
  "cyberpunk-part2.css","cyberpunk-part2.js",
  "cyberpunk-part3.css","cyberpunk-part3.js",
  "cyberpunk-part4.css","cyberpunk-part4.js"
]) {
  if (exists(old)) fail(`Retired legacy runtime still exists: ${old}`);
}
if (exists("assets/cyberpunk")) fail("Retired assets/cyberpunk directory still exists.");

if (exists("v4.js")) {
  const v4 = read("v4.js");
  if (v4.includes('className = "v4-hero-network"')) fail("Old V4 hero-network injection still active.");
  if (v4.includes('className = "v4-signal-field"')) fail("Old V4 signal-field injection still active.");
  if (v4.includes("/assets/charles-lioc-og.png")) fail("V4 panel still uses old logo image.");
}

if (!exists("script.js") || !/const\s+allowAmbientGrid\s*=\s*false\s*;/.test(read("script.js"))) {
  fail("Old animated ambient grid is not explicitly disabled.");
}

for (const manifest of ["site.webmanifest","portfolio/site.webmanifest"]) {
  if (!exists(manifest)) continue;
  const text = read(manifest);
  if (!text.includes("iko-prime-logo-512.webp")) fail(`IKO manifest icon missing from ${manifest}`);
  if (text.includes("charles-lioc-logo-locked.svg")) fail(`Old manifest logo remains in ${manifest}`);
}

for (const protectedFile of [
  "assets/charles-lioc-logo-locked.svg",
  "assets/apps/trade-core.png",
  "assets/apps/morsebound.png",
  "assets/apps/ette-planner.png"
]) {
  if (!exists(protectedFile)) fail(`Protected historical/product asset missing: ${protectedFile}`);
}

for (const js of ["iko-prime-v5.js","v4.js","experience.js","script.js"]) {
  if (!exists(js)) continue;
  const result = spawnSync(process.execPath, ["--check", path.join(root,js)], {encoding:"utf8"});
  if (result.status !== 0) fail(`JavaScript syntax failure in ${js}: ${result.stderr.trim()}`);
}

if (failures.length) {
  console.error("\nICHARLES V5.0 IKO QA FAIL\n");
  failures.forEach(x => console.error(`- ${x}`));
  process.exit(1);
}
console.log("\nICHARLES V5.0 IKO PRIME QA PASS\n");
console.log(`- Verified ${htmlFiles.length} HTML files use the new Iko runtime.`);
console.log("- Verified exact locked Iko source hash and optimized derivatives.");
console.log("- Verified old cyberpunk moving-graphics runtime is retired.");
console.log("- Verified old ambient grid and V4 network/signal injectors are disabled.");
console.log("- Verified manifests, protected app icons and historical locked logo remain intact.");
