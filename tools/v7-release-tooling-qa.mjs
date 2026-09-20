import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const scriptPath = path.join(root, "tools", "Deploy-V7-Hidden-Cloudflare.ps1");
const failures = [];

const fail = message => failures.push(message);

if (!fs.existsSync(scriptPath)) {
  fail("Deploy-V7-Hidden-Cloudflare.ps1 is missing");
} else {
  const ps1 = fs.readFileSync(scriptPath, "utf8");
  const required = [
    "status --porcelain",
    "Read-NativeText git -C $repoRoot",
    "fetch origin main",
    "branch --show-current",
    "rev-parse origin/main",
    'data-v7-version="',
    "noindex,nofollow,noarchive",
    "DDA9E772F1267325918D3608273124BD21A507B57BB49A9E2148EBFF0CBBB5FD",
    "v7-foundation-qa.mjs",
    "site-qa.mjs",
    "v7-runtime-qa.mjs",
    "v7-resilience-qa.mjs",
    "v7-theme-contract-qa.mjs",
    "Invoke-NativeChecked -FilePath git -Arguments @(\'-C\', $repoRoot, \'archive\', \'--format=zip\', \'HEAD\', \'-o\', $archive)",
    "wrangler@latest pages deploy",
    "--project-name $ProjectName",
    "--branch main",
    "icharles.pages.dev/experience/",
    "Public /: unchanged"
  ];

  for (const marker of required) {
    if (!ps1.includes(marker)) fail("Release script missing safety marker: " + marker);
  }

  if (/reset\s+--hard/i.test(ps1)) fail("Release script must not hard-reset the shared repository");
  if (/git\s+clean\s+-[a-z]*f/i.test(ps1)) fail("Release script must not git-clean the shared repository");
  if (/Invoke-NativeChecked\\s+git[^\\n]*\\barchive\\b[^\\n]*\\s-o\\s/i.test(ps1)) {
    fail("git archive must pass -o through the explicit -Arguments array to avoid PowerShell parameter binding");
  }

  if (/pages\s+deploy[\s\S]*experience[\\/]/i.test(ps1)) {
    fail("Release script appears to deploy only experience/ instead of an exact full committed tree");
  }
}

const homePath = path.join(root, "index.html");
if (!fs.existsSync(homePath)) fail("Public Home index.html is missing");

if (failures.length) {
  console.error("\nV7 RELEASE TOOLING QA FAIL\n");
  failures.forEach(message => console.error("- " + message));
  process.exit(1);
}

console.log("\nV7 RELEASE TOOLING QA PASS\n");
console.log("- Guarded clean-main deployment");
console.log("- Locked Iko integrity guard");
console.log("- Exact git-archive deployment");
console.log("- Hidden /experience/ production verification");
console.log("- Public Home untouched by release tooling");
