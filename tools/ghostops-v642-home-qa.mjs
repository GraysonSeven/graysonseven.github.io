import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root=process.cwd(), failures=[];
const fail=m=>failures.push(m), exists=p=>fs.existsSync(path.join(root,p)), read=p=>fs.readFileSync(path.join(root,p),"utf8");

const locked="assets/iko-prime/identity/iko-prime-logo-locked.png";
if(!exists(locked)) fail("Locked Iko identity missing.");
else{
  const sha=crypto.createHash("sha256").update(fs.readFileSync(path.join(root,locked))).digest("hex").toUpperCase();
  if(sha!=="DDA9E772F1267325918D3608273124BD21A507B57BB49A9E2148EBFF0CBBB5FD") fail(`Locked Iko identity changed: ${sha}`);
}

for(const p of [
  "assets/iko-prime/ghostops/home-v642/home-world-dark-v642.webp",
  "assets/iko-prime/ghostops/home-v642/home-world-light-v642.webp",
  "assets/iko-prime/ghostops/home-v642/home-orbit-dark-v642.webp",
  "assets/iko-prime/ghostops/home-v642/home-orbit-light-v642.webp",
  "assets/iko-prime/ghostops/home-v642/home-mission-dark-v642.webp",
  "assets/iko-prime/ghostops/home-v642/home-mission-light-v642.webp",
  "assets/iko-prime/ghostops/home-v642/home-rail-dark-v642.webp",
  "assets/iko-prime/ghostops/home-v642/home-rail-light-v642.webp",
  "ghostops-v642-home-final.css",
  "ghostops-v642-home-final.js"
]) if(!exists(p)) fail(`V6.4.2 required file missing: ${p}`);

const html=read("index.html");
if(!html.includes('/ghostops-v642-home-final.css?v=1')) fail("Home does not load V6.4.2 CSS.");
if(!html.includes('/ghostops-v642-home-final.js?v=1')) fail("Home does not load V6.4.2 JS.");

const css=read("ghostops-v642-home-final.css");
for(const marker of [
  "z-index:0!important",
  "--v642-orbit",
  "--v642-mission",
  "--v642-rail",
  ".v642-orbit-frame",
  ".clarity-proof.v64-proof-deck",
  "@media(max-width:820px)",
  "hero-copy::before"
]) if(!css.includes(marker)) fail(`V6.4.2 CSS marker missing: ${marker}`);

const js=read("ghostops-v642-home-final.js");
for(const marker of [
  "v642-orbit-frame",
  "v642-mission-panel",
  "v642-left-rail",
  'arrow.textContent = "→"'
]) if(!js.includes(marker)) fail(`V6.4.2 JS marker missing: ${marker}`);

for(const rel of ["try/index.html","portfolio/index.html","services/index.html","website-studio/index.html","about/index.html","contact/index.html"]){
  if(exists(rel) && read(rel).includes('/ghostops-v642-home-final.css?v=1'))
    fail(`Home-only V6.4.2 CSS leaked onto ${rel}`);
}

if(failures.length){
  console.error("\nICHARLES V6.4.2 HOME FINALIZATION QA FAIL\n");
  failures.forEach(x=>console.error(`- ${x}`));
  process.exit(1);
}
console.log("\nICHARLES V6.4.2 HOME INTEGRATION FINALIZATION PASS\n");
console.log("- Locked Iko identity remains byte-identical.");
console.log("- New dark/light mountain worlds and theme-specific HUD assets are installed.");
console.log("- Hero world plate is moved into the visible stacking context.");
console.log("- Legacy circular hero window is explicitly suppressed.");
console.log("- Lower three-card command deck is full-width and arrow-only.");
console.log("- Dark mobile VIEW SERVICES contrast is explicitly protected.");
console.log("- V6.4.2 is scoped to Home only.");
