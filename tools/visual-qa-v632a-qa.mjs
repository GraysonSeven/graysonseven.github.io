import fs from "node:fs";
import path from "node:path";

const root=process.cwd(), failures=[];
const fail=m=>failures.push(m);
const read=p=>fs.readFileSync(path.join(root,p),"utf8");

const ps=read("tools/Run-Visual-QA.ps1");
const js=read("tools/Capture-Visual-QA.mjs");

if(!ps.includes("Write-Utf8NoBom $configPath $configJson"))
  fail("Config JSON is not written explicitly without BOM.");
if(ps.includes("Set-Content -LiteralPath $configPath -Encoding UTF8"))
  fail("Legacy BOM-producing Set-Content config write remains.");
if(!js.includes('replace(/^\\uFEFF/, "")'))
  fail("Node-side BOM tolerance is missing.");
if(!js.includes("JSON.parse(rawConfig)"))
  fail("Capture engine is not parsing the BOM-sanitized config.");
if(!js.includes("metrics.innerWidth !== vp.width"))
  fail("Viewport integrity guard missing.");

if(failures.length){
  console.error("\nICHARLES V6.3.2A BOM HOTFIX QA FAIL\n");
  failures.forEach(x=>console.error(`- ${x}`));
  process.exit(1);
}
console.log("\nICHARLES V6.3.2A BOM HOTFIX QA PASS\n");
console.log("- PowerShell writes capture-config.json as UTF-8 without BOM.");
console.log("- Node defensively strips U+FEFF before JSON.parse.");
console.log("- Exact Playwright/Edge viewport verification remains enabled.");
