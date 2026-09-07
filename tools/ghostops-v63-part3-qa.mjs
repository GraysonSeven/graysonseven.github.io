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

for(const asset of [
  "assets/iko-prime/ghostops/part3/services-workspace-dark.webp",
  "assets/iko-prime/ghostops/part3/services-workspace-light.webp",
  "assets/iko-prime/ghostops/part3/studio-design-console-dark.webp",
  "assets/iko-prime/ghostops/part3/studio-design-console-light.webp",
  "assets/iko-prime/ghostops/part3/iko-orbital-reactor.webp",
  "assets/iko-prime/ghostops/part3/iko-portal-emblem.webp",
  "assets/iko-prime/ghostops/part3/iko-signal-rail.webp",
  "assets/iko-prime/ghostops/part3/iko-network-emblem.webp",
  "ghostops-v63-part3.css"
]) if(!exists(asset)) fail(`V6.3 Part 3 asset missing: ${asset}`);

const css=read("ghostops-v63-part3.css");
for(const marker of [
  "--v63-services-bg",
  "--v63-studio-bg",
  "body.v45-services-body .v45-services-hero",
  "body.v45-services-body .v45-hero-proof::before",
  "body.v45-services-body .v45-service::after",
  "body.studio-body .studio-intro",
  "body.studio-body .studio-intro-map::before",
  "body.studio-body .wizard-shell",
  'html[data-ui-theme="light"]'
]) if(!css.includes(marker)) fail(`V6.3 CSS marker missing: ${marker}`);

for(const rel of ["services/index.html","website-studio/index.html"]){
  if(!exists(rel)) fail(`Part 3 page missing: ${rel}`);
  else if(!read(rel).includes('/ghostops-v63-part3.css?v=1'))
    fail(`V6.3 CSS missing from ${rel}`);
}

for(const rel of ["index.html","try/index.html","portfolio/index.html","about/index.html","contact/index.html"]){
  if(exists(rel) && read(rel).includes('/ghostops-v63-part3.css?v=1'))
    fail(`Part 3 CSS leaked onto unrelated page: ${rel}`);
}

if(failures.length){
  console.error("\nICHARLES V6.3 PART 3 QA FAIL\n");
  failures.forEach(x=>console.error(`- ${x}`));
  process.exit(1);
}
console.log("\nICHARLES V6.3 PART 3 SERVICES + STUDIO QA PASS\n");
console.log("- Locked main Iko identity remains byte-identical.");
console.log("- Services uses the approved services-workspace art plus Ghost Ops HUD/reactor treatment.");
console.log("- Website Studio uses the approved design-console art plus portal/reactor console treatment.");
console.log("- Dark and light theme-specific page atmospheres are present.");
console.log("- V6.3 CSS is scoped only to Services + Website Studio.");
