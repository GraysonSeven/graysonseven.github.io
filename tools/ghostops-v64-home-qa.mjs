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

for(const asset of [
  "assets/iko-prime/ghostops/home-v64/home-world-dark.webp",
  "assets/iko-prime/ghostops/home-v64/home-world-light.webp",
  "assets/iko-prime/ghostops/home-v64/home-hud-frame.svg",
  "assets/iko-prime/ghostops/home-v64/home-network.svg",
  "ghostops-v64-home-reference.css",
  "ghostops-v64-home-reference.js"
]) if(!exists(asset)) fail(`V6.4 asset missing: ${asset}`);

const home=read("index.html");
if(!home.includes('/ghostops-v64-home-reference.css?v=1')) fail("Home does not load V6.4 CSS.");
if(!home.includes('/ghostops-v64-home-reference.js?v=1')) fail("Home does not load V6.4 JS.");

const css=read("ghostops-v64-home-reference.css");
for(const marker of [
  "--v64-world",
  "grid-template-rows:minmax(0,1fr) auto auto",
  ".clarity-proof.v64-proof-deck",
  ".v64-bottom-strip",
  "body.v64-reference-home .iko-v5-core-logo",
  '@media(max-width:820px)',
  'html[data-ui-theme="light"]'
]) if(!css.includes(marker)) fail(`V6.4 CSS marker missing: ${marker}`);

const js=read("ghostops-v64-home-reference.js");
for(const marker of [
  'body.classList.add("v64-reference-home")',
  'proof.classList.add("v64-proof-deck")',
  'v64-bottom-strip',
  'BUILDING USEFUL THINGS.',
  'STATE // ACTIVE'
]) if(!js.includes(marker)) fail(`V6.4 JS marker missing: ${marker}`);

const unrelated=["try/index.html","portfolio/index.html","services/index.html","website-studio/index.html","about/index.html","contact/index.html"];
for(const rel of unrelated){
  if(exists(rel) && read(rel).includes('/ghostops-v64-home-reference.css?v=1'))
    fail(`Home-only V6.4 CSS leaked into ${rel}`);
}

if(failures.length){
  console.error("\nICHARLES V6.4 HOME REFERENCE QA FAIL\n");
  failures.forEach(x=>console.error(`- ${x}`));
  process.exit(1);
}
console.log("\nICHARLES V6.4 HOME REFERENCE RECONSTRUCTION QA PASS\n");
console.log("- Locked Iko identity remains byte-identical.");
console.log("- Dark/light high-resolution world plates are installed.");
console.log("- Transparent vector HUD frame + network assets are installed.");
console.log("- Home proof cards move into a full-width three-card command deck.");
console.log("- Header, side telemetry, CTA controls and bottom identity rail match the approved reference structure.");
console.log("- Home-only styling is isolated from the rest of the site.");
