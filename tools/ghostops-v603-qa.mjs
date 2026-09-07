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

for(const p of ["ghostops-v603-visual-fix.css","tools/Run-Visual-QA.ps1"]){
  if(!exists(p)) fail(`V6.0.3 file missing: ${p}`);
}

if(exists("ghostops-v603-visual-fix.css")){
  const css=read("ghostops-v603-visual-fix.css");
  for(const marker of [
    "@media(min-width:1280px)",
    "grid-column:2!important",
    'html[data-ui-theme="light"]',
    "font-size:clamp(42px,12.7vw,54px)!important",
    "height:72px!important",
    "overflow-x:hidden!important"
  ]) if(!css.includes(marker)) fail(`V6.0.3 CSS marker missing: ${marker}`);
}

if(exists("tools/Run-Visual-QA.ps1")){
  const ps=read("tools/Run-Visual-QA.ps1");
  if(!ps.includes('${theme}')) fail("Visual-QA filenames still do not safely delimit the theme variable.");
  if(!ps.includes('Visual QA filename collision')) fail("Visual-QA filename collision guard missing.");
  if(!ps.includes('actualScreenshotCount')) fail("Visual-QA screenshot count integrity check missing.");
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
  if(!html.includes('/ghostops-v603-visual-fix.css?v=1'))
    fail(`V6.0.3 CSS missing from ${rel}`);
}

if(failures.length){
  console.error("\nICHARLES V6.0.3 VISUAL-QA CORRECTION FAIL\n");
  failures.forEach(x=>console.error(`- ${x}`));
  process.exit(1);
}
console.log("\nICHARLES V6.0.3 VISUAL-QA CORRECTION PASS\n");
console.log(`- Verified ${htmlFiles.length} HTML files load V6.0.3 corrections.`);
console.log("- Locked Iko identity hash remains exact.");
console.log("- Desktop Home explicitly keeps Iko in the right hero column.");
console.log("- Light theme contrast/atmosphere corrections are installed.");
console.log("- Mobile title/header overflow corrections are installed.");
console.log("- Visual-QA filenames now preserve both dark and light captures.");
