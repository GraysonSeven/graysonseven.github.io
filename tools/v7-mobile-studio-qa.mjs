import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { chromium } from "playwright-core";

const root=process.cwd();
const failures=[];
const evidence=path.join(root,"artifacts","v7-5-mobile-studio");
fs.mkdirSync(evidence,{recursive:true});
const assert=(c,m)=>{if(!c)failures.push(m)};

for(const [file,markers] of Object.entries({
  "index.html":["/assets/v7/v7-mobile-nav.css?v=750","/assets/v7/v7-mobile-nav.js?v=750"],
  "website-studio/index.html":["data-v7-page=\"studio\"","id=\"v7-page-canvas\"","/assets/v7/v7-studio-scene.js?v=750"],
  "assets/v7/v7-mobile-nav.js":["aria-expanded","v7-mobile-nav-open","Escape"],
  "assets/v7/v7-mobile-nav.css":[".v7-mobile-nav-layer","z-index:4000","@media(max-width:760px)"],
  "assets/v7/v7-studio-scene.js":["studio-forge","__V7_PAGE_DEBUG__","v7PageRender"],
  "assets/v7/v7-inner-shell.css":["#v7-page-canvas","pointer-events:none!important","v7-page-render=\"fallback\""]
})){
  const p=path.join(root,file);
  assert(fs.existsSync(p),file+" missing");
  if(fs.existsSync(p)){
    const txt=fs.readFileSync(p,"utf8");
    markers.forEach(m=>assert(txt.includes(m),file+" missing marker: "+m));
  }
}

const mime=new Map([[".html","text/html"],[".css","text/css"],[".js","text/javascript"],[".mjs","text/javascript"],[".png","image/png"],[".webp","image/webp"],[".json","application/json"]]);
const server=http.createServer((req,res)=>{
  const url=new URL(req.url||"/","http://127.0.0.1");
  let pathname=decodeURIComponent(url.pathname);
  if(pathname.endsWith("/"))pathname+="index.html";
  const target=path.resolve(root,"."+pathname);
  if(!target.startsWith(root+path.sep)&&target!==root)return res.writeHead(403).end();
  if(!fs.existsSync(target)||!fs.statSync(target).isFile())return res.writeHead(404).end();
  res.setHeader("Content-Type",mime.get(path.extname(target))||"application/octet-stream");
  fs.createReadStream(target).pipe(res);
});
await new Promise((resolve,reject)=>{server.once("error",reject);server.listen(4190,"127.0.0.1",resolve)});

let browser;
try{
  browser=await chromium.launch({channel:"msedge",headless:true});

  const phone=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  const home=await phone.newPage();
  await home.goto("http://127.0.0.1:4190/",{waitUntil:"networkidle"});
  const toggle=home.locator(".v7-mobile-nav-toggle");
  assert(await toggle.isVisible(),"home: mobile menu toggle not visible");
  await toggle.click();
  assert(await home.locator(".v7-mobile-nav-layer.is-open").isVisible(),"home: drawer did not open");
  assert(await home.locator('.v7-mobile-drawer a[href$="/portfolio/"]').isVisible(),"home: Work link missing from drawer");
  assert(await home.locator('.v7-mobile-drawer a[href$="/services/"]').isVisible(),"home: Services link missing from drawer");
  assert(await home.locator('.v7-mobile-drawer a[href$="/about/"]').isVisible(),"home: About link missing from drawer");
  const homeLayer=await home.evaluate(()=>({
    canvas:getComputedStyle(document.querySelector("#v7-canvas")).pointerEvents,
    overflow:document.documentElement.scrollWidth<=innerWidth+2,
    bodyLocked:document.body.classList.contains("v7-mobile-nav-open")
  }));
  assert(homeLayer.canvas==="none","home: WebGL canvas can block taps");
  assert(homeLayer.overflow,"home: horizontal overflow at phone width");
  assert(homeLayer.bodyLocked,"home: body did not lock when drawer opened");
  await home.screenshot({path:path.join(evidence,"home-phone-menu.png"),fullPage:false});
  await home.keyboard.press("Escape");
  assert(!(await home.locator(".v7-mobile-nav-layer").evaluate(el=>el.classList.contains("is-open"))),"home: Escape did not close drawer");
  await phone.close();

  const studioCtx=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  const studio=await studioCtx.newPage();
  await studio.goto("http://127.0.0.1:4190/website-studio/",{waitUntil:"networkidle",timeout:30000});
  await studio.waitForFunction(()=>window.__V7_PAGE_DEBUG__?.ready===true,{timeout:20000});
  const state=await studio.evaluate(()=>({
    debug:{...window.__V7_PAGE_DEBUG__},
    canvasPointer:getComputedStyle(document.querySelector("#v7-page-canvas")).pointerEvents,
    overflow:document.documentElement.scrollWidth<=innerWidth+2,
    toggleVisible:!!document.querySelector(".v7-mobile-nav-toggle")&&getComputedStyle(document.querySelector(".v7-mobile-nav-toggle")).display!=="none"
  }));
  assert(state.debug.scene==="studio-forge","studio: wrong scene");
  assert(state.debug.webgl===true&&!state.debug.fallback,"studio: WebGL forge did not initialize");
  assert(state.debug.objects>=20,"studio: 3D forge object count too low");
  assert(state.canvasPointer==="none","studio: 3D canvas can block form interaction");
  assert(state.overflow,"studio: horizontal overflow at phone width");
  assert(state.toggleVisible,"studio: mobile menu missing");
  await studio.screenshot({path:path.join(evidence,"studio-phone-forge.png"),fullPage:false});
  await studio.locator(".v7-mobile-nav-toggle").click();
  await studio.waitForFunction(()=>document.querySelector(".v7-mobile-nav-layer")?.classList.contains("is-open"),{timeout:3000});
  assert(await studio.locator(".v7-mobile-nav-layer.is-open").isVisible(),"studio: drawer did not open");
  await studio.screenshot({path:path.join(evidence,"studio-phone-menu.png"),fullPage:false});
  await studioCtx.close();

  const desktopCtx=await browser.newContext({viewport:{width:1440,height:1000}});
  const desktop=await desktopCtx.newPage();
  await desktop.goto("http://127.0.0.1:4190/website-studio/",{waitUntil:"networkidle",timeout:30000});
  await desktop.waitForFunction(()=>window.__V7_PAGE_DEBUG__?.ready===true,{timeout:20000});
  await desktop.screenshot({path:path.join(evidence,"studio-desktop-forge.png"),fullPage:false});
  await desktopCtx.close();

  const reducedCtx=await browser.newContext({viewport:{width:1024,height:900},reducedMotion:"reduce"});
  const reducedPage=await reducedCtx.newPage();
  await reducedPage.goto("http://127.0.0.1:4190/website-studio/",{waitUntil:"networkidle"});
  await reducedPage.waitForFunction(()=>window.__V7_PAGE_DEBUG__?.ready===true,{timeout:20000});
  const first=await reducedPage.evaluate(()=>({...window.__V7_PAGE_DEBUG__}));
  await reducedPage.waitForTimeout(700);
  const second=await reducedPage.evaluate(()=>({...window.__V7_PAGE_DEBUG__}));
  assert(first.reducedMotion===true,"studio reduced motion: flag missing");
  assert(first.frames===second.frames,"studio reduced motion: continuous renderer still running");
  await reducedCtx.close();
}finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
}

if(failures.length){
  console.error("\nV7.5 MOBILE + STUDIO QA FAIL\n");
  failures.forEach(x=>console.error("- "+x));
  process.exit(1);
}
console.log("\nV7.5 MOBILE + STUDIO QA PASS\n");
console.log("- Phone navigation visible, operable and keyboard closable");
console.log("- Canvas layers cannot block taps");
console.log("- Website Studio procedural forge scene initializes in Edge");
console.log("- Phone overflow guard passes");
console.log("- Reduced-motion Studio scene is static");
