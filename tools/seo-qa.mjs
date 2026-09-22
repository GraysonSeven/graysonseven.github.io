import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const failures=[];
const fail=m=>failures.push(m);

const pages=[
  ["index.html","https://icharles.pages.dev/"],
  ["services/index.html","https://icharles.pages.dev/services/"],
  ["website-studio/index.html","https://icharles.pages.dev/website-studio/"],
  ["portfolio/index.html","https://icharles.pages.dev/portfolio/"],
  ["try/index.html","https://icharles.pages.dev/try/"],
  ["about/index.html","https://icharles.pages.dev/about/"],
  ["contact/index.html","https://icharles.pages.dev/contact/"],
  ["portfolio/projects/trade-core.html","https://icharles.pages.dev/portfolio/projects/trade-core.html"],
  ["portfolio/projects/trade-core-custom-business.html","https://icharles.pages.dev/portfolio/projects/trade-core-custom-business.html"],
  ["portfolio/projects/morsebound.html","https://icharles.pages.dev/portfolio/projects/morsebound.html"],
  ["portfolio/projects/ette-planner.html","https://icharles.pages.dev/portfolio/projects/ette-planner.html"],
  ["privacy/index.html","https://icharles.pages.dev/privacy/"]
];

const noindexPaths=[
  ["projects/index.html","https://icharles.pages.dev/projects/"],
  ["lab/index.html","https://icharles.pages.dev/lab/"],
  ["experience/index.html","https://icharles.pages.dev/experience/"]
];

const titles=new Map(),descs=new Map();
const matchAll=(text,re)=>[...text.matchAll(re)];

for(const [file,url] of pages){
  const full=path.join(root,file);
  if(!fs.existsSync(full)){fail(file+" missing");continue}
  const html=fs.readFileSync(full,"utf8");

  const titleMatches=matchAll(html,/<title>([\s\S]*?)<\/title>/gi);
  const descMatches=matchAll(html,/<meta\s+name=["']description["']\s+content=["']([^"']*)["'][^>]*>/gi);
  const canonicalMatches=matchAll(html,/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["'][^>]*>/gi);
  const robotsMatches=matchAll(html,/<meta\s+name=["']robots["']\s+content=["']([^"']+)["'][^>]*>/gi);

  if(titleMatches.length!==1)fail(file+" must contain exactly one <title>; found "+titleMatches.length);
  if(descMatches.length!==1)fail(file+" must contain exactly one meta description; found "+descMatches.length);
  if(canonicalMatches.length!==1)fail(file+" must contain exactly one canonical; found "+canonicalMatches.length);
  if(robotsMatches.length!==1)fail(file+" must contain exactly one robots meta; found "+robotsMatches.length);

  const title=(titleMatches[0]?.[1]||"").trim();
  const desc=(descMatches[0]?.[1]||"").trim();
  const canonical=(canonicalMatches[0]?.[1]||"").trim();
  const robots=(robotsMatches[0]?.[1]||"").toLowerCase();

  if(title.length<20||title.length>75)fail(file+" title length should be 20-75 chars; got "+title.length);
  if(desc.length<70||desc.length>180)fail(file+" meta description length should be 70-180 chars; got "+desc.length);
  if(canonical!==url)fail(file+" canonical mismatch: "+canonical+" expected "+url);
  if(!robots.includes("index")||robots.includes("noindex"))fail(file+" must be indexable");
  if(/<meta\s+name=["']keywords["']/i.test(html))fail(file+" must not use obsolete meta keywords");

  if(titles.has(title))fail(file+" duplicates title used by "+titles.get(title)); else titles.set(title,file);
  if(descs.has(desc))fail(file+" duplicates description used by "+descs.get(desc)); else descs.set(desc,file);

  const jsonLd=matchAll(html,/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for(const [i,m] of jsonLd.entries()){
    try{JSON.parse(m[1])}catch(e){fail(file+" JSON-LD #"+(i+1)+" is invalid: "+e.message)}
  }
}

const sitemapPath=path.join(root,"sitemap.xml");
const googleSitemapPath=path.join(root,"sitemap-google.xml");
if(!fs.existsSync(sitemapPath))fail("sitemap.xml missing");
if(!fs.existsSync(googleSitemapPath))fail("sitemap-google.xml missing");
else if(fs.existsSync(sitemapPath)&&fs.readFileSync(googleSitemapPath,"utf8")!==fs.readFileSync(sitemapPath,"utf8"))fail("sitemap-google.xml must exactly mirror sitemap.xml");
else{
  const sitemap=fs.readFileSync(sitemapPath,"utf8");
  const locs=matchAll(sitemap,/<loc>([^<]+)<\/loc>/g).map(m=>m[1].trim());
  const expected=pages.map(x=>x[1]);
  if(new Set(locs).size!==locs.length)fail("sitemap.xml contains duplicate URLs");
  for(const url of expected)if(!locs.includes(url))fail("sitemap.xml missing "+url);
  for(const url of locs)if(!expected.includes(url))fail("sitemap.xml contains unexpected/non-indexable URL "+url);
  for(const [,url] of noindexPaths)if(locs.includes(url))fail("sitemap.xml must exclude noindex URL "+url);
  if(!sitemap.includes("<lastmod>2026-09-22</lastmod>"))fail("sitemap.xml missing current lastmod markers");
}

for(const [file,url] of noindexPaths){
  const full=path.join(root,file);
  if(!fs.existsSync(full)){fail(file+" missing");continue}
  const html=fs.readFileSync(full,"utf8");
  if(!/name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html))fail(file+" expected to remain noindex");
}

const headersPath=path.join(root,"_headers");
if(!fs.existsSync(headersPath))fail("_headers missing");
else{
  const headers=fs.readFileSync(headersPath,"utf8");
  if(!/\/sitemap\.xml\s+[\s\S]*?Content-Type:\s*application\/xml;\s*charset=utf-8/i.test(headers))fail("_headers must force sitemap.xml Content-Type to application/xml; charset=utf-8");
  if(!/\/sitemap-google\.xml\s+[\s\S]*?Content-Type:\s*application\/xml;\s*charset=utf-8/i.test(headers))fail("_headers must force sitemap-google.xml Content-Type to application/xml; charset=utf-8");
  if(!/\/robots\.txt\s+[\s\S]*?Content-Type:\s*text\/plain;\s*charset=utf-8/i.test(headers))fail("_headers must force robots.txt Content-Type to text/plain; charset=utf-8");
}

const robotsPath=path.join(root,"robots.txt");
if(!fs.existsSync(robotsPath))fail("robots.txt missing");
else{
  const robots=fs.readFileSync(robotsPath,"utf8");
  if(!/User-agent:\s*\*/i.test(robots))fail("robots.txt missing User-agent: *");
  if(!/Allow:\s*\//i.test(robots))fail("robots.txt missing Allow: /");
  if(!/Sitemap:\s*https:\/\/icharles\.pages\.dev\/sitemap\.xml/i.test(robots))fail("robots.txt missing canonical sitemap declaration");
}

const homeRaw=fs.readFileSync(path.join(root,"index.html"),"utf8");
const verificationMatches=matchAll(homeRaw,/<meta\s+name=["']google-site-verification["']\s+content=["']([^"']+)["'][^>]*>/gi);
if(verificationMatches.length!==1)fail("Home must contain exactly one Google site verification tag; found "+verificationMatches.length);
else if(verificationMatches[0][1]!=="MRRu1NDzlETJMlpcnAKb4S9ydIQzzzwZyILnHwpqfX4")fail("Google site verification token changed unexpectedly");
const home=homeRaw.toLowerCase();
for(const phrase of ["custom software","web apps","business systems"])if(!home.includes(phrase))fail("Home missing natural primary phrase: "+phrase);

if(failures.length){
  console.error("\nICHARLES SEO QA FAIL\n");
  failures.forEach(m=>console.error("- "+m));
  process.exit(1);
}
console.log("\nICHARLES SEO QA PASS\n");
console.log("- 12 canonical indexable URLs match sitemap.xml");
console.log("- noindex utility/experimental pages excluded");
console.log("- titles and meta descriptions are unique");
console.log("- canonicals, robots directives and JSON-LD validated");
console.log("- robots.txt advertises the canonical sitemap");
console.log("- Google Search Console verification token is pinned");
console.log("- sitemap.xml, sitemap-google.xml and robots.txt response MIME types are pinned");
console.log("- fresh Google sitemap endpoint exactly mirrors canonical sitemap");
