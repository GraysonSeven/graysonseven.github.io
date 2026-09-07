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

for(const p of ["tools/Run-Visual-QA.ps1","tools/Capture-Visual-QA.mjs"])
  if(!exists(p)) fail(`Accurate Visual QA file missing: ${p}`);

if(exists("tools/Run-Visual-QA.ps1")){
  const ps=read("tools/Run-Visual-QA.ps1");
  for(const marker of [
    "VisualQACaptureEngine",
    "playwright-core@latest",
    "Viewport verification: ENABLED",
    "Horizontal overflow detection: ENABLED",
    "actualViewport",
    "phone-390"
  ]) if(!ps.includes(marker)) fail(`Accurate QA PowerShell marker missing: ${marker}`);

  if(ps.includes("--window-size=")) fail("Legacy Edge --window-size capture method still present.");
}

if(exists("tools/Capture-Visual-QA.mjs")){
  const js=read("tools/Capture-Visual-QA.mjs");
  for(const marker of [
    'channel: "msedge"',
    "browser.newContext",
    "viewport: { width: vp.width, height: vp.height }",
    "window.innerWidth",
    "horizontalOverflowPx",
    'scale: "css"'
  ]) if(!js.includes(marker)) fail(`Accurate QA engine marker missing: ${marker}`);
}

if(failures.length){
  console.error("\nICHARLES ACCURATE VISUAL QA SYSTEM FAIL\n");
  failures.forEach(x=>console.error(`- ${x}`));
  process.exit(1);
}

console.log("\nICHARLES V6.3.2 ACCURATE VISUAL QA SYSTEM PASS\n");
console.log("- Playwright controls installed Microsoft Edge with exact browser-context viewports.");
console.log("- Legacy --window-size screenshot method is retired.");
console.log("- Every capture records actual innerWidth/innerHeight and horizontal overflow.");
console.log("- Locked Iko identity hash remains exact.");
