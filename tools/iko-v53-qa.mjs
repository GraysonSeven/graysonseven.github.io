import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const failures = [];
const fail = m => failures.push(m);
const exists = p => fs.existsSync(path.join(root,p));
const read = p => fs.readFileSync(path.join(root,p),"utf8");

const locked = "assets/iko-prime/identity/iko-prime-logo-locked.png";
if (!exists(locked)) fail("Locked Iko identity missing.");
else {
  const sha = crypto.createHash("sha256")
    .update(fs.readFileSync(path.join(root,locked)))
    .digest("hex").toUpperCase();
  if (sha !== "DDA9E772F1267325918D3608273124BD21A507B57BB49A9E2148EBFF0CBBB5FD") fail(`Locked Iko identity changed: ${sha}`);
}

for (const obsolete of [
  "iko-prime-v51.css",
  "iko-prime-v52.css",
  "tools/iko-v5-qa.mjs",
  "tools/iko-v51-qa.mjs",
  "tools/iko-v52-qa.mjs"
]) {
  if (exists(obsolete)) fail(`Obsolete layered V5 file still exists: ${obsolete}`);
}

if (!exists("iko-prime-v5.css")) fail("Consolidated Iko CSS missing.");
if (!exists("iko-prime-v5.js")) fail("Iko runtime missing.");

const css = read("iko-prime-v5.css");
if (!css.includes("V5.3 — CONSOLIDATED IKO PRODUCTION SYSTEM"))
  fail("Consolidated V5.3 CSS marker missing.");
if (!css.includes("width:56px!important"))
  fail("56px desktop header Iko rule missing.");
if (!css.includes("width:min(44vw,590px)"))
  fail("Large main Iko rule missing.");
if (css.includes("width:min(25vw,330px)"))
  fail("Old undersized main-Iko rule remains active.");

const js = read("iko-prime-v5.js");
if (js.includes("iko-prime-logo-256.webp"))
  fail("Runtime still references 256px Iko artwork.");
if (!js.includes("iko-prime-logo-1024.webp?v=53"))
  fail("Home identity is not using 1024px V5.3 asset.");
if (!js.includes("iko-prime-logo-512.webp?v=53"))
  fail("Compact identity is not using 512px V5.3 asset.");
if (!js.includes('bg.fetchPriority = "low"'))
  fail("Atmospheric background is not low-priority.");
if (!js.includes('logo.fetchPriority = "high"'))
  fail("Main Iko is not prioritized for loading.");
if (!js.includes('logo.loading = "eager"'))
  fail("Main Iko is not explicitly eager-loaded.");

const htmlFiles = [];
function walk(dir){
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    if([".git","node_modules"].includes(e.name)) continue;
    const p=path.join(dir,e.name);
    if(e.isDirectory()) walk(p);
    else if(p.endsWith(".html")) htmlFiles.push(p);
  }
}
walk(root);

for(const file of htmlFiles){
  const rel = path.relative(root,file).replaceAll("\\","/");
  const html = fs.readFileSync(file,"utf8");

  if (!html.includes('/iko-prime-v5.css?v=4'))
    fail(`Consolidated V5.3 CSS missing from ${rel}`);
  if (!html.includes('/iko-prime-v5.js?v=4'))
    fail(`V5.3 runtime cache tag missing from ${rel}`);

  if (html.includes("iko-prime-v51.css") || html.includes("iko-prime-v52.css"))
    fail(`Old Iko CSS layers still referenced by ${rel}`);

  if (html.includes("iko-prime-logo-256.webp"))
    fail(`Low-resolution 256px Iko reference remains in ${rel}`);
}

for (const rel of ["portfolio/index.html","about/index.html"]) {
  if (!exists(rel)) continue;
  const html = read(rel);
  if (!html.includes("iko-prime-logo-1024.webp?v=53"))
    fail(`Large identity surface does not use 1024px Iko: ${rel}`);
}

for (const asset of [
  "assets/iko-prime/identity/iko-prime-logo-1024.webp",
  "assets/iko-prime/identity/iko-prime-logo-512.webp",
  "assets/iko-prime/hud/iko-orbital-reactor.webp",
  "assets/iko-prime/hud/iko-signal-rail.webp",
  "assets/iko-prime/hud/iko-hud-frame.webp",
  "assets/iko-prime/hud/iko-network-emblem.webp",
  "assets/iko-prime/character/iko-prime-character.webp",
  "assets/iko-prime/decorative/iko-crystal-slash.webp"
]) {
  if (!exists(asset)) fail(`Required high-resolution Iko asset missing: ${asset}`);
}

if (failures.length){
  console.error("\nICHARLES V5.3 CONSOLIDATED IKO QA FAIL\n");
  failures.forEach(x=>console.error(`- ${x}`));
  process.exit(1);
}

console.log("\nICHARLES V5.3 CONSOLIDATED IKO PRODUCTION QA PASS\n");
console.log(`- Verified ${htmlFiles.length} HTML files use one authoritative Iko CSS layer.`);
console.log("- Locked main Iko logo hash remains exact.");
console.log("- No 256px Iko display references remain.");
console.log("- Large identity surfaces use the 1024px derivative.");
console.log("- Atmospheric artwork is lower priority than the main identity.");
console.log("- V5.1/V5.2 temporary CSS and QA layers are retired.");
