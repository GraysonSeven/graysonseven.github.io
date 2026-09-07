import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";

const args = Object.fromEntries(process.argv.slice(2).map(arg => {
  const idx = arg.indexOf("=");
  return idx > -1 ? [arg.slice(0,idx).replace(/^--/,""), arg.slice(idx+1)] : [arg.replace(/^--/,""), true];
}));

const mode = args.mode || "capture";
const siteRoot = path.resolve(args["site-root"] || process.cwd());
const profileDir = path.resolve(args["profile-dir"]);
const outputRoot = path.resolve(args["output-root"]);
const configPath = path.resolve(args.config || path.join(siteRoot,"tools","app-showcase-config.json"));
const config = JSON.parse(fs.readFileSync(configPath,"utf8"));
const viewport = config.viewport || {width:1440,height:900};

fs.mkdirSync(profileDir,{recursive:true});
fs.mkdirSync(outputRoot,{recursive:true});

const safe = value => String(value).replace(/[^a-z0-9._-]+/gi,"-").replace(/^-+|-+$/g,"");
const waitForSettled = async page => {
  try { await page.waitForLoadState("domcontentloaded",{timeout:20000}); } catch {}
  try { await page.waitForLoadState("networkidle",{timeout:5000}); } catch {}
  await page.waitForTimeout(2800);
};

const authWall = async page => {
  let text = "";
  try { text = (await page.locator("body").innerText({timeout:2500})).toLowerCase(); } catch {}
  return /(sign\s*in|log\s*in|login|enter your email|email address.*password)/i.test(text);
};

const context = await chromium.launchPersistentContext(profileDir,{
  channel:"msedge",
  headless: mode !== "setup-auth",
  viewport,
  colorScheme:"dark",
  reducedMotion:"reduce",
  locale:"en-US",
  args:["--disable-notifications","--disable-features=TranslateUI","--no-first-run"]
});

if(mode === "setup-auth"){
  console.log("\nICHARLES APP SHOWCASE AUTH SETUP");
  console.log("A dedicated Edge profile is open.");
  console.log("Log in only to apps that require it. Use a safe/demo account when possible.");
  console.log("Do NOT enter credentials in PowerShell. Edge stores the session locally.");
  console.log("When you are finished, CLOSE ALL WINDOWS opened by this showcase profile.\n");

  for(const app of config.apps.filter(app => app.requiresAuth)){
    const page = await context.newPage();
    await page.goto(app.url,{waitUntil:"domcontentloaded",timeout:30000}).catch(()=>{});
  }
  await new Promise(resolve => context.on("close",resolve));
  fs.writeFileSync(path.join(profileDir,".auth-session-initialized"),new Date().toISOString(),"utf8");
  process.exit(0);
}

const manifest = {
  version:"6.2",
  generated_at:new Date().toISOString(),
  viewport,
  apps:[],
  skipped:[]
};

async function findNavigation(page, labels){
  for(const raw of labels || []){
    const rx = new RegExp(raw.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"i");
    const locators = [
      page.getByRole("link",{name:rx}),
      page.getByRole("button",{name:rx}),
      page.getByText(rx,{exact:false})
    ];
    for(const locator of locators){
      try{
        const count = await locator.count();
        for(let i=0;i<Math.min(count,4);i++){
          const item=locator.nth(i);
          if(await item.isVisible({timeout:500}).catch(()=>false)) return item;
        }
      }catch{}
    }
  }
  return null;
}

for(const app of config.apps){
  const page = await context.newPage();
  const appDir = path.join(outputRoot,app.id);
  fs.mkdirSync(appDir,{recursive:true});

  try{
    console.log(`CAPTURE ${app.title}`);
    await page.goto(app.url,{waitUntil:"domcontentloaded",timeout:35000});
    await waitForSettled(page);

    if(app.requiresAuth && await authWall(page)){
      manifest.skipped.push({id:app.id,reason:"AUTH_REQUIRED_OR_SESSION_NOT_READY"});
      console.log(`  SKIP ${app.title}: authentication is still required.`);
      await page.close();
      continue;
    }

    const shots=[];
    const rootFile = path.join(appDir,"overview.jpg");
    await page.screenshot({path:rootFile,type:"jpeg",quality:90,fullPage:false});
    shots.push({
      id:"overview",
      label:app.screens?.[0]?.label || "Application Overview",
      file:`/assets/showcase/${app.id}/overview.jpg`
    });

    for(const screen of (app.screens || []).slice(1)){
      await page.goto(app.url,{waitUntil:"domcontentloaded",timeout:35000}).catch(()=>{});
      await waitForSettled(page);
      const target = await findNavigation(page,screen.nav);
      if(!target){
        console.log(`  NAV MISS ${screen.id}`);
        continue;
      }

      try{
        await target.click({timeout:4000});
        await waitForSettled(page);
        const fileName=`${safe(screen.id)}.jpg`;
        await page.screenshot({path:path.join(appDir,fileName),type:"jpeg",quality:90,fullPage:false});
        shots.push({id:screen.id,label:screen.label,file:`/assets/showcase/${app.id}/${fileName}`});
        console.log(`  CAPTURED ${screen.id}`);
      }catch(error){
        console.log(`  NAV FAIL ${screen.id}: ${error.message.split("\n")[0]}`);
      }
    }

    manifest.apps.push({
      id:app.id,
      title:app.title,
      url:app.url,
      captured_at:new Date().toISOString(),
      screens:shots
    });
  }catch(error){
    manifest.skipped.push({id:app.id,reason:error.message.split("\n")[0]});
  }finally{
    if(!page.isClosed()) await page.close();
  }
}

fs.writeFileSync(path.join(outputRoot,"manifest.json"),JSON.stringify(manifest,null,2),"utf8");
await context.close();

console.log(`\nCaptured ${manifest.apps.reduce((n,a)=>n+a.screens.length,0)} showcase screen(s).`);
if(manifest.skipped.length){
  console.log("Skipped:");
  for(const item of manifest.skipped) console.log(`- ${item.id}: ${item.reason}`);
}
