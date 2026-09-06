import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const read = rel => fs.readFileSync(path.join(root, rel), "utf8");
const exists = rel => fs.existsSync(path.join(root, rel));
const fail = msg => failures.push(msg);

const ette = "portfolio/projects/ette-planner.html";
if (!exists(ette)) fail("ETTE case study missing.");
else {
  const html = read(ette);
  for (const expected of [
    "CURRENT RELEASE · 4.6.0+47",
    "ETTE Exercise",
    "1.1.0+2",
    "ETTE Ward Care",
    "exercise-v1.1.0-build2",
    "ward-care-v1.1.0-build2",
    "ETTE CONNECTED APPS"
  ]) {
    if (!html.includes(expected)) fail(`ETTE ecosystem detail missing: ${expected}`);
  }
  if (html.includes("3.0.0+27")) fail("Old ETTE 3.0.0+27 version still appears on ETTE case study.");
}

if (!exists("visual-system-v47.css")) fail("Authoritative visual CSS missing.");
else if (!read("visual-system-v47.css").includes("iCHARLES V4.8.1 — ETTE ECOSYSTEM")) {
  fail("ETTE ecosystem CSS marker missing.");
}

if (exists("projects/index.html")) {
  const projects = read("projects/index.html");
  for (const expected of ["ETTE ECOSYSTEM", "PLANNER 4.6.0+47", "EXERCISE 1.1.0+2", "WARD CARE 1.1.0+2"]) {
    if (!projects.includes(expected)) fail(`Projects directory ETTE ecosystem detail missing: ${expected}`);
  }
}

if (exists("tools/site-qa.mjs")) {
  const mainQa = read("tools/site-qa.mjs");
  for (const expected of ["4.6.0+47", "exercise-v1.1.0-build2", "ward-care-v1.1.0-build2"]) {
    if (!mainQa.includes(expected)) fail(`Main QA missing ETTE ecosystem baseline: ${expected}`);
  }
}

if (failures.length) {
  console.error("\nICHARLES V4.8.1 ETTE QA FAIL\n");
  failures.forEach(x => console.error(`- ${x}`));
  process.exit(1);
}
console.log("\nICHARLES V4.8.1 ETTE ECOSYSTEM QA PASS");
