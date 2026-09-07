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

for(const p of [
  "assets/iko-prime/ghostops/home-v64/home-world-dark.webp",
  "assets/iko-prime/ghostops/home-v64/home-world-light.webp",
  "ghostops-v64-home-reference.css",
  "tools/Run-Home-Visual-QA.ps1"
]) if(!exists(p)) fail(`V6.4.1 required file missing: ${p}`);

const css=read("ghostops-v64-home-reference.css");
if(!css.includes('home-world-dark.webp?v=641')) fail("Dark Home world cache version not updated.");
if(!css.includes('home-world-light.webp?v=641')) fail("Light Home world cache version not updated.");

const ps=read("tools/Run-Home-Visual-QA.ps1");
for(const marker of ["Scope: HOME ONLY","Expected 6 Home captures","desktop-1440","split-1024","phone-390"])
  if(!ps.includes(marker)) fail(`Home-only QA marker missing: ${marker}`);

if(failures.length){
  console.error("\nICHARLES V6.4.1 FINAL MOUNTAIN BACKGROUND QA FAIL\n");
  failures.forEach(x=>console.error(`- ${x}`));
  process.exit(1);
}

console.log("\nICHARLES V6.4.1 FINAL MOUNTAIN BACKGROUND QA PASS\n");
console.log("- Dark + light mountain environment plates are installed.");
console.log("- Locked Iko identity remains byte-identical.");
console.log("- Home background cache references are refreshed.");
console.log("- Visual QA scope is limited to 6 Home captures only.");
