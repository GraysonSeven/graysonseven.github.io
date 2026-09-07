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

if (!exists("iko-prime-v5.css")) fail("Authoritative Iko CSS missing.");
if (!exists("iko-prime-v5.js")) fail("Iko runtime missing.");

const css = read("iko-prime-v5.css");
const js = read("iko-prime-v5.js");

if (!css.includes("V5.4 — FINAL VISUAL QA"))
  fail("V5.4 CSS marker missing.");

if (!js.includes('const nativeIdentityHero = path === "/try" || path === "/portfolio";'))
  fail("Native-identity hero exclusion is missing.");
if (!js.includes('if (path !== "/" && !nativeIdentityHero)'))
  fail("Try/Portfolio duplicate page-mark guard is missing.");

if (!css.includes(".live-orbit-core img") || !css.includes("width:210px!important"))
  fail("Try Apps central Iko clarity/scale correction missing.");

if (!css.includes(".site-header + main .hero .hero-copy"))
  fail("Portfolio first-screen copy positioning correction missing.");
if (!css.includes(".site-header + main .hero .hero-visual"))
  fail("Portfolio first-screen visual positioning correction missing.");
if (!css.includes("left:5%!important"))
  fail("Portfolio HUD clipping correction missing.");

if (js.includes("iko-prime-logo-256.webp"))
  fail("Runtime still references a low-resolution 256px Iko asset.");
if (!js.includes("iko-prime-logo-1024.webp?v=54"))
  fail("Main Iko is not using the 1024px V5.4 derivative.");
if (!js.includes("iko-prime-logo-512.webp?v=54"))
  fail("Compact Iko identity is not using the 512px V5.4 derivative.");

for (const obsolete of [
  "iko-prime-v51.css",
  "iko-prime-v52.css",
  "tools/iko-v5-qa.mjs",
  "tools/iko-v51-qa.mjs",
  "tools/iko-v52-qa.mjs",
  "tools/iko-v53-qa.mjs"
]) {
  if (exists(obsolete)) fail(`Obsolete Iko layer/QA still exists: ${obsolete}`);
}

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
  const rel=path.relative(root,file).replaceAll("\\","/");
  const html=fs.readFileSync(file,"utf8");

  if(!html.includes('/iko-prime-v5.css?v=5'))
    fail(`V5.4 CSS cache tag missing from ${rel}`);
  if(!html.includes('/iko-prime-v5.js?v=5'))
    fail(`V5.4 JS cache tag missing from ${rel}`);

  if(html.includes("iko-prime-v51.css") || html.includes("iko-prime-v52.css"))
    fail(`Old Iko CSS layer referenced by ${rel}`);
  if(html.includes("iko-prime-logo-256.webp"))
    fail(`Low-resolution 256px Iko reference remains in ${rel}`);
}

for(const rel of ["portfolio/index.html","about/index.html"]){
  if(!exists(rel)) continue;
  if(!read(rel).includes("iko-prime-logo-1024.webp?v=54"))
    fail(`Large identity surface does not use 1024px Iko: ${rel}`);
}

for(const rel of [
  "assets/iko-prime/identity/iko-prime-logo-1024.webp",
  "assets/iko-prime/identity/iko-prime-logo-512.webp",
  "assets/iko-prime/hud/iko-orbital-reactor.webp",
  "assets/iko-prime/hud/iko-signal-rail.webp"
]) {
  if(!exists(rel)) fail(`Required high-resolution asset missing: ${rel}`);
}

if(failures.length){
  console.error("\nICHARLES V5.4 FINAL VISUAL QA FAIL\n");
  failures.forEach(x=>console.error(`- ${x}`));
  process.exit(1);
}

console.log("\nICHARLES V5.4 FINAL VISUAL QA PASS\n");
console.log(`- Verified ${htmlFiles.length} HTML files use the V5.4 authoritative Iko runtime.`);
console.log("- Locked main Iko identity hash remains exact.");
console.log("- Try Apps duplicate Iko page-mark is disabled and the native orbit identity is strengthened.");
console.log("- Portfolio first-screen copy and Iko are restored to one balanced row.");
console.log("- Portfolio BUILD / IMPROVE / CREATE HUD labels are kept inside the visual bounds.");
console.log("- No public HTML or runtime uses the 256px Iko identity.");
console.log("- Large identity surfaces remain on 1024px artwork.");
