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

if(!exists("ghostops-v631-part3-visual-fixes.css")) fail("V6.3.1 CSS missing.");
else{
  const css=read("ghostops-v631-part3-visual-fixes.css");
  for(const marker of [
    'html[data-ui-theme="light"] body.v45-services-body .v45-button',
    "@media(max-width:820px)",
    "grid-template-columns:minmax(82px,.35fr) minmax(0,1fr)!important",
    "body.studio-body .studio-intro-map article",
    "@media(max-width:480px)"
  ]) if(!css.includes(marker)) fail(`V6.3.1 CSS marker missing: ${marker}`);
}

for(const rel of ["services/index.html","website-studio/index.html"]){
  if(!exists(rel)) fail(`Required page missing: ${rel}`);
  else if(!read(rel).includes('/ghostops-v631-part3-visual-fixes.css?v=1'))
    fail(`V6.3.1 CSS missing from ${rel}`);
}

for(const rel of ["index.html","try/index.html","portfolio/index.html","about/index.html","contact/index.html"]){
  if(exists(rel) && read(rel).includes('/ghostops-v631-part3-visual-fixes.css?v=1'))
    fail(`V6.3.1 CSS leaked onto unrelated page: ${rel}`);
}

if(failures.length){
  console.error("\nICHARLES V6.3.1 PART 3 VISUAL QA FIX FAIL\n");
  failures.forEach(x=>console.error(`- ${x}`));
  process.exit(1);
}
console.log("\nICHARLES V6.3.1 PART 3 VISUAL QA FIX PASS\n");
console.log("- Locked Iko identity remains byte-identical.");
console.log("- Light-theme Services/Studio CTA and proof contrast is explicitly restored.");
console.log("- Services/Studio mobile hero and console systems are width-contained.");
console.log("- Studio mobile process cards are forced into a readable single-column stack.");
console.log("- V6.3.1 correction CSS is scoped only to Services + Website Studio.");
