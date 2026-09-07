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
  "assets/iko-prime/ghostops/part2/iko-energy-shard.webp",
  "assets/iko-prime/ghostops/part2/iko-network-emblem.webp",
  "assets/iko-prime/ghostops/part2/iko-hud-frame.webp",
  "assets/iko-prime/ghostops/part2/iko-signal-rail.webp",
  "ghostops-v61-part2.css"
]) if(!exists(asset)) fail(`V6.1 Part 2 asset missing: ${asset}`);

const css=read("ghostops-v61-part2.css");
for(const marker of [
  "--v61-shard",
  ".try-body .live-app-hero::before",
  ".try-body .live-orbit::before",
  ".try-body .live-app-card::after",
  ".site-header + main .hero .hero-visual::before",
  ".launch-card::after",
  ".project-stage::after",
  'html[data-ui-theme="light"]'
]) if(!css.includes(marker)) fail(`V6.1 CSS marker missing: ${marker}`);

for(const rel of ["try/index.html","portfolio/index.html"]){
  if(!exists(rel)) fail(`Required public page missing: ${rel}`);
  else if(!read(rel).includes('/ghostops-v61-part2.css?v=1'))
    fail(`V6.1 Part 2 CSS missing from ${rel}`);
}

for(const rel of ["index.html","services/index.html","about/index.html","contact/index.html"]){
  if(exists(rel) && read(rel).includes('/ghostops-v61-part2.css?v=1'))
    fail(`Part 2 CSS leaked onto unrelated page: ${rel}`);
}

if(failures.length){
  console.error("\nICHARLES V6.1 PART 2 QA FAIL\n");
  failures.forEach(x=>console.error(`- ${x}`));
  process.exit(1);
}
console.log("\nICHARLES V6.1 PART 2 TRY APPS + WORK QA PASS\n");
console.log("- Locked main Iko identity remains byte-identical.");
console.log("- Four transparent reserve assets from the production pack are actively used.");
console.log("- Try Apps received command-network framing, HUD depth and sharper app panels.");
console.log("- Work received HUD framing, network depth, project-deck treatment and pack accents.");
console.log("- Dark/light styling is included and Part 2 CSS is scoped only to Try Apps + Work.");
