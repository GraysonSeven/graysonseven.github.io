# Module 2 Real Pilot — V1.0.0+10

Date: **2026-09-20**  
Pilot branch: `pilot/module2-real-workflow-2026-09-20`  
Product baseline: **Clientbound 1.0.0+10**

## Scope and integrity boundary

This is a real product-workflow pilot using current public prospect evidence.

The assistant operated the learner-side research workflow at the user's direction, then the instructor-side review workflow on a simulated separate device.

This pilot can verify:

- the Module 2 evidence contract;
- learner readiness and immutable submission;
- the 9/10 four-proof quality gate;
- instructor PASS/REVISE handling;
- cross-device review-package and decision exchange;
- exact submission/revision protection;
- backup and fresh-device restore.

It does **not** establish that the human learner independently demonstrated the research skill. The existing human learner record therefore remains **Module 2 — IN PROGRESS** unless the learner independently performs the research task.

## Module 2 ICP

**Sample client:** Alta Dev Studio

**Industry:** US Midwest manufacturers and distributors  
**Geography:** Ohio, Michigan, Indiana, Wisconsin  
**Company size:** approximately 50–500 employees  
**Target roles:** operations leadership; Controller/finance leadership; IT Director/VP IT/technology leadership

**Exclusions:**

- outside the Midwest;
- clearly under ~50 or over 500 employees;
- unresolved size evidence;
- no legitimate contact route;
- generic reason only;
- guessed email;
- role outside the buying problem.

## Ten-lead four-proof audit

| # | Company | Contact | Role | Audit | Main evidence |
|---|---|---|---|---|---|
| 1 | Nolte Precise Manufacturing | Jordan Rings | Operations Manager | PASS | Current Operations Manager posting describes an approximately 50-person Cincinnati precision manufacturer and explicit workflow/capacity/bottleneck responsibilities. |
| 2 | Grand River Rubber & Plastics | Keith Wyatt | Chief Operating Officer | PASS | Ohio plastics manufacturer; public size fits; official directory publishes COO role/contact; official material describes automated manufacturing/quality and production scheduling. |
| 3 | JAG Mobile Solutions | Mike Anderson | Operations Manager | PASS | Indiana specialty trailer manufacturer; current company post identifies Operations Manager; official phone/contact route; current remote-monitoring product activity. |
| 4 | Kinetico Incorporated | Ned Sherry | VP Information Technology | PASS | Ohio manufacturer; public IT leadership role; Kinetico publicly described a Salesforce→JDE process that was automated and an API-standardization initiative. |
| 5 | FluiDyne Fluid Power | Jeff Caldwell | VP Operations & Supply Chain | PASS | Michigan machinery manufacturer, public 51–200 band; current NFPA/LinkedIn role; official company contact route; dedicated manufacturing/remanufacturing operations organization. |
| 6 | Kowalski Companies | Crystal Towery | Controller | PASS | Michigan food manufacturer, public 51–200 band; current Controller; current Assistant Controller hiring references plant ops, inventory, audits, reporting and ERP work. |
| 7 | Brennan Industries | Michael Carr | Operations, General Manager | PASS | Ohio industrial manufacturer/distributor; current NFPA role; official headquarters route; multi-location manufacturing/distribution creates defensible process complexity. |
| 8 | Price Engineering | Ty Barnes | Production Operations Manager | PASS | Wisconsin industrial engineering/manufacturing company; current production-operations role; official contact route; engineering, automation, assembly, repair and kitting functions. |
| 9 | Central Conveyor | Mike Fagan | Director of Operations | PASS | Michigan systems integrator; official leadership/contact; multi-location engineering/fabrication/project-management/system-integration operation. Facility-level headcount discrepancy is explicitly noted. |
| 10 | The Paquin Company | Tom Colbert | Operations Manager | **FAIL** | Industry, role and contact route pass, but company-size evidence conflicts: LinkedIn lists 51–200 while other current public sources list 11–50. Reject until verified/replaced. |

**Result: 9 PASS / 1 FAIL — Module 2 quality gate met.**

## Key source set

- Nolte Precise Manufacturing Operations Manager: https://www.linkedin.com/jobs/view/operations-manager-at-nolte-precise-manufacturing-4452662121
- Grand River Rubber contact directory: https://www.grandriverrubber.com/contact/
- Grand River Rubber manufacturing FAQ: https://www.grandriverrubber.com/about/faq/
- JAG Mobile Solutions: https://www.linkedin.com/company/jag-mobile-solutions
- JAG official contact: https://www.jagmobilesolutions.com/contact.php
- Kinetico / Ned Sherry role: https://noccog-area19.com/wib/wib-members/
- Kinetico integration evidence: https://www.magicsoftwareinc.com/what-we-do/jd-edwards
- Kinetico official contact: https://www.kinetico.com/customer-support/
- FluiDyne company profile: https://www.linkedin.com/company/fluidyne
- NFPA 2025 attendee roster: https://nationalfluidpowerassociation.swoogo.com/nfpaac25/attendees
- FluiDyne official staff: https://www.fluidynefp.com/People.aspx
- Kowalski Companies: https://www.linkedin.com/company/kowalski-companies
- Brennan official US locations: https://brennaninc.com/united-states/
- Price Engineering official contact: https://www.priceeng.com/contact/
- Price Engineering / Ty Barnes: https://www.linkedin.com/in/tybarnes
- Central Conveyor leadership: https://centralconveyor.com/about-us/company-leadership/
- Central Conveyor contact: https://centralconveyor.com/contact-us/
- Paquin official team: https://paquin.com/pages/about
- Paquin LinkedIn size: https://www.linkedin.com/company/paquin
- Paquin conflicting 11–50 source: https://jobs.clevelandtalent.org/companies/the-paquin-company-2

## Instructor decision

**PASS**

Feedback:

> 9/10 leads satisfy all four proofs. Paquin is correctly rejected because current company-size evidence conflicts. Keep that rejection discipline: do not force a lead into the ICP when one proof remains unresolved.

## Automated product-path verification

`test/module2_real_pilot_test.dart` executes the real V1.0 stores/contracts:

1. Populate the Module 2 structured workspace with the 10-lead batch.
2. Complete all three Module 2 learner tasks.
3. Confirm no readiness issues.
4. Submit an immutable Module 2 revision.
5. Build the portable learner review package.
6. Create a pending learner backup.
7. Reset storage to represent a separate instructor device.
8. Import the learner review package.
9. Verify exactly 9 PASS / 1 FAIL.
10. Record instructor PASS and generate decision JSON.
11. Reset storage to represent return to the learner device.
12. Restore the pending learner backup.
13. Verify a tampered revision decision is rejected.
14. Apply the exact matching instructor decision.
15. Verify Module 2 becomes PASS in that pilot state.
16. Create a final backup.
17. Reset storage to a fresh device.
18. Restore the final backup and verify the passed submission, feedback, and all 10 evidence rows survive.

## Human learner record

**Unchanged: Module 2 — IN PROGRESS.**

Reason: the product pilot proves the workflow and quality gate with assistant-operated research, not independent human performance.
