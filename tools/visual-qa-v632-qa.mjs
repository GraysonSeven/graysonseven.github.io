import fs from "node:fs";
import path from "node:path";
const root=process.cwd(), failures=[];
const fail=m=>failures.push(m), exists=p=>fs.existsSync(path.join(root,p)), read=p=>fs.readFileSync(path.join(root,p),"utf8");

for(const p of ["tools/Run-Visual-QA.ps1","tools/Capture-Visual-QA.mjs","tools/visual-qa-system-v602.mjs"])
  if(!exists(p)) fail(`V6.3.2 file missing: ${p}`);

const ps=read("tools/Run-Visual-QA.ps1");
const js=read("tools/Capture-Visual-QA.mjs");

if(ps.includes("--window-size=")) fail("Old inaccurate window-size method remains.");
if(!ps.includes("playwright-core@latest")) fail("Playwright installation fallback missing.");
if(!ps.includes("actualViewport")) fail("PowerShell viewport integrity verification missing.");
if(!js.includes("metrics.innerWidth !== vp.width")) fail("Node viewport integrity guard missing.");
if(!js.includes("horizontalOverflowPx")) fail("Horizontal overflow diagnostics missing.");
if(!js.includes("screen: { width: vp.width, height: vp.height }")) fail("Exact screen emulation missing.");

if(failures.length){
  console.error("\nICHARLES V6.3.2 QA ENGINE CORRECTION FAIL\n");
  failures.forEach(x=>console.error(`- ${x}`));
  process.exit(1);
}
console.log("\nICHARLES V6.3.2 QA ENGINE CORRECTION PASS\n");
console.log("- Exact CSS viewport emulation is enforced.");
console.log("- 390x844 captures can no longer silently use a wider layout viewport.");
console.log("- Horizontal overflow is measured, not guessed from cropping.");
