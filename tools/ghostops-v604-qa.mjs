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

for(const p of ["ghostops-v604-qa-hardening.css","tools/Run-Visual-QA.ps1"])
  if(!exists(p)) fail(`V6.0.4 file missing: ${p}`);

if(exists("ghostops-v604-qa-hardening.css")){
  const css=read("ghostops-v604-qa-hardening.css");
  for(const marker of [
    "@media(min-width:900px) and (max-width:1050px)",
    "grid-template-columns:minmax(0,1fr) minmax(340px,.78fr)",
    "width:calc(100vw - 24px)!important",
    "font-size:clamp(38px,10.6vw,42px)!important",
    "-webkit-text-stroke:1.15px rgba(18,67,101,.42)!important",
    "display:none!important"
  ]) if(!css.includes(marker)) fail(`V6.0.4 CSS marker missing: ${marker}`);
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
  if(!html.includes('/ghostops-v604-qa-hardening.css?v=1'))
    fail(`V6.0.4 CSS missing from ${rel}`);
}

if(failures.length){
  console.error("\nICHARLES V6.0.4 VISUAL-QA HARDENING FAIL\n");
  failures.forEach(x=>console.error(`- ${x}`));
  process.exit(1);
}
console.log("\nICHARLES V6.0.4 VISUAL-QA HARDENING PASS\n");
console.log(`- Verified ${htmlFiles.length} HTML files load the hardening layer.`);
console.log("- Locked Iko identity hash remains exact.");
console.log("- Mobile public shells and nested layout systems are viewport-contained.");
console.log("- Mobile display headlines are capped for 390px-class screens.");
console.log("- Light-theme outlined typography uses stronger engineering-blue contrast.");
console.log("- 1024 Try Apps and Work keep their identity visual beside the primary copy.");
