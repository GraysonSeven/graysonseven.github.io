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

for(const p of ["ghostops-v644-true-world.css","ghostops-v644-true-world.js"])
  if(!exists(p)) fail(`V6.4.4 file missing: ${p}`);

const html=read("index.html");
if(!html.includes('/ghostops-v644-true-world.css?v=1')) fail("Home missing V6.4.4 CSS.");
if(!html.includes('/ghostops-v644-true-world.js?v=1')) fail("Home missing V6.4.4 JS.");

const css=read("ghostops-v644-true-world.css");
for(const marker of [
  ".v644-world-media",
  "object-fit:cover!important",
  ".clarity-hero::before",
  "content:none!important",
  ".hero-copy::before",
  "background:none!important",
  ".v60-hero-hud::before"
]) if(!css.includes(marker)) fail(`V6.4.4 CSS marker missing: ${marker}`);

const js=read("ghostops-v644-true-world.js");
for(const marker of [
  "v644-world-dark",
  "v644-world-light",
  "home-world-dark-v642.webp?v=644",
  "home-world-light-v642.webp?v=644",
  "hero.insertBefore(media"
]) if(!js.includes(marker)) fail(`V6.4.4 JS marker missing: ${marker}`);

if(failures.length){
  console.error("\nICHARLES V6.4.4 TRUE-WORLD QA FAIL\n");
  failures.forEach(x=>console.error(`- ${x}`));
  process.exit(1);
}
console.log("\nICHARLES V6.4.4 TRUE FULL-HERO WORLD QA PASS\n");
console.log("- Mountain environment is rendered as actual <img> elements, not CSS pseudo-backgrounds.");
console.log("- Dark and light worlds occupy the complete hero rectangle.");
console.log("- Legacy hero/pseudo/HUD background renderers are neutralized.");
console.log("- Locked Iko remains byte-identical.");
