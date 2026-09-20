import fs from "node:fs";import path from "node:path";import crypto from "node:crypto";
const root=process.cwd(),f=[];const x=m=>f.push(m),e=p=>fs.existsSync(path.join(root,p)),r=p=>fs.readFileSync(path.join(root,p),"utf8");
const locked="assets/iko-prime/identity/iko-prime-logo-locked.png";
if(!e(locked))x("Locked Iko missing");else{const s=crypto.createHash("sha256").update(fs.readFileSync(path.join(root,locked))).digest("hex").toUpperCase();if(s!=="DDA9E772F1267325918D3608273124BD21A507B57BB49A9E2148EBFF0CBBB5FD")x("Locked Iko changed: "+s)}
for(const p of ["experience/index.html","experience/experience.css","experience/experience.js","assets/v7/charles-profile-source.webp","assets/v7/charles-operator-v7.webp","assets/v7/iko-archive-world-dark.webp","assets/v7/iko-archive-world-light.webp","assets/vendor/v7/three.module.min.js","assets/vendor/v7/gsap.min.js","assets/vendor/v7/ScrollTrigger.min.js","V7_SAFETY_POINT.json"])if(!e(p))x("Missing "+p);
if(e("experience/index.html")){const h=r("experience/index.html");for(const m of ['noindex,nofollow,noarchive','SYSTEM 01 // IKO ONLINE','SYSTEM 02 // THE BUILDER','REQUEST A QUOTE'])if(!h.includes(m))x("HTML marker "+m)}
if(e("experience/experience.js")){const j=r("experience/experience.js");for(const m of ['import * as THREE','ScrollTrigger','charles-operator-v7.webp','TorusGeometry','archiveGroup','portalGroup'])if(!j.includes(m))x("JS marker "+m)}
if(f.length){console.error("\nV7 QA FAIL\n"+f.map(v=>"- "+v).join("\n"));process.exit(1)}console.log("\nICHARLES V7.0 SAFETY + 3D FOUNDATION QA PASS\n");
