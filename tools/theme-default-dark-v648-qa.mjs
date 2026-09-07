import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const failures = [];
const fail = m => failures.push(m);
const read = p => fs.readFileSync(path.join(root,p),"utf8");
const exists = p => fs.existsSync(path.join(root,p));

const locked = "assets/iko-prime/identity/iko-prime-logo-locked.png";
if (!exists(locked)) fail("Locked Iko identity missing.");
else {
  const sha = crypto.createHash("sha256")
    .update(fs.readFileSync(path.join(root,locked)))
    .digest("hex").toUpperCase();
  if (sha !== "DDA9E772F1267325918D3608273124BD21A507B57BB49A9E2148EBFF0CBBB5FD") fail(`Locked Iko identity changed: ${sha}`);
}

for (const p of ["ghostops-theme-boot-v60.js","ghostops-v60.js"]) {
  if (!exists(p)) fail(`Theme file missing: ${p}`);
}

if (exists("ghostops-theme-boot-v60.js")) {
  const boot = read("ghostops-theme-boot-v60.js");

  if (!boot.includes('theme = "dark";'))
    fail("First-visit fallback is not explicitly dark.");

  if (boot.includes('matchMedia("(prefers-color-scheme: light)")'))
    fail("Boot script still follows system light preference.");

  if (!boot.includes('localStorage.getItem("icharles-ui-theme")'))
    fail("Saved manual theme preference is no longer respected.");

  if (!boot.includes('params.get("vqa-theme")'))
    fail("Visual-QA explicit theme override was lost.");
}

if (exists("ghostops-v60.js")) {
  const runtime = read("ghostops-v60.js");

  if (runtime.includes('const scheme = matchMedia("(prefers-color-scheme: light)")'))
    fail("Runtime still listens to system theme changes.");

  if (!runtime.includes('localStorage.setItem(storageKey, theme)'))
    fail("Manual theme toggle no longer persists.");

  if (!runtime.includes('applyTheme(getTheme(), false);'))
    fail("Theme controls are not synchronized from boot state.");
}

if (failures.length) {
  console.error("\nICHARLES V6.4.8 DARK DEFAULT QA FAIL\n");
  failures.forEach(x => console.error(`- ${x}`));
  process.exit(1);
}

console.log("\nICHARLES V6.4.8 DARK DEFAULT QA PASS\n");
console.log("- First visit/no saved preference defaults to DARK.");
console.log("- System light preference no longer changes the site automatically.");
console.log("- A user-selected LIGHT theme remains persistent.");
console.log("- vqa-theme=dark/light still overrides the default for automated QA.");
console.log("- Locked Iko identity hash remains exact.");
