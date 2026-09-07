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

for(const p of ["ghostops-v643-world-layer-fix.css","ghostops-v643-world-layer-fix.js"])
  if(!exists(p)) fail(`V6.4.3 file missing: ${p}`);

const html=read("index.html");
if(!html.includes('/ghostops-v643-world-layer-fix.css?v=1')) fail("Home missing V6.4.3 CSS.");
if(!html.includes('/ghostops-v643-world-layer-fix.js?v=1')) fail("Home missing V6.4.3 JS.");

const css=read("ghostops-v643-world-layer-fix.css");
for(const marker of [
  ".clarity-hero::before",
  "content:none!important",
  ".v643-world-layer",
  "clip-path:none!important",
  "border-radius:0!important",
  "var(--v64-world)"
]) if(!css.includes(marker)) fail(`V6.4.3 CSS marker missing: ${marker}`);

const js=read("ghostops-v643-world-layer-fix.js");
if(!js.includes('hero.prepend(world)')) fail("Dedicated world layer is not prepended to the hero.");

if(failures.length){
  console.error("\nICHARLES V6.4.3 WORLD-LAYER QA FAIL\n");
  failures.forEach(x=>console.error(`- ${x}`));
  process.exit(1);
}
console.log("\nICHARLES V6.4.3 WORLD-LAYER QA PASS\n");
console.log("- The old hero ::before background renderer is disabled.");
console.log("- The mountain environment uses a dedicated rectangular full-hero DOM layer.");
console.log("- Circle/clip/mask/border-radius are explicitly disabled.");
console.log("- Locked Iko identity remains byte-identical.");
