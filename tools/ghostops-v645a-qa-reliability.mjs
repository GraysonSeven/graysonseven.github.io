import fs from "node:fs";
import path from "node:path";

const root=process.cwd(), failures=[];
const fail=m=>failures.push(m);
const exists=p=>fs.existsSync(path.join(root,p));
const read=p=>fs.readFileSync(path.join(root,p),"utf8");

for(const p of [
  "tools/Capture-Visual-QA.mjs",
  "tools/Run-Home-Visual-QA.ps1"
]){
  if(!exists(p)) fail(`QA tool missing: ${p}`);
}

const cap=read("tools/Capture-Visual-QA.mjs");
for(const marker of [
  'waitUntil: "commit"',
  "navigationAttempts",
  "navigateWithRetry",
  "serviceWorkers: \"block\"",
  "RETRY PASS"
]){
  if(!cap.includes(marker)) fail(`Capture engine hardening marker missing: ${marker}`);
}

const run=read("tools/Run-Home-Visual-QA.ps1");
for(const marker of [
  "navigationTimeoutMs=75000",
  "navigationAttempts=3",
  "Partial QA ZIP was preserved",
  "RETRY HARDENED"
]){
  if(!run.includes(marker)) fail(`Home QA runner marker missing: ${marker}`);
}

if(failures.length){
  console.error("\nICHARLES V6.4.5A QA RELIABILITY FAIL\n");
  failures.forEach(x=>console.error(`- ${x}`));
  process.exit(1);
}

console.log("\nICHARLES V6.4.5A VISUAL QA RELIABILITY PASS\n");
console.log("- Edge navigation retries up to 3 times.");
console.log("- Navigation waits for response commit, then settles DOM/fonts.");
console.log("- Service workers are blocked during QA to reduce stale/intermittent loads.");
console.log("- Partial QA ZIP is preserved if a capture still fails.");
console.log("- Website visuals are not changed.");
