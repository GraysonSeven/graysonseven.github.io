import 'dart:convert';

import 'package:clientbound/app_constants.dart';
import 'package:clientbound/app_settings_store.dart';
import 'package:clientbound/backup_service.dart';
import 'package:clientbound/community_store.dart';
import 'package:clientbound/course_catalog.dart';
import 'package:clientbound/progress_store.dart';
import 'package:clientbound/review_exchange.dart';
import 'package:clientbound/review_exchange_store.dart';
import 'package:clientbound/review_package.dart';
import 'package:clientbound/workspace_store.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

class _PilotStores {
  _PilotStores({
    required this.progress,
    required this.community,
    required this.settings,
    required this.workspace,
    required this.reviewExchange,
  });

  final ProgressStore progress;
  final CommunityStore community;
  final AppSettingsStore settings;
  final WorkspaceStore workspace;
  final ReviewExchangeStore reviewExchange;
}

Future<_PilotStores> _loadStores() async {
  final progress = ProgressStore();
  final community = CommunityStore();
  final settings = AppSettingsStore();
  final workspace = WorkspaceStore();
  final reviewExchange = ReviewExchangeStore();

  await progress.load();
  await community.load();
  await settings.load();
  await workspace.load();
  await reviewExchange.load();

  return _PilotStores(
    progress: progress,
    community: community,
    settings: settings,
    workspace: workspace,
    reviewExchange: reviewExchange,
  );
}

BackupService _backup(_PilotStores stores) => BackupService(
      progress: stores.progress,
      community: stores.community,
      settings: stores.settings,
      workspace: stores.workspace,
      reviewExchange: stores.reviewExchange,
      appVersion: clientboundVersion,
    );

void main() {
  test(
    'real Module 2 pilot completes learner submission, instructor review, '
    'cross-device exchange, and backup restore',
    () async {
      SharedPreferences.setMockInitialValues(<String, Object>{});
      final learner = await _loadStores();

      // Preserve the known real learner baseline and representative local data.
      await learner.progress.setStage(1, ModuleStage.passed);
      await learner.settings.completeOnboarding();
      await learner.community.addPost(
        category: 'Practice',
        title: 'Module 2 real pilot',
        body: 'Preserve this local pilot marker through backup restore.',
      );

      learner.workspace
        ..setString(2, 'industry', 'US Midwest manufacturers and distributors')
        ..setString(2, 'geography', 'Ohio, Michigan, Indiana, and Wisconsin')
        ..setString(
          2,
          'companySize',
          'Approximately 50-500 employees; reject unresolved borderline size signals.',
        )
        ..setString(
          2,
          'targetRoles',
          'Operations leadership; Controller/finance leadership; '
              'IT Director/VP IT/technology leadership.',
        )
        ..setString(
          2,
          'exclusions',
          'Outside the Midwest; clearly under ~50 or over 500 employees; '
              'no legitimate contact route; generic reason only; guessed email; '
              'role outside the buying problem.',
        );

      const columns = <String>[
        'company',
        'contact',
        'role',
        'contactRoute',
        'companyProof',
        'roleProof',
        'contactProof',
        'reasonProof',
        'source',
        'audit',
      ];
      learner.workspace.ensureTableRows(2, 'leadResearch', columns, 10);

      final rows = <Map<String, String>>[
        <String, String>{
          'company': 'Nolte Precise Manufacturing',
          'contact': 'Jordan Rings',
          'role': 'Operations Manager',
          'contactRoute':
              'LinkedIn job-poster/profile route + official company main line 513-923-3100; no guessed direct email.',
          'companyProof':
              'Cincinnati precision contract manufacturer serving aerospace, defense, hydraulic motion control, medical device, and industrial markets; current Operations Manager posting describes an approximately 50-person operation.',
          'roleProof':
              'Current public Operations Manager posting identifies Jordan Rings as Operations Manager, a direct match to the campaign persona.',
          'contactProof':
              'Legitimate LinkedIn route and official company phone are public; no unverifiable personal email is used.',
          'reasonProof':
              'Current operations role owns production schedule execution, machine/labor prioritization, utilization, capacity, downtime, bottlenecks, continuous improvement, setup efficiency, throughput, and workflow.',
          'source':
              'https://www.linkedin.com/jobs/view/operations-manager-at-nolte-precise-manufacturing-4452662121 | https://www.nolteprecise.com/',
          'audit': 'PASS — 4/4 proofs',
        },
        <String, String>{
          'company': 'Grand River Rubber & Plastics',
          'contact': 'Keith Wyatt',
          'role': 'Chief Operating Officer',
          'contactRoute':
              'Official employee directory: 440-998-2900 ext. 153 and kwyatt@grrp.com.',
          'companyProof':
              'Ashtabula, Ohio plastics manufacturer; LinkedIn lists 51-200 employees and the official site describes high-volume rubber manufacturing.',
          'roleProof':
              'Official company directory identifies Keith Wyatt as Chief Operating Officer.',
          'contactProof':
              'Official company contact directory publishes the COO route directly.',
          'reasonProof':
              'Official company material describes automation integrated with quality systems and production scheduling, while the COO is responsible for operations across product lines—specific operational-process relevance without claiming a software pain.',
          'source':
              'https://www.grandriverrubber.com/contact/ | https://www.grandriverrubber.com/about/faq/ | https://www.linkedin.com/company/grand-river-rubber-%26-plastics',
          'audit': 'PASS — 4/4 proofs',
        },
        <String, String>{
          'company': 'JAG Mobile Solutions',
          'contact': 'Mike Anderson',
          'role': 'Operations Manager',
          'contactRoute':
              'Official company main line 800-815-2557 / 260-562-1045 and contact form; LinkedIn role route.',
          'companyProof':
              'Howe, Indiana specialty commercial trailer manufacturer; LinkedIn company profile is in the target company-size band.',
          'roleProof':
              'Current company LinkedIn post identifies Mike Anderson as Operations Manager.',
          'contactProof':
              'Official company website provides phone and contact form; no direct email is guessed.',
          'reasonProof':
              'Current company activity includes JAGwatch remote monitoring and ongoing product/facility expansion, creating a defensible operations-and-systems research signal without asserting an unverified pain.',
          'source':
              'https://www.linkedin.com/company/jag-mobile-solutions | https://www.jagmobilesolutions.com/contact.php',
          'audit': 'PASS — 4/4 proofs',
        },
        <String, String>{
          'company': 'Kinetico Incorporated',
          'contact': 'Ned Sherry',
          'role': 'VP Information Technology',
          'contactRoute':
              'Official Kinetico main line 440-564-9111 / customersupport@kinetico.com plus public professional-role route.',
          'companyProof':
              'Newbury, Ohio manufacturer in the target company-size band with established US manufacturing operations.',
          'roleProof':
              'Area 19 Workforce Development Board and Magic Software customer material identify Ned Sherry as VP Information Technology.',
          'contactProof':
              'Official Kinetico customer-support page publishes company phone/email; role is independently public.',
          'reasonProof':
              'Kinetico publicly described a Salesforce-to-JDE process that took about 45 minutes before being automated and a global initiative to standardize on one API tool—direct account-specific integration evidence.',
          'source':
              'https://noccog-area19.com/wib/wib-members/ | https://www.magicsoftwareinc.com/what-we-do/jd-edwards | https://www.kinetico.com/customer-support/',
          'audit': 'PASS — 4/4 proofs',
        },
        <String, String>{
          'company': 'FluiDyne Fluid Power',
          'contact': 'Jeff Caldwell',
          'role': 'VP of Operations & Supply Chain',
          'contactRoute':
              'Official company phone 586-296-7200 plus public LinkedIn/NFPA professional route.',
          'companyProof':
              'Fraser, Michigan machinery manufacturer; LinkedIn lists 51-200 employees.',
          'roleProof':
              '2025 NFPA attendee roster and current LinkedIn profile identify Jeff Caldwell as VP of Operations & Supply Chain.',
          'contactProof':
              'Official company site publishes its main phone and staff routes; role is independently current in professional sources.',
          'reasonProof':
              'FluiDyne manufactures/remanufactures pumps, motors, and valves with a dedicated operations/supply-chain organization; current operational structure makes workflow/process research relevant without asserting a pain.',
          'source':
              'https://www.linkedin.com/company/fluidyne | https://nationalfluidpowerassociation.swoogo.com/nfpaac25/attendees | https://www.fluidynefp.com/People.aspx',
          'audit': 'PASS — 4/4 proofs',
        },
        <String, String>{
          'company': 'Kowalski Companies',
          'contact': 'Crystal Towery',
          'role': 'Controller',
          'contactRoute':
              'LinkedIn/company professional route; no scraped or guessed personal contact detail is used.',
          'companyProof':
              'Hamtramck, Michigan food manufacturer; LinkedIn lists 51-200 employees.',
          'roleProof':
              'Crystal Towery is publicly listed as Controller at Kowalski Companies and appears in the company employee listing.',
          'contactProof':
              'Legitimate company/LinkedIn route exists; scraped personal phone/email data is deliberately excluded.',
          'reasonProof':
              'Current Assistant Controller hiring covers plant operations, inventory, audits, direct labor, transaction controls, internal reporting, and ERP experience—specific finance/operations workflow relevance.',
          'source':
              'https://www.linkedin.com/company/kowalski-companies | https://www.signalhire.com/profiles/crystal-towery%27s-email/55124808',
          'audit': 'PASS — 4/4 proofs',
        },
        <String, String>{
          'company': 'Brennan Industries',
          'contact': 'Michael Carr',
          'role': 'Operations, General Manager',
          'contactRoute':
              'Official Cleveland headquarters 440-248-1880 / 800-331-1523 plus NFPA professional route.',
          'companyProof':
              'Solon, Ohio industrial manufacturer/distributor with multiple US manufacturing/distribution locations and target-band company scale.',
          'roleProof':
              '2025 NFPA attendee roster identifies Michael Carr of Brennan Industries as Operations, General Manager.',
          'contactProof':
              'Official Brennan location page publishes headquarters phone numbers; NFPA independently confirms the current role.',
          'reasonProof':
              'Brennan operates manufacturing and distribution across multiple sites and large product breadth, creating account-specific process/integration complexity relevant to an operations conversation without claiming a current defect.',
          'source':
              'https://nationalfluidpowerassociation.swoogo.com/nfpaac25/attendees | https://brennaninc.com/united-states/',
          'audit': 'PASS — 4/4 proofs',
        },
        <String, String>{
          'company': 'Price Engineering',
          'contact': 'Ty Barnes',
          'role': 'Production Operations Manager',
          'contactRoute':
              'Official corporate line 262-369-3700 / sales@priceeng.com plus public LinkedIn role route.',
          'companyProof':
              'Hartland, Wisconsin industrial machinery/engineering company; public company sources place it in the target size band.',
          'roleProof':
              'Current LinkedIn profile identifies Ty Barnes as Production Operations Manager at Price Engineering.',
          'contactProof':
              'Official company contact page publishes corporate phone/email; role route is public.',
          'reasonProof':
              'Price combines engineering, assembly/production, automation & control, kitting, repair, and multiple solution groups—specific cross-functional workflow/integration relevance without claiming a known pain.',
          'source':
              'https://www.linkedin.com/in/tybarnes | https://www.priceeng.com/contact/ | https://www.priceeng.com/about-price/',
          'audit': 'PASS — 4/4 proofs',
        },
        <String, String>{
          'company': 'Central Conveyor',
          'contact': 'Mike Fagan',
          'role': 'Director of Operations',
          'contactRoute':
              'Official 248-446-0118 / info@centralconveyor.com plus official leadership page.',
          'companyProof':
              'Wixom, Michigan automotive/industrial conveyor and material-handling systems integrator; current company-level public profiles describe target-band scale, though one 2024 facility inspection reported about 40 at the Wixom facility.',
          'roleProof':
              'Official company leadership page and Michigan EGLE records identify Mike Fagan as Director of Operations.',
          'contactProof':
              'Official company contact page publishes phone/email and leadership identity.',
          'reasonProof':
              'Central Conveyor performs engineering, fabrication, project management, maintenance, and systems integration across multiple locations—strong account-specific process/integration relevance.',
          'source':
              'https://centralconveyor.com/about-us/company-leadership/ | https://centralconveyor.com/contact-us/ | https://centralconveyor.com/about-us/company-information/',
          'audit': 'PASS — 4/4 proofs; facility-level headcount discrepancy noted',
        },
        <String, String>{
          'company': 'The Paquin Company',
          'contact': 'Tom Colbert',
          'role': 'Operations Manager',
          'contactRoute':
              'Official company team page + company main route; NFPA professional-role confirmation.',
          'companyProof':
              'Mentor, Ohio manufacturer fits industry/geography, but current size evidence conflicts: LinkedIn says 51-200 while Destination Cleveland and LeadIQ say 11-50.',
          'roleProof':
              'Official Paquin team page and 2025 NFPA attendee roster identify Tom Colbert as Operations Manager.',
          'contactProof':
              'Official company team/contact route exists and no personal email is guessed.',
          'reasonProof':
              'Paquin operates multiple engineered-product divisions and industrial communications technologies, which is relevant to workflow/integration research, but size qualification remains unresolved.',
          'source':
              'https://www.linkedin.com/company/paquin | https://jobs.clevelandtalent.org/companies/the-paquin-company-2 | https://paquin.com/pages/about | https://nationalfluidpowerassociation.swoogo.com/nfpaac25/attendees',
          'audit':
              'FAIL — company-size proof conflicts; verify/replace before outreach',
        },
      ];

      for (var rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        for (final column in columns) {
          learner.workspace.setTableCell(
            2,
            'leadResearch',
            rowIndex,
            column,
            rows[rowIndex][column]!,
          );
        }
      }
      await learner.workspace.flush();

      await learner.progress.setNotes(
        2,
        'Real V1.0 pilot batch researched from current public sources. '
        'Paquin is deliberately rejected because size proof conflicts. '
        'No direct emails were guessed. This pilot validates the workflow; '
        'it is not evidence that the human learner independently performed '
        'the research skill.',
      );
      for (var i = 0; i < 3; i++) {
        await learner.progress.toggleTask(2, i);
      }

      expect(learner.workspace.readinessIssues(2), isEmpty);
      expect(learner.workspace.isReadyForReview(2), isTrue);

      final submission = await learner.progress.submitForReview(
        2,
        evidenceSnapshot: learner.workspace.snapshotForModule(2),
      );
      expect(submission, isNotNull);
      expect(submission!.revision, 1);
      expect(submission.decision, ReviewDecision.pending);
      expect(learner.progress.stageFor(2), ModuleStage.readyForReview);

      final module = courseModules.firstWhere((item) => item.id == 2);
      final package = ReviewPackageBuilder.build(
        appVersion: clientboundVersion,
        module: module,
        submission: submission,
        history: learner.progress.reviewSubmissionsFor(2),
      );

      expect(package.data['clientboundVersion'], clientboundVersion);
      expect(
        package.data['structuredEvidence'],
        learner.workspace.snapshotForModule(2),
      );
      final packageSubmission =
          package.data['submission'] as Map<String, dynamic>;
      expect(packageSubmission['id'], submission.id);
      expect(packageSubmission['revision'], 1);

      final evidence =
          package.data['structuredEvidence'] as Map<String, dynamic>;
      final leadRows = evidence['leadResearch'] as List<dynamic>;
      expect(leadRows, hasLength(10));
      final passCount = leadRows.where((row) {
        return (row as Map)['audit'].toString().startsWith('PASS');
      }).length;
      final failCount = leadRows.where((row) {
        return (row as Map)['audit'].toString().startsWith('FAIL');
      }).length;
      expect(passCount, 9);
      expect(failCount, 1);

      final pendingBackup = _backup(learner).createBackupJson();
      final pendingBackupData = _backup(learner).validate(pendingBackup);
      expect(pendingBackupData['appVersion'], clientboundVersion);

      // Separate instructor device: only the portable review package crosses.
      SharedPreferences.setMockInitialValues(<String, Object>{});
      final instructor = await _loadStores();
      final imported =
          await instructor.reviewExchange.importReviewPackage(package.json);
      expect(imported.moduleId, 2);
      expect(imported.revision, 1);
      expect(
        imported.structuredEvidence['leadResearch'],
        isA<List<dynamic>>().having((value) => value.length, 'length', 10),
      );
      expect(instructor.reviewExchange.records, hasLength(1));

      const feedback =
          'PASS — 9/10 leads satisfy all four proofs. Paquin is correctly '
          'rejected because current company-size evidence conflicts. Keep '
          'that rejection discipline: do not force a lead into the ICP when '
          'one proof remains unresolved.';
      final decision = await instructor.reviewExchange.recordDecision(
        imported.submissionId,
        decision: ReviewExchangeDecision.pass,
        feedback: feedback,
      );
      expect(decision.decision, ReviewExchangeDecision.pass);
      expect(
        instructor.reviewExchange
            .recordFor(imported.submissionId)
            ?.decision
            ?.decision,
        ReviewExchangeDecision.pass,
      );

      // Reviewer-side full backup preserves the imported package and decision.
      final instructorBackup = _backup(instructor).createBackupJson();
      SharedPreferences.setMockInitialValues(<String, Object>{});
      final restoredInstructor = await _loadStores();
      await _backup(restoredInstructor).restoreBackupJson(instructorBackup);
      final restoredInstructorRecord =
          restoredInstructor.reviewExchange.recordFor(imported.submissionId);
      expect(restoredInstructorRecord, isNotNull);
      expect(
        restoredInstructorRecord?.decision?.decision,
        ReviewExchangeDecision.pass,
      );
      expect(restoredInstructorRecord?.decision?.feedback, feedback);

      // Return to a learner device by restoring the pending learner backup.
      SharedPreferences.setMockInitialValues(<String, Object>{});
      final returnedLearner = await _loadStores();
      await _backup(returnedLearner).restoreBackupJson(pendingBackup);
      expect(
        returnedLearner.progress.stageFor(2),
        ModuleStage.readyForReview,
      );
      expect(
        returnedLearner.workspace.tableValue(2, 'leadResearch'),
        hasLength(10),
      );
      expect(returnedLearner.progress.stageFor(1), ModuleStage.passed);
      expect(returnedLearner.settings.onboardingComplete, isTrue);
      expect(
        returnedLearner.community.posts
            .any((post) => post.title == 'Module 2 real pilot'),
        isTrue,
      );
      expect(returnedLearner.progress.reviewSubmissionsFor(2), hasLength(1));

      // Exact submission identity is enforced before a cross-device decision.
      final tamperedDecision = ReviewDecisionPackage(
        submissionId: decision.submissionId,
        moduleId: decision.moduleId,
        revision: decision.revision + 1,
        decision: decision.decision,
        feedback: decision.feedback,
        reviewedAt: decision.reviewedAt,
      );
      await expectLater(
        returnedLearner.progress.applyExternalReviewDecision(
          tamperedDecision,
        ),
        throwsA(isA<FormatException>()),
      );

      final wrongSubmissionDecision = ReviewDecisionPackage(
        submissionId: '${decision.submissionId}-wrong',
        moduleId: decision.moduleId,
        revision: decision.revision,
        decision: decision.decision,
        feedback: decision.feedback,
        reviewedAt: decision.reviewedAt,
      );
      await expectLater(
        returnedLearner.progress.applyExternalReviewDecision(
          wrongSubmissionDecision,
        ),
        throwsA(isA<FormatException>()),
      );

      final parsedDecision = ReviewDecisionPackage.parse(decision.json);
      await returnedLearner.progress.applyExternalReviewDecision(
        parsedDecision,
      );
      await returnedLearner.progress.applyExternalReviewDecision(
        parsedDecision,
      );
      expect(returnedLearner.progress.stageFor(2), ModuleStage.passed);
      expect(returnedLearner.progress.reviewSubmissionsFor(2), hasLength(1));
      final reviewed =
          returnedLearner.progress.latestReviewSubmissionFor(2);
      expect(reviewed, isNotNull);
      expect(reviewed!.decision, ReviewDecision.pass);
      expect(reviewed.reviewerFeedback, feedback);

      // Final backup can restore the passed module to a completely fresh device.
      final passedBackup = _backup(returnedLearner).createBackupJson();
      SharedPreferences.setMockInitialValues(<String, Object>{});
      final freshDevice = await _loadStores();
      await _backup(freshDevice).restoreBackupJson(passedBackup);

      expect(freshDevice.progress.stageFor(1), ModuleStage.passed);
      expect(freshDevice.progress.stageFor(2), ModuleStage.passed);
      expect(
        freshDevice.workspace.tableValue(2, 'leadResearch'),
        hasLength(10),
      );
      expect(
        freshDevice.progress.latestReviewSubmissionFor(2)?.decision,
        ReviewDecision.pass,
      );
      expect(
        freshDevice.progress.latestReviewSubmissionFor(2)?.reviewerFeedback,
        feedback,
      );
      expect(freshDevice.settings.onboardingComplete, isTrue);
      expect(
        freshDevice.community.posts
            .any((post) => post.title == 'Module 2 real pilot'),
        isTrue,
      );

      // A restore that fails after partially applying sections must roll back
      // to the exact pre-restore passed learner state.
      final malformed =
          jsonDecode(pendingBackup) as Map<String, dynamic>;
      malformed['reviewExchange'] = <String, dynamic>{
        'records': 'invalid-record-list',
      };
      await expectLater(
        _backup(freshDevice).restoreBackupJson(jsonEncode(malformed)),
        throwsA(isA<FormatException>()),
      );
      expect(freshDevice.progress.stageFor(1), ModuleStage.passed);
      expect(freshDevice.progress.stageFor(2), ModuleStage.passed);
      expect(
        freshDevice.workspace.tableValue(2, 'leadResearch'),
        hasLength(10),
      );
      expect(
        freshDevice.progress.latestReviewSubmissionFor(2)?.reviewerFeedback,
        feedback,
      );
    },
  );
}
