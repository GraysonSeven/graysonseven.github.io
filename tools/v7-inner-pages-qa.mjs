import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { chromium } from "playwright-core";

const root=process.cwd();
const failures=[];
const evidence=path.join(root,"artifacts","v7-5-inner-worlds");
fs.mkdirSync(evidence,{recursive:true});
const assert=(c,m)=>{if(!c)failures.push(m)};
const pages=[
  ["/portfolio/","archive"],["/contact/","transmission"],["/services/","capabilities"],["/about/","operator"],
  ["/projects/","systems"],["/lab/","lab"],["/try/","test-deck"],["/privacy/","vault"]
];

for(const [url,scene] of pages){
  const file=path.join(root,url.slice(1),"index.html");
  assert(fs.existsSync(file),url+" page missing");
  if(!fs.existsSync(file))continue;
  const html=fs.readFileSync(file,"utf8");
  for(const marker of [
    'data-v7-nav="shared"',`data-v7-scene="${scene}"`,
    '/assets/v7/v7-mobile-nav.css?v=751','/assets/v7/v7-inner-shell.css?v=751',
    '/assets/v7/v7-mobile-nav.js?v=751','/assets/v7/v7-page-scenes.js?v=751',
    'id="v7-page-canvas"'
  ]) assert(html.includes(marker),url+" missing "+marker);
}

const mime=new Map([[".html","text/html"],[".css","text/css"],[".js","text/javascript"],[".mjs","text/javascript"],[".json","application/json"],[".png","image/png"],[".webp","image/webp"],[".jpg","image/jpeg"],[".svg","image/svg+xml"],[".woff2","font/woff2"]]);
const server=http.createServer((req,res)=>{
  const u=new URL(req.url||"/","http://127.0.0.1");let pathname=decodeURIComponent(u.pathname);
  if(pathname.endsWith("/"))pathname+="index.html";
  const target=path.resolve(root,"."+pathname);
  if(!target.startsWith(root+path.sep)&&target!==root)return res.writeHead(403).end();
  if(!fs.existsSync(target)||!fs.statSync(target).isFile())return res.writeHead(404).end();
  res.setHeader("Content-Type",mime.get(path.extname(target).toLowerCase())||"application/octet-stream");
  res.setHeader("Cache-Control","no-store");fs.createReadStream(target).pipe(res);
});
await new Promise((resolve,reject)=>{server.once("error",reject);server.listen(4191,"127.0.0.1",resolve)});

let browser;
try{
  browser=await chromium.launch({channel:"msedge",headless:true});
  const desktopCtx=await browser.newContext({viewport:{width:1280,height:900}});
  const desktop=await desktopCtx.newPage();
  for(const [url,scene] of pages){
    await desktop.goto("http://127.0.0.1:4191"+url,{waitUntil:"domcontentloaded",timeout:30000});
    await desktop.waitForFunction(s=>window.__V7_PAGE_DEBUG__?.ready===true&&window.__V7_PAGE_DEBUG__?.scene===s,scene,{timeout:20000});
    const state=await desktop.evaluate(()=>({
      debug:{...window.__V7_PAGE_DEBUG__},
      pointer:getComputedStyle(document.querySelector("#v7-page-canvas")).pointerEvents,
      overflow:document.documentElement.scrollWidth<=innerWidth+2,
      legacy:[...document.querySelectorAll(".v423-menu-button,.v4-mobile-menu,.fx-command-trigger")].filter(el=>getComputedStyle(el).display!=="none").length
    }));
    assert(state.debug.webgl&&!state.debug.fallback,url+" WebGL world failed");
    assert(state.debug.objects>=10,url+" object count too low");
    assert(state.pointer==="none",url+" canvas can block UI");
    assert(state.overflow,url+" desktop horizontal overflow");
    assert(state.legacy===0,url+" legacy navigation still visible");
    await desktop.screenshot({path:path.join(evidence,scene+"-desktop.png"),fullPage:false});
  }
  await desktopCtx.close();

  const phoneCtx=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  const phone=await phoneCtx.newPage();
  for(const [url,scene] of pages){
    await phone.goto("http://127.0.0.1:4191"+url,{waitUntil:"domcontentloaded",timeout:30000});
    await phone.waitForFunction(s=>window.__V7_PAGE_DEBUG__?.ready===true&&window.__V7_PAGE_DEBUG__?.scene===s,scene,{timeout:20000});
    const pre=await phone.evaluate(()=>({
      overflow:document.documentElement.scrollWidth<=innerWidth+2,
      toggles:[...document.querySelectorAll(".v7-mobile-nav-toggle")].filter(el=>getComputedStyle(el).display!=="none").length,
      legacy:[...document.querySelectorAll(".v423-menu-button,.v4-mobile-menu,.fx-command-trigger,.nav-toggle")].filter(el=>getComputedStyle(el).display!=="none").length
    }));
    assert(pre.overflow,url+" phone horizontal overflow");
    assert(pre.toggles===1,url+" expected exactly one V7 phone menu, found "+pre.toggles);
    assert(pre.legacy===0,url+" legacy phone menu still visible");
    await phone.locator(".v7-mobile-nav-toggle").click();
    await phone.waitForFunction(()=>document.querySelector(".v7-mobile-nav-layer")?.classList.contains("is-open"),{timeout:3000});
    assert(await phone.locator('.v7-mobile-drawer a[href="/website-studio/"]').isVisible(),url+" drawer missing Studio route");
    await phone.screenshot({path:path.join(evidence,scene+"-phone-menu.png"),fullPage:false});
    await phone.keyboard.press("Escape");
  }
  await phoneCtx.close();

  const reducedCtx=await browser.newContext({viewport:{width:1024,height:900},reducedMotion:"reduce"});
  const reduced=await reducedCtx.newPage();
  await reduced.goto("http://127.0.0.1:4191/about/",{waitUntil:"domcontentloaded"});
  await reduced.waitForFunction(()=>window.__V7_PAGE_DEBUG__?.ready===true,{timeout:20000});
  const a=await reduced.evaluate(()=>({...window.__V7_PAGE_DEBUG__}));await reduced.waitForTimeout(650);const b=await reduced.evaluate(()=>({...window.__V7_PAGE_DEBUG__}));
  assert(a.reducedMotion===true,"reduced motion flag missing");
  assert(a.frames===b.frames,"reduced motion world is still animating");
  await reducedCtx.close();

  const fallbackCtx=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  await fallbackCtx.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(type==="webgl"||type==="webgl2"||type==="experimental-webgl")return null;return original.call(this,type,...args)}});
  const fallback=await fallbackCtx.newPage();
  await fallback.goto("http://127.0.0.1:4191/contact/",{waitUntil:"domcontentloaded"});
  await fallback.waitForFunction(()=>window.__V7_PAGE_DEBUG__?.fallback===true,{timeout:20000});
  const f=await fallback.evaluate(()=>({render:document.documentElement.dataset.v7PageRender,canvas:getComputedStyle(document.querySelector("#v7-page-canvas")).display,heading:!!document.querySelector("h1")}));
  assert(f.render==="fallback","fallback render marker missing");
  assert(f.canvas==="none","fallback canvas not hidden");
  assert(f.heading,"fallback HTML content missing");
  await fallbackCtx.close();
}finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
}

if(failures.length){console.error("\nV7.5 INNER WORLDS QA FAIL\n");failures.forEach(x=>console.error("- "+x));process.exit(1)}
console.log("\nV7.5 INNER WORLDS QA PASS\n");
console.log("- 8 distinct inner-page scene identities initialize in Microsoft Edge");
console.log("- Exactly one shared phone navigation is visible on every upgraded page");
console.log("- Canvas layers cannot block interactions and overflow checks pass");
console.log("- Reduced motion is static and forced WebGL fallback preserves HTML content");
