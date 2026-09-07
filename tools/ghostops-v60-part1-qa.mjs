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

for (const asset of [
  "assets/iko-prime/ghostops/home-skyline-dark.webp",
  "assets/iko-prime/ghostops/home-skyline-light.webp",
  "assets/iko-prime/ghostops/home-horizon-dark.webp",
  "assets/iko-prime/ghostops/home-horizon-light.webp",
  "ghostops-theme-boot-v60.js",
  "ghostops-v60.css",
  "ghostops-v60.js"
]) {
  if (!exists(asset)) fail(`V6 Part 1 asset missing: ${asset}`);
  else if (fs.statSync(path.join(root,asset)).size < 300 && asset.endsWith(".webp"))
    fail(`V6 image asset is unexpectedly tiny: ${asset}`);
}

const css = read("ghostops-v60.css");
const js = read("ghostops-v60.js");
const boot = read("ghostops-theme-boot-v60.js");

for (const marker of [
  'html[data-ui-theme="dark"]',
  'html[data-ui-theme="light"]',
  '.v60-theme-toggle',
  'body.v60-ghostops-home .clarity-hero',
  '.v60-hero-hud',
  '.v60-hero-motto'
]) if (!css.includes(marker)) fail(`V6 CSS marker missing: ${marker}`);

for (const marker of [
  'icharles-ui-theme',
  'home-skyline-dark.webp?v=60',
  'home-skyline-light.webp?v=60',
  'BUILD · CREATE · SOLVE',
  'v60-theme-toggle'
]) if (!js.includes(marker)) fail(`V6 JS marker missing: ${marker}`);

if (!boot.includes('prefers-color-scheme: light'))
  fail("Theme boot script does not honor system theme.");

const htmlFiles = [];
function walk(dir){
  for (const e of fs.readdirSync(dir,{withFileTypes:true})) {
    if ([".git","node_modules"].includes(e.name)) continue;
    const p = path.join(dir,e.name);
    if (e.isDirectory()) walk(p);
    else if (p.endsWith(".html")) htmlFiles.push(p);
  }
}
walk(root);

for (const file of htmlFiles){
  const rel = path.relative(root,file).replaceAll("\\","/");
  const html = fs.readFileSync(file,"utf8");
  if (!html.includes('/ghostops-theme-boot-v60.js?v=1'))
    fail(`Theme boot missing from ${rel}`);
  if (!html.includes('/ghostops-v60.css?v=1'))
    fail(`V6 CSS missing from ${rel}`);
  if (!html.includes('/ghostops-v60.js?v=1'))
    fail(`V6 JS missing from ${rel}`);
}

const home = read("index.html");
for (const prohibited of ["50+","100% CLIENT FOCUSED","PROJECTS DELIVERED"]) {
  if (home.includes(prohibited)) fail(`Unverified/fake proof text introduced: ${prohibited}`);
}
if (!home.includes("PROJECT INQUIRIES ARE OPEN")) fail("Home inquiry status missing.");
if (!home.includes("/assets/iko-prime/identity/iko-prime-logo-512.webp"))
  fail("Home locked-Iko derivative reference missing.");

if (failures.length){
  console.error("\nICHARLES V6.0 PART 1 GHOST OPS QA FAIL\n");
  failures.forEach(x=>console.error(`- ${x}`));
  process.exit(1);
}

console.log("\nICHARLES V6.0 PART 1 GHOST OPS QA PASS\n");
console.log(`- Verified ${htmlFiles.length} HTML files load the dark/light Ghost Ops theme foundation.`);
console.log("- Locked main Iko identity hash remains exact.");
console.log("- Home uses high-resolution skyline/horizon atmosphere with no baked-in fake content.");
console.log("- Header/footer/theme toggle and Ghost Ops home HUD are installed.");
console.log("- No fabricated project-count or client-success metrics were introduced.");
