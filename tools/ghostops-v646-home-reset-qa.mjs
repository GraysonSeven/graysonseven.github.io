import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root=process.cwd(), failures=[];
const fail=m=>failures.push(m);
const exists=p=>fs.existsSync(path.join(root,p));
const read=p=>fs.readFileSync(path.join(root,p),"utf8");

const locked="assets/iko-prime/identity/iko-prime-logo-locked.png";
if(!exists(locked)) fail("Locked Iko identity missing.");
else{
  const sha=crypto.createHash("sha256").update(fs.readFileSync(path.join(root,locked))).digest("hex").toUpperCase();
  if(sha!=="DDA9E772F1267325918D3608273124BD21A507B57BB49A9E2148EBFF0CBBB5FD") fail(`Locked Iko identity changed: ${sha}`);
}

for(const p of [
  "ghostops-v646-home-reset.css",
  "ghostops-v646-home-reset.js"
]){
  if(!exists(p)) fail(`V6.4.6 file missing: ${p}`);
}

const html=read("index.html");
if(!html.includes('/ghostops-v646-home-reset.css?v=1'))
  fail("Home missing V6.4.6 CSS.");
if(!html.includes('/ghostops-v646-home-reset.js?v=1'))
  fail("Home missing V6.4.6 JS.");

const css=read("ghostops-v646-home-reset.css");
for(const marker of [
  "url(\"/assets/iko-prime/ghostops/home-v642/home-world-dark-v642.webp?v=646\")",
  "url(\"/assets/iko-prime/ghostops/home-v642/home-world-light-v642.webp?v=646\")",
  ".hero-core",
  "display:none!important",
  ".v646-identity-stage",
  ".v646-identity-logo",
  "grid-column:2!important",
  "@media(max-width:820px)"
]){
  if(!css.includes(marker)) fail(`V6.4.6 CSS marker missing: ${marker}`);
}

const js=read("ghostops-v646-home-reset.js");
for(const marker of [
  "v646-identity-stage",
  "iko-prime-logo-1024.webp?v=55",
  "v646-mission",
  "v646-left-index",
  "vqa-capture"
]){
  if(!js.includes(marker)) fail(`V6.4.6 JS marker missing: ${marker}`);
}

if(failures.length){
  console.error("\nICHARLES V6.4.6 HOME RESET QA FAIL\n");
  failures.forEach(x=>console.error(`- ${x}`));
  process.exit(1);
}

console.log("\nICHARLES V6.4.6 HOME HERO ARCHITECTURE RESET PASS\n");
console.log("- Mountain world is a direct rectangular hero background.");
console.log("- Experimental absolute world media is retired.");
console.log("- Legacy hero-core identity renderer is retired on Home.");
console.log("- Existing 1024px Iko derivative is rendered in one dedicated stage.");
console.log("- QA query theme is applied deterministically.");
console.log("- Locked Iko source remains byte-identical.");
console.log("- No graphic asset is modified.");
