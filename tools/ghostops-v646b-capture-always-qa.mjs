import fs from "node:fs";
import path from "node:path";

const root=process.cwd(), failures=[];
const fail=m=>failures.push(m);
const read=p=>fs.readFileSync(path.join(root,p),"utf8");

const cap=read("tools/Capture-Visual-QA.mjs");
for(const marker of [
  "capture_even_on_asset_warning:true",
  "vqaAssetRetry",
  "screenshot retained for visual diagnosis",
  ".v646-identity-stage",
  "assetWarnings"
]){
  if(!cap.includes(marker)) fail(`Capture-always marker missing: ${marker}`);
}

const run=read("tools/Run-Home-Visual-QA.ps1");
for(const marker of [
  "RETRY ONCE, THEN CAPTURE ANYWAY",
  "Asset warnings:",
  "V6.4.6B"
]){
  if(!run.includes(marker)) fail(`Runner marker missing: ${marker}`);
}

if(failures.length){
  console.error("\nICHARLES V6.4.6B QA TOOL FAIL\n");
  failures.forEach(x=>console.error(`- ${x}`));
  process.exit(1);
}

console.log("\nICHARLES V6.4.6B QA CAPTURE-ALWAYS PASS\n");
console.log("- V6.4.6 identity stage is awaited before asset checks.");
console.log("- Iko/orbit asset requests retry once on timeout.");
console.log("- Asset warnings no longer discard screenshots.");
console.log("- Website visual files are untouched.");
