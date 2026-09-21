import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const scriptPath = path.join(root, "tools", "Deploy-V7-Public-Cloudflare.ps1");
const failures = [];
const fail = message => failures.push(message);

if (!fs.existsSync(scriptPath)) {
  fail("Deploy-V7-Public-Cloudflare.ps1 is missing");
} else {
  const ps1 = fs.readFileSync(scriptPath, "utf8");
  const required = [
    "status --porcelain",
    "fetch origin main",
    "branch --show-current",
    "rev-parse origin/main",
    'data-v7-home="production"',
    'data-v7-version="',
    "index,follow,max-image-preview:large",
    '<link rel="canonical" href="https://icharles.pages.dev/">',
    'data-icharles-schema="v44"',
    "noindex,nofollow,noarchive",
    "DDA9E772F1267325918D3608273124BD21A507B57BB49A9E2148EBFF0CBBB5FD",
    "v7-home-promotion-qa.mjs",
    "v7-foundation-qa.mjs",
    "site-qa.mjs",
    "v7-runtime-qa.mjs",
    "v7-resilience-qa.mjs",
    "v7-theme-contract-qa.mjs",
    "v7-inner-scenes-qa.mjs",
    "v7-inner-scenes-production-qa.mjs",
    "ExpectedInnerSceneVersion = '7.6.0'",
    "Invoke-NativeChecked -FilePath git -Arguments @('-C', $repoRoot, 'archive', '--format=zip', 'HEAD', '-o', $archive)",
    "wrangler@latest pages deploy",
    "--project-name $ProjectName",
    "--branch main",
    "https://icharles.pages.dev/",
    "https://icharles.pages.dev/experience/",
    "ICHARLES V7.6 FULL SITE PRODUCTION VERIFIED",
    "$createdTemporaryNodeModules = $false",
    "Pre-existing node_modules is present without playwright-core",
    "Remove-Item -LiteralPath $nodeModulesPath -Recurse -Force"
  ];

  for (const marker of required) {
    if (!ps1.includes(marker)) fail("Public release script missing safety marker: " + marker);
  }

  if (/reset\s+--hard/i.test(ps1)) fail("Public release script must not hard-reset the shared repository");
  if (/git\s+clean\s+-[a-z]*f/i.test(ps1)) fail("Public release script must not git-clean the shared repository");
  if (/Invoke-NativeChecked\s+git[^\n]*\barchive\b[^\n]*\s-o\s/i.test(ps1)) {
    fail("git archive must pass -o through the explicit -Arguments array");
  }
  if (/pages\s+deploy[\s\S]*experience[\\/]/i.test(ps1)) {
    fail("Public release script appears to deploy only experience/ instead of the exact full committed tree");
  }
  if (!/homeResponse\.Content\.Contains\('data-v7-home="production"'\)/.test(ps1)) {
    fail("Production probe must explicitly verify the public Home marker");
  }
  if (!/hiddenResponse\.Content\.Contains\('noindex,nofollow,noarchive'\)/.test(ps1)) {
    fail("Production probe must explicitly preserve hidden /experience/ noindex");
  }
  if (!/v7-runtime-qa\.mjs'[\s\S]*--base=\$ProductionRootUrl/.test(ps1)) {
    fail("Production runtime QA must target the Cloudflare public root");
  }
  if (!/v7-resilience-qa\.mjs'[\s\S]*--base=\$ProductionRootUrl/.test(ps1)) {
    fail("Production resilience QA must target the Cloudflare public root");
  }
  if (!/v7-theme-contract-qa\.mjs'[\s\S]*--origin=\$ProductionOrigin/.test(ps1)) {
    fail("Production theme QA must target the Cloudflare production origin");
  }
  if (!/v7-inner-scenes-production-qa\.mjs'[\s\S]*--origin=\$ProductionOrigin/.test(ps1)) {
    fail("Production inner-scene QA must target the Cloudflare production origin");
  }
  if (!/v7-inner-scenes-production-qa\.mjs'[\s\S]*--version=\$ExpectedInnerSceneVersion/.test(ps1)) {
    fail("Production inner-scene QA must bind to the expected V7.6 scene version");
  }
}

if (failures.length) {
  console.error("\nV7 PUBLIC RELEASE TOOLING QA FAIL\n");
  failures.forEach(message => console.error("- " + message));
  process.exit(1);
}

console.log("\nV7 PUBLIC RELEASE TOOLING QA PASS\n");
console.log("- Clean latest-main guard");
console.log("- Public V7 marker / SEO guard");
console.log("- Hidden /experience/ noindex boundary guard");
console.log("- Locked Iko integrity guard");
console.log("- Exact committed-tree Cloudflare deployment");
console.log("- Live public-root Edge runtime / resilience / theme verification");
console.log("- Live V7.6 inner-page Edge / mobile / fallback verification");
console.log("- Temporary Playwright cleanup");
