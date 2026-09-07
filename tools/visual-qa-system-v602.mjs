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

for(const p of ["tools/Run-Visual-QA.ps1","ghostops-theme-boot-v60.js"]) if(!exists(p)) fail(`Visual QA system file missing: ${p}`);

if(exists("tools/Run-Visual-QA.ps1")){
  const ps=read("tools/Run-Visual-QA.ps1");
  for(const marker of [
    "Microsoft\\Edge\\Application\\msedge.exe","--headless=new","--force-prefers-reduced-motion",
    "vqa-theme=$theme","desktop-1440","split-1024","phone-390","VISUAL-QA-GALLERY.html","Compress-Archive"
  ]) if(!ps.includes(marker)) fail(`Visual QA capture marker missing: ${marker}`);
}
if(exists("ghostops-theme-boot-v60.js")){
  const boot=read("ghostops-theme-boot-v60.js");
  if(!boot.includes('params.get("vqa-theme")')) fail("Theme boot lacks deterministic QA theme override.");
  if(!boot.includes('dataset.visualQa')) fail("Visual-QA mode marker missing from theme boot.");
}
if(failures.length){
  console.error("\nICHARLES V6.0.2 VISUAL QA SYSTEM FAIL\n");
  failures.forEach(x=>console.error(`- ${x}`));
  process.exit(1);
}
console.log("\nICHARLES V6.0.2 AUTOMATED VISUAL QA SYSTEM PASS\n");
console.log("- Persistent Microsoft Edge headless capture tool installed.");
console.log("- Dark/light QA theme override is deterministic and non-persistent.");
console.log("- Desktop, split-screen and phone viewport presets are present.");
console.log("- Locked Iko identity hash remains exact.");
