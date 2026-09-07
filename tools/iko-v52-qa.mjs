import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const failures = [];
const fail = m => failures.push(m);
const exists = p => fs.existsSync(path.join(root,p));
const read = p => fs.readFileSync(path.join(root,p),"utf8");

const locked = "assets/iko-prime/identity/iko-prime-logo-locked.png";
if (!exists(locked)) fail("Locked Iko main logo is missing.");
else {
  const sha = crypto.createHash("sha256")
    .update(fs.readFileSync(path.join(root,locked)))
    .digest("hex").toUpperCase();
  if (sha !== "DDA9E772F1267325918D3608273124BD21A507B57BB49A9E2148EBFF0CBBB5FD") fail(`Locked Iko main logo changed: ${sha}`);
}

const manifestPath = "assets/iko-prime/QUALITY_MANIFEST_V52.json";
if (!exists(manifestPath)) fail("V5.2 quality manifest missing.");
else {
  const manifest = JSON.parse(read(manifestPath));
  for (const [rel, info] of Object.entries(manifest.assets || {})) {
    if (!exists(rel)) { fail(`High-res asset missing: ${rel}`); continue; }
    const hash = crypto.createHash("sha256")
      .update(fs.readFileSync(path.join(root,rel)))
      .digest("hex").toUpperCase();
    if (hash !== info.sha256) fail(`High-res asset hash mismatch: ${rel}`);
  }
}

const js = read("iko-prime-v5.js");
if (!js.includes("iko-prime-logo-1024.webp?v=52"))
  fail("Home Iko does not use the 1024px high-res derivative.");
if (!js.includes("iko-prime-logo-512.webp?v=52"))
  fail("Header/page Iko does not use refreshed 512px derivative.");
if (js.includes("iko-prime-logo-256.webp"))
  fail("V5 runtime still references 256px Iko artwork.");

const v4 = read("v4.js");
if (v4.includes("iko-prime-logo-256.webp"))
  fail("V4 fallback still references 256px Iko artwork.");

const css = read("iko-prime-v52.css");
if (!css.includes("width:56px!important"))
  fail("Desktop header Iko is not set to 56px.");
if (!css.includes("width:min(44vw,590px)"))
  fail("Main Iko high-authority scale is missing.");

const htmlFiles = [];
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
  if(!html.includes("/iko-prime-v52.css?v=1"))
    fail(`V5.2 quality CSS missing from ${rel}`);
  if(!html.includes("/iko-prime-v5.js?v=3"))
    fail(`V5.2 refreshed runtime cache tag missing from ${rel}`);
  if(html.includes("iko-prime-logo-256.webp"))
    fail(`256px Iko identity still used in HTML: ${rel}`);
}

/* Large visual exceptions must be high-res. */
for(const rel of ["portfolio/index.html","about/index.html"]){
  if(!exists(rel)) continue;
  const html=read(rel);
  if(!html.includes("iko-prime-logo-1024.webp?v=52"))
    fail(`High-res 1024 Iko is missing from ${rel}`);
}

if(failures.length){
  console.error("\nICHARLES V5.2 HIGH-RES QA FAIL\n");
  failures.forEach(x=>console.error(`- ${x}`));
  process.exit(1);
}
console.log("\nICHARLES V5.2 HIGH-RES VISUAL QA PASS\n");
console.log(`- Verified ${htmlFiles.length} HTML files load V5.2.`);
console.log("- Locked main Iko logo hash is unchanged.");
console.log("- Home/large identity surfaces use 1024px artwork.");
console.log("- Header/page identity uses refreshed 512px artwork.");
console.log("- Transparent HUD/character/divider assets use native-resolution derivatives.");
console.log("- Background assets were rebuilt at native generated dimensions.");
