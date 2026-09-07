import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const failures = [];
const fail = m => failures.push(m);
const exists = p => fs.existsSync(path.join(root,p));
const read = p => fs.readFileSync(path.join(root,p),"utf8");

const locked = "assets/iko-prime/identity/iko-prime-logo-locked.png";
if (!exists(locked)) fail("Locked Iko identity missing.");
else {
  const sha = crypto.createHash("sha256")
    .update(fs.readFileSync(path.join(root,locked)))
    .digest("hex").toUpperCase();
  if (sha !== "DDA9E772F1267325918D3608273124BD21A507B57BB49A9E2148EBFF0CBBB5FD") fail(`Locked Iko identity changed: ${sha}`);
}

const css = read("iko-prime-v5.css");
const js = read("iko-prime-v5.js");

if (!css.includes("V5.5 — REST OF SITE FINAL POLISH"))
  fail("V5.5 CSS block missing.");

for (const marker of [
  ".v45-services-hero p",
  ".identity-top",
  ".contact-copy p",
  ".studio-intro-map>small",
  ".privacy-grid small",
  ".sent-box .next-grid p",
  "main#case-main .copy p"
]) {
  if (!css.includes(marker)) fail(`V5.5 readability marker missing: ${marker}`);
}

if (!js.includes('path.startsWith("/portfolio/projects/")'))
  fail("Case-study native-identity exclusion missing.");
if (js.includes("iko-prime-logo-256.webp"))
  fail("Runtime still references 256px Iko artwork.");
if (!js.includes("iko-prime-logo-1024.webp?v=55"))
  fail("Main Iko V5.5 1024px cache reference missing.");
if (!js.includes("iko-prime-logo-512.webp?v=55"))
  fail("Compact Iko V5.5 512px cache reference missing.");

for (const obsolete of [
  "tools/iko-v54-qa.mjs",
  "iko-prime-v51.css",
  "iko-prime-v52.css"
]) {
  if (exists(obsolete)) fail(`Obsolete V5 layer/QA remains: ${obsolete}`);
}

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
  if(!html.includes('/iko-prime-v5.css?v=6'))
    fail(`V5.5 CSS cache tag missing from ${rel}`);
  if(!html.includes('/iko-prime-v5.js?v=6'))
    fail(`V5.5 JS cache tag missing from ${rel}`);
  if(html.includes("iko-prime-logo-256.webp"))
    fail(`Low-res 256px Iko reference remains in ${rel}`);
}

for(const rel of ["portfolio/index.html","about/index.html"]){
  if(exists(rel) && !read(rel).includes("iko-prime-logo-1024.webp?v=55"))
    fail(`Large identity surface is not 1024px on ${rel}`);
}

for(const rel of [
  "services/index.html",
  "website-studio/index.html",
  "about/index.html",
  "contact/index.html",
  "privacy/index.html",
  "website-request-sent/index.html",
  "project-inquiry-sent/index.html",
  "portfolio/projects/trade-core.html",
  "portfolio/projects/morsebound.html",
  "portfolio/projects/ette-planner.html",
  "portfolio/projects/trade-core-custom-business.html"
]) {
  if (!exists(rel)) fail(`Expected remaining public page missing: ${rel}`);
}

if(failures.length){
  console.error("\nICHARLES V5.5 REST-OF-SITE QA FAIL\n");
  failures.forEach(x=>console.error(`- ${x}`));
  process.exit(1);
}

console.log("\nICHARLES V5.5 REST-OF-SITE FINAL POLISH QA PASS\n");
console.log(`- Verified ${htmlFiles.length} HTML files use V5.5 cache tags.`);
console.log("- Locked main Iko identity remains byte-identical.");
console.log("- Services, About, Contact, Studio, Privacy, confirmation pages and case studies have final readability rules.");
console.log("- Case studies no longer receive a redundant injected Iko page mark.");
console.log("- Large identity surfaces stay on 1024px artwork; compact identity stays on 512px.");
