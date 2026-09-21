import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";

const arg=(name,fallback="")=>{
  const prefix="--"+name+"=";
  const hit=process.argv.slice(2).find(x=>x.startsWith(prefix));
  return hit?hit.slice(prefix.length):fallback;
};
const origin=arg("origin","https://icharles.pages.dev").replace(/\/+$/,"");
const expected=arg("version","7.6.0");
const output=arg("output","");
const evidence=output?path.resolve(output):null;
if(evidence)fs.mkdirSync(evidence,{recursive:true});
const failures=[];
const assert=(ok,msg)=>{if(!ok)failures.push(msg)};
const pages=[
  ["/portfolio/","archive"],
  ["/contact/","transmission"],
  ["/services/","capability"],
  ["/about/","operator"],
  ["/projects/","index"],
  ["/lab/","lab"],
  ["/try/","liveapps"],
  ["/privacy/","vault"]
];

let browser;
try{
  browser=await chromium.launch({channel:"msedge",headless:true});

  for(const [route,variant] of pages){
    const ctx=await browser.newContext({viewport:{width:1440,height:1000}});
    const page=await ctx.newPage();
    const errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.goto(origin+route+"?production-qa="+Date.now(),{waitUntil:"networkidle",timeout:45000});
    await page.waitForFunction(()=>window.__V7_PAGE_DEBUG__?.ready===true,null,{timeout:25000});
    const state=await page.evaluate(()=>({
      debug:{...window.__V7_PAGE_DEBUG__},
      render:document.documentElement.dataset.v7PageRender||"",
      page:document.documentElement.dataset.v7Page||"",
      canvas:getComputedStyle(document.querySelector("#v7-page-canvas")).pointerEvents,
      width:document.documentElement.scrollWidth,
      viewport:innerWidth,
      boot:Boolean(document.querySelector(".fx-boot"))
    }));
    assert(state.debug.version===expected,route+" production scene version mismatch: "+state.debug.version);
    assert(state.debug.scene===variant,route+" production scene mismatch: "+state.debug.scene);
    assert(state.debug.webgl===true&&!state.debug.fallback,route+" production WebGL failed");
    assert(state.render==="webgl",route+" missing WebGL render marker");
    assert(state.page===variant,route+" page marker mismatch");
    assert(state.canvas==="none",route+" canvas can block interaction");
    assert(state.width<=state.viewport+2,route+" production desktop horizontal overflow");
    assert(!state.boot,route+" legacy boot overlay present in production");
    assert(errors.length===0,route+" page errors: "+errors.join(" | "));
    if(evidence)await page.screenshot({path:path.join(evidence,variant+"-production-desktop.png"),fullPage:false});
    await ctx.close();
  }

  for(const [route,variant] of pages){
    const ctx=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
    const page=await ctx.newPage();
    await page.goto(origin+route+"?production-qa="+Date.now(),{waitUntil:"networkidle",timeout:45000});
    await page.waitForFunction(()=>window.__V7_PAGE_DEBUG__?.ready===true,null,{timeout:25000});
    const width=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));
    assert(width.scroll<=width.viewport+2,route+" production phone horizontal overflow");
    const toggle=page.locator(".v7-mobile-nav-toggle");
    assert(await toggle.isVisible(),route+" production phone menu missing");
    await toggle.click();
    await page.waitForFunction(()=>document.querySelector(".v7-mobile-nav-layer")?.classList.contains("is-open"),null,{timeout:5000});
    assert(await page.locator(".v7-mobile-nav-layer.is-open").isVisible(),route+" production phone menu failed to open");
    assert(await page.locator('.v7-mobile-drawer a[href="/website-studio/"]').isVisible(),route+" production Studio route missing from mobile menu");
    if(evidence)await page.screenshot({path:path.join(evidence,variant+"-production-phone-menu.png"),fullPage:false});
    await ctx.close();
  }

  const reduced=await browser.newContext({viewport:{width:1024,height:900},reducedMotion:"reduce"});
  for(const [route,variant] of pages){
    const page=await reduced.newPage();
    await page.goto(origin+route+"?production-qa="+Date.now(),{waitUntil:"networkidle",timeout:45000});
    await page.waitForFunction(()=>window.__V7_PAGE_DEBUG__?.ready===true,null,{timeout:25000});
    const first=await page.evaluate(()=>({...window.__V7_PAGE_DEBUG__}));
    await page.waitForTimeout(450);
    const second=await page.evaluate(()=>({...window.__V7_PAGE_DEBUG__}));
    assert(first.reducedMotion===true,route+" production reduced-motion flag missing");
    assert(first.frames===second.frames,route+" production reduced-motion renderer is continuous");
    await page.close();
  }
  await reduced.close();

  const fallbackCtx=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  await fallbackCtx.addInitScript(()=>{
    const original=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(type,...args){
      if(type==="webgl"||type==="webgl2"||type==="experimental-webgl")return null;
      return original.call(this,type,...args);
    };
  });
  const fallback=await fallbackCtx.newPage();
  await fallback.goto(origin+"/contact/?production-qa="+Date.now(),{waitUntil:"networkidle",timeout:45000});
  await fallback.waitForFunction(()=>window.__V7_PAGE_DEBUG__?.fallback===true,null,{timeout:15000});
  const fb=await fallback.evaluate(()=>({
    render:document.documentElement.dataset.v7PageRender||"",
    canvas:getComputedStyle(document.querySelector("#v7-page-canvas")).display,
    content:Boolean(document.querySelector("main")?.getBoundingClientRect().height),
    toggle:getComputedStyle(document.querySelector(".v7-mobile-nav-toggle")).display
  }));
  assert(fb.render==="fallback","production fallback marker missing");
  assert(fb.canvas==="none","production fallback canvas visible");
  assert(fb.content,"production fallback HTML missing");
  assert(fb.toggle!=="none","production fallback phone menu missing");
  if(evidence)await fallback.screenshot({path:path.join(evidence,"contact-production-fallback.png"),fullPage:false});
  await fallbackCtx.close();
}finally{
  if(browser)await browser.close();
}

if(failures.length){
  console.error("\nV7.6 PRODUCTION INNER SCENES QA FAIL\n");
  failures.forEach(x=>console.error("- "+x));
  process.exit(1);
}
console.log("\nV7.6 PRODUCTION INNER SCENES QA PASS\n");
console.log("- Origin: "+origin);
console.log("- Version: "+expected);
console.log("- 8 live desktop WebGL scenes verified");
console.log("- 8 live phone navigation states verified");
console.log("- Reduced-motion static rendering verified");
console.log("- Forced WebGL fallback verified");
