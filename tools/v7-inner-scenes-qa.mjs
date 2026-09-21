import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { chromium } from "playwright-core";

const root=process.cwd();
const evidence=path.join(root,"artifacts","v7-6-inner-scenes");
fs.mkdirSync(evidence,{recursive:true});
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

for(const [route,variant] of pages){
  const file=path.join(root,route.replace(/^\//,""),"index.html");
  assert(fs.existsSync(file),route+" index missing");
  if(fs.existsSync(file)){
    const html=fs.readFileSync(file,"utf8");
    for(const marker of [
      'data-v7-page="'+variant+'"',
      'data-v7-nav="shared"',
      'id="v7-page-canvas"',
      '/assets/v7/v7-mobile-nav.js?v=760',
      '/assets/v7/v7-inner-scenes.js?v=760'
    ]) assert(html.includes(marker),route+" missing "+marker);
  }
}
for(const file of [
  "assets/v7/v7-inner-scenes.js",
  "assets/v7/v7-inner-scenes.css",
  "assets/v7/v7-mobile-nav.js"
]) assert(fs.existsSync(path.join(root,file)),file+" missing");

const mime=new Map([
  [".html","text/html; charset=utf-8"],[".css","text/css"],[".js","text/javascript"],[".mjs","text/javascript"],
  [".json","application/json"],[".png","image/png"],[".webp","image/webp"],[".jpg","image/jpeg"],[".jpeg","image/jpeg"],
  [".svg","image/svg+xml"],[".ico","image/x-icon"],[".woff2","font/woff2"]
]);
const server=http.createServer((req,res)=>{
  try{
    const url=new URL(req.url||"/","http://127.0.0.1");
    let pathname=decodeURIComponent(url.pathname);
    if(pathname.endsWith("/"))pathname+="index.html";
    const target=path.resolve(root,"."+pathname);
    if(!target.startsWith(root+path.sep)&&target!==root)return res.writeHead(403).end("Forbidden");
    if(!fs.existsSync(target)||!fs.statSync(target).isFile())return res.writeHead(404).end("Not found");
    res.setHeader("Content-Type",mime.get(path.extname(target).toLowerCase())||"application/octet-stream");
    res.setHeader("Cache-Control","no-store");
    fs.createReadStream(target).pipe(res);
  }catch(error){res.writeHead(500).end(String(error))}
});
await new Promise((resolve,reject)=>{server.once("error",reject);server.listen(4192,"127.0.0.1",resolve)});

let browser;
try{
  browser=await chromium.launch({channel:"msedge",headless:true});

  for(const [route,variant] of pages){
    const ctx=await browser.newContext({viewport:{width:1440,height:1000}});
    const page=await ctx.newPage();
    const pageErrors=[],httpErrors=[];
    page.on("pageerror",e=>pageErrors.push(e.message));
    page.on("response",r=>{if(r.status()>=400)httpErrors.push(r.status()+" "+r.url())});
    await page.goto("http://127.0.0.1:4192"+route,{waitUntil:"networkidle",timeout:30000});
    await page.waitForFunction(()=>window.__V7_PAGE_DEBUG__?.ready===true,null,{timeout:20000});
    const state=await page.evaluate(()=>({
      debug:{...window.__V7_PAGE_DEBUG__},
      pointer:getComputedStyle(document.querySelector("#v7-page-canvas")).pointerEvents,
      width:document.documentElement.scrollWidth,
      viewport:innerWidth,
      overflowers:[...document.querySelectorAll("body *")].map(el=>{
        const r=el.getBoundingClientRect();
        return {tag:el.tagName,cls:el.className||"",id:el.id||"",left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width)};
      }).filter(x=>x.right>innerWidth+2||x.left<-2).sort((a,b)=>Math.max(b.right-innerWidth,-b.left)-Math.max(a.right-innerWidth,-a.left)).slice(0,8)
    }));
    assert(state.debug.scene===variant,route+" wrong scene "+state.debug.scene);
    assert(state.debug.webgl===true&&!state.debug.fallback,route+" WebGL failed");
    assert(state.debug.objects>=12,route+" object count too low: "+state.debug.objects);
    assert(state.pointer==="none",route+" canvas can block interaction");
    assert(state.width<=state.viewport+2,route+" desktop horizontal overflow: "+JSON.stringify(state.overflowers));
    assert(pageErrors.length===0,route+" page errors: "+pageErrors.join(" | "));
    assert(httpErrors.length===0,route+" HTTP errors: "+httpErrors.join(" | "));
    await page.screenshot({path:path.join(evidence,variant+"-desktop.png"),fullPage:false});
    await ctx.close();
  }

  for(const [route,variant] of pages){
    const ctx=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
    const page=await ctx.newPage();
    await page.goto("http://127.0.0.1:4192"+route,{waitUntil:"networkidle",timeout:30000});
    await page.waitForFunction(()=>window.__V7_PAGE_DEBUG__?.ready===true,null,{timeout:20000});
    const state=await page.evaluate(()=>({
      width:document.documentElement.scrollWidth,
      viewport:innerWidth,
      pointer:getComputedStyle(document.querySelector("#v7-page-canvas")).pointerEvents
    }));
    assert(state.width<=state.viewport+2,route+" phone horizontal overflow");
    assert(state.pointer==="none",route+" phone canvas can block taps");
    const toggle=page.locator(".v7-mobile-nav-toggle");
    assert(await toggle.isVisible(),route+" phone menu trigger missing");
    await toggle.click();
    await page.waitForFunction(()=>document.querySelector(".v7-mobile-nav-layer")?.classList.contains("is-open"),null,{timeout:3000});
    assert(await page.locator(".v7-mobile-nav-layer.is-open").isVisible(),route+" phone drawer failed");
    assert(await page.locator('.v7-mobile-drawer a[href="/website-studio/"]').isVisible(),route+" Studio route missing from mobile drawer");
    await page.screenshot({path:path.join(evidence,variant+"-phone-menu.png"),fullPage:false});
    await ctx.close();
  }

  const reduced=await browser.newContext({viewport:{width:1024,height:900},reducedMotion:"reduce"});
  for(const [route,variant] of pages){
    const page=await reduced.newPage();
    await page.goto("http://127.0.0.1:4192"+route,{waitUntil:"networkidle",timeout:30000});
    await page.waitForFunction(()=>window.__V7_PAGE_DEBUG__?.ready===true,null,{timeout:20000});
    const first=await page.evaluate(()=>({...window.__V7_PAGE_DEBUG__}));
    await page.waitForTimeout(350);
    const second=await page.evaluate(()=>({...window.__V7_PAGE_DEBUG__}));
    assert(first.reducedMotion===true,route+" reduced-motion flag missing");
    assert(first.frames===second.frames,route+" reduced-motion renderer still continuous: "+first.frames+" -> "+second.frames);
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
  await fallback.goto("http://127.0.0.1:4192/contact/",{waitUntil:"networkidle",timeout:30000});
  await fallback.waitForFunction(()=>window.__V7_PAGE_DEBUG__?.fallback===true,null,{timeout:10000});
  const fb=await fallback.evaluate(()=>({
    render:document.documentElement.dataset.v7PageRender||"",
    canvas:getComputedStyle(document.querySelector("#v7-page-canvas")).display,
    mainVisible:Boolean(document.querySelector("main")?.getBoundingClientRect().height)
  }));
  assert(fb.render==="fallback","fallback render marker missing");
  assert(fb.canvas==="none","fallback canvas still visible");
  assert(fb.mainVisible,"fallback HTML content not visible");
  await fallback.screenshot({path:path.join(evidence,"fallback-contact-phone.png"),fullPage:false});
  await fallbackCtx.close();

  const studioCtx=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  const studio=await studioCtx.newPage();
  await studio.goto("http://127.0.0.1:4192/website-studio/",{waitUntil:"networkidle",timeout:30000});
  await studio.waitForFunction(()=>window.__V7_PAGE_DEBUG__?.ready===true,null,{timeout:20000});
  const protocol=await studio.evaluate(()=>[...document.querySelectorAll(".studio-intro-map article")].map(article=>{
    const strong=article.querySelector("strong"),span=article.querySelector("span");
    return {
      article:article.getBoundingClientRect().width,
      strong:strong?.getBoundingClientRect().width||0,
      span:span?.getBoundingClientRect().width||0,
      wordBreak:strong?getComputedStyle(strong).wordBreak:""
    };
  }));
  assert(protocol.length===3,"Studio protocol should have three steps");
  protocol.forEach((x,i)=>{
    assert(x.article>300,"Studio protocol step "+(i+1)+" too narrow: "+x.article);
    assert(x.strong>220,"Studio protocol heading "+(i+1)+" too cramped: "+x.strong);
    assert(x.wordBreak!=="break-all","Studio protocol heading breaks all words");
  });
  await studio.screenshot({path:path.join(evidence,"studio-phone-protocol-fixed.png"),fullPage:false});
  await studioCtx.close();
}finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
}

if(failures.length){
  console.error("\nV7.6 INNER SCENES QA FAIL\n");
  failures.forEach(x=>console.error("- "+x));
  process.exit(1);
}
console.log("\nV7.6 INNER SCENES QA PASS\n");
console.log("- 8 distinct inner-page 3D environments initialized in Microsoft Edge");
console.log("- 8 phone layouts expose the shared mobile navigation");
console.log("- Canvas layers remain non-interactive");
console.log("- Reduced-motion scenes remain static");
console.log("- WebGL failure preserves usable HTML");
console.log("- Website Studio phone protocol legibility regression fixed");
