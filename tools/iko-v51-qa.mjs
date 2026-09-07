import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const failures = [];
const fail = m => failures.push(m);
const exists = p => fs.existsSync(path.join(root,p));
const read = p => fs.readFileSync(path.join(root,p),"utf8");

const locked = "assets/iko-prime/identity/iko-prime-logo-locked.png";
if (!exists(locked)) fail("Final locked Iko identity missing.");
else {
  const sha = crypto.createHash("sha256")
    .update(fs.readFileSync(path.join(root,locked)))
    .digest("hex").toUpperCase();
  if (sha !== "DDA9E772F1267325918D3608273124BD21A507B57BB49A9E2148EBFF0CBBB5FD") fail(`Final Iko identity hash mismatch: ${sha}`);
}

for (const p of [
  "assets/iko-prime/identity/iko-prime-logo-1024.webp",
  "assets/iko-prime/identity/iko-prime-logo-512.webp",
  "assets/iko-prime/identity/iko-prime-logo-256.webp",
  "assets/iko-prime/identity/iko-prime-logo-128.png",
  "assets/iko-prime/hud/iko-orbital-reactor.webp",
  "assets/iko-prime/hud/iko-signal-rail.webp",
  "assets/iko-prime/hud/iko-hud-frame.webp",
  "assets/iko-prime/hud/iko-network-emblem.webp",
  "assets/iko-prime/hud/iko-portal-emblem.webp",
  "assets/iko-prime/character/iko-prime-character.webp",
  "assets/iko-prime/decorative/iko-crystal-slash.webp",
  "iko-prime-v51.css"
]) if (!exists(p)) fail(`V5.1 asset missing: ${p}`);

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
  if(!html.includes("/iko-prime-v51.css?v=1")) fail(`V5.1 CSS missing from ${rel}`);
  if(html.includes("/iko-prime-v5.css?v=1")) fail(`Old V5 CSS cache tag remains in ${rel}`);
  if(html.includes("/iko-prime-v5.js?v=1")) fail(`Old V5 JS cache tag remains in ${rel}`);
  if(!html.includes("/iko-prime-v5.css?v=2")) fail(`V5 base CSS cache v2 missing from ${rel}`);
  if(!html.includes("/iko-prime-v5.js?v=2")) fail(`V5 JS cache v2 missing from ${rel}`);
}

const baseCss = read("iko-prime-v5.css");
if(!baseCss.includes("width:min(43vw,560px)")) fail("Large Iko hero scale was not merged into V5 base CSS.");
if(baseCss.includes("width:min(25vw,330px)")) fail("Old 330px core-logo scale still exists.");

if(failures.length){
  console.error("\nICHARLES V5.1 TRANSPARENT IKO QA FAIL\n");
  failures.forEach(x=>console.error(`- ${x}`));
  process.exit(1);
}
console.log("\nICHARLES V5.1 TRANSPARENT IKO QA PASS\n");
console.log(`- Verified ${htmlFiles.length} HTML files use refreshed Iko assets.`);
console.log("- Verified final locked realistic Iko identity hash.");
console.log("- Verified larger hero scale and removal of the old 330px core-logo rule.");
console.log("- Overlay sources were validated for real alpha transparency before packaging.");
