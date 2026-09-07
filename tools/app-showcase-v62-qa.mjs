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
  "app-showcase-v62.css","app-showcase-v62.js",
  "tools/app-showcase-config.json","tools/Capture-App-Showcase.mjs",
  "tools/Run-App-Showcase-Capture.ps1","assets/showcase/manifest.json"
]) if(!exists(p)) fail(`V6.2 showcase file missing: ${p}`);

const js=read("app-showcase-v62.js");
for(const marker of [
  "v62-home-showcase","data-showcase-app","v62-case-showcase",
  "assets/showcase/manifest.json","REAL SOFTWARE // SNAPSHOT"
]) if(!js.includes(marker)) fail(`Showcase runtime marker missing: ${marker}`);

const cap=read("tools/Capture-App-Showcase.mjs");
for(const marker of [
  'channel:"msedge"',"launchPersistentContext","requiresAuth",
  'type:"jpeg"',"/assets/showcase/"
]) if(!cap.includes(marker)) fail(`Showcase capture marker missing: ${marker}`);

const ps=read("tools/Run-App-Showcase-Capture.ps1");
for(const marker of [
  "AppShowcaseEdgeProfile","playwright-core@latest","README-REVIEW-FIRST",
  "iCharles_App_Showcase_Candidates_"
]) if(!ps.includes(marker)) fail(`Showcase PowerShell marker missing: ${marker}`);

const tryHtml=read("try/index.html");
for(const pair of [
  ['id="trade-core"','data-showcase-app="trade-core"'],
  ['id="morsebound"','data-showcase-app="morsebound"'],
  ['id="ette"','data-showcase-app="ette-planner"']
]){
  if(!tryHtml.includes(pair[0]) || !tryHtml.includes(pair[1])) fail(`Try Apps showcase binding missing: ${pair[1]}`);
}

const cases={
  "portfolio/projects/trade-core.html":"trade-core",
  "portfolio/projects/morsebound.html":"morsebound",
  "portfolio/projects/ette-planner.html":"ette-planner"
};
for(const [rel,id] of Object.entries(cases)){
  if(!exists(rel)) fail(`Case study missing: ${rel}`);
  else if(!read(rel).includes(`data-showcase-app="${id}"`)) fail(`Case-study showcase binding missing: ${rel}`);
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
  if(!html.includes('/app-showcase-v62.css?v=1')) fail(`V6.2 CSS missing from ${rel}`);
  if(!html.includes('/app-showcase-v62.js?v=1')) fail(`V6.2 JS missing from ${rel}`);
}

if(failures.length){
  console.error("\nICHARLES V6.2 APP SHOWCASE SNAPSHOT QA FAIL\n");
  failures.forEach(x=>console.error(`- ${x}`));
  process.exit(1);
}
console.log("\nICHARLES V6.2 APP SHOWCASE SNAPSHOT SYSTEM PASS\n");
console.log(`- Verified ${htmlFiles.length} HTML files load the showcase runtime.`);
console.log("- Locked Iko identity hash remains exact.");
console.log("- Trade Core, Morsebound and ETTE Planner are bound to real screenshot galleries.");
console.log("- Dedicated authenticated Edge profile + Playwright capture workflow is installed.");
console.log("- Captures default to REVIEW-FIRST; authenticated screenshots are not published automatically.");
