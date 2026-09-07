import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root=process.cwd();
const failures=[];
const fail=m=>failures.push(m);
const exists=p=>fs.existsSync(path.join(root,p));
const read=p=>fs.readFileSync(path.join(root,p),"utf8");

const locked="assets/iko-prime/identity/iko-prime-logo-locked.png";
if(!exists(locked)) fail("Locked Iko identity missing.");
else{
  const sha=crypto.createHash("sha256").update(fs.readFileSync(path.join(root,locked))).digest("hex").toUpperCase();
  if(sha!=="DDA9E772F1267325918D3608273124BD21A507B57BB49A9E2148EBFF0CBBB5FD") fail(`Locked Iko identity changed: ${sha}`);
}

if(!exists("ghostops-v601-fix.css")) fail("V6.0.1 responsive fix CSS missing.");
else{
  const css=read("ghostops-v601-fix.css");
  for(const marker of [
    "@media (min-width:821px) and (max-width:1279px)",
    "grid-template-columns:minmax(0,.98fr) minmax(390px,1.02fr)",
    "grid-template-columns:repeat(3,minmax(0,1fr))",
    "color:var(--v60-heading)!important",
    "@media (max-width:820px)"
  ]) if(!css.includes(marker)) fail(`Responsive fix marker missing: ${marker}`);
}

const htmlFiles=[];
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
  if(!html.includes('/ghostops-v601-fix.css?v=1'))
    fail(`V6.0.1 responsive fix not loaded by ${rel}`);
}

const home=read("index.html");
if(!home.includes('/ghostops-v601-fix.css?v=1'))
  fail("Home does not load V6.0.1 responsive fix.");

if(failures.length){
  console.error("\nICHARLES V6.0.1 RESPONSIVE HERO QA FAIL\n");
  failures.forEach(x=>console.error(`- ${x}`));
  process.exit(1);
}
console.log("\nICHARLES V6.0.1 RESPONSIVE HERO QA PASS\n");
console.log(`- Verified ${htmlFiles.length} HTML files load the fix layer.`);
console.log("- Locked Iko identity hash remains exact.");
console.log("- 821–1279px keeps the Home hero in two columns.");
console.log("- Home proof cards remain three columns at split-screen desktop widths.");
console.log("- Dark primary CTA text is explicitly legible.");
console.log("- True single-column mode begins at 820px.");
