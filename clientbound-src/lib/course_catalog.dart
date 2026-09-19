import 'package:flutter/material.dart';

@immutable
class CourseModule {
  const CourseModule({
    required this.id,
    required this.title,
    required this.tagline,
    required this.focus,
    required this.deliverable,
    required this.passGate,
    required this.icon,
    required this.worksheetAsset,
  });

  final int id;
  final String title;
  final String tagline;
  final String focus;
  final String deliverable;
  final String passGate;
  final IconData icon;
  final String worksheetAsset;
}

const courseModules = <CourseModule>[
  CourseModule(
    id: 1,
    title: 'Offer Foundation',
    tagline: 'Choose one market, one buyer, one service, one clear offer.',
    focus: 'Positioning',
    deliverable: 'A defined niche, primary buyer, bounded service, one-sentence offer, and 10 candidate clients.',
    passGate: 'The offer is understandable in under 15 seconds and at least five candidates are strong-fit opportunities.',
    icon: Icons.flag_outlined,
    worksheetAsset: 'worksheets/Module-1-Offer-Foundation-Worksheet.pdf',
  ),
  CourseModule(
    id: 2,
    title: 'ICP & Lead Research',
    tagline: 'Learn to tell a qualified prospect from a plausible-looking name.',
    focus: 'Research',
    deliverable: 'A specific prospect ICP and 10 leads supported by company, role, contact, and reason proof.',
    passGate: 'At least 9 of 10 audited leads pass all four proof checks.',
    icon: Icons.manage_search_outlined,
    worksheetAsset: 'worksheets/Module-2-ICP-Lead-Research-Worksheet.pdf',
  ),
  CourseModule(
    id: 3,
    title: 'Outreach System',
    tagline: 'Build messages and calls that sound human, relevant, and safe.',
    focus: 'Outreach',
    deliverable: 'Cold email, follow-ups, direct message, call opener, bridge questions, and objection responses.',
    passGate: 'The outreach is specific, truthful, low-friction, and usable in a real conversation.',
    icon: Icons.send_outlined,
    worksheetAsset: 'worksheets/Module-3-Outreach-System-Worksheet.pdf',
  ),
  CourseModule(
    id: 4,
    title: 'Proof Package',
    tagline: 'Create credible proof before you have freelance client results.',
    focus: 'Proof',
    deliverable: 'Service brief, lead sample, outreach sample, campaign teardown, and a short voice/call sample.',
    passGate: 'Every proof asset is truthful, relevant, useful, and contains no invented results.',
    icon: Icons.workspace_premium_outlined,
    worksheetAsset: 'worksheets/Module-4-Proof-Package-Worksheet.pdf',
  ),
  CourseModule(
    id: 5,
    title: 'Opportunity Pipeline',
    tagline: 'Build enough qualified opportunities to stop depending on luck.',
    focus: 'Pipeline',
    deliverable: 'A 50-opportunity pipeline across direct clients, targeted jobs, and warm opportunities.',
    passGate: 'The pipeline contains enough A and strong-B opportunities with clear next actions.',
    icon: Icons.account_tree_outlined,
    worksheetAsset: 'worksheets/Module-5-Opportunity-Pipeline-Worksheet.pdf',
  ),
  CourseModule(
    id: 6,
    title: 'First Live Outreach',
    tagline: 'Enter the market with targeted applications and direct outreach.',
    focus: 'Execution',
    deliverable: 'Real applications, direct-client first touches, warm messages where legitimate, and follow-ups.',
    passGate: 'The work was actually sent, tracked, and handled according to reply and compliance rules.',
    icon: Icons.rocket_launch_outlined,
    worksheetAsset: 'worksheets/Module-6-First-Live-Outreach-Worksheet.pdf',
  ),
  CourseModule(
    id: 7,
    title: 'Consistent Acquisition',
    tagline: 'Turn one live outreach day into a repeatable operating rhythm.',
    focus: 'Consistency',
    deliverable: 'A complete acquisition block: replenishment, new outreach, follow-up, practice, and metrics.',
    passGate: 'Due follow-ups are handled and activity remains targeted rather than random volume.',
    icon: Icons.repeat_outlined,
    worksheetAsset: 'worksheets/Module-7-Consistent-Acquisition-Worksheet.pdf',
  ),
  CourseModule(
    id: 8,
    title: 'Targeting Improvement',
    tagline: 'Repair the market before blaming the message.',
    focus: 'Targeting',
    deliverable: 'A targeting audit, 10 stronger prospects, and one controlled targeting change.',
    passGate: 'The change is evidence-based and only one major targeting variable changes at a time.',
    icon: Icons.my_location_outlined,
    worksheetAsset: 'worksheets/Module-8-Targeting-Improvement-Worksheet.pdf',
  ),
  CourseModule(
    id: 9,
    title: 'Communication Improvement',
    tagline: 'Become more natural when the conversation leaves the script.',
    focus: 'Communication',
    deliverable: 'Opener reps, objection drills, appointment asks, and review of a real or recorded interaction.',
    passGate: 'The learner listens, answers the real concern, asks one question at a time, and recovers off-script.',
    icon: Icons.record_voice_over_outlined,
    worksheetAsset: 'worksheets/Module-9-Communication-Improvement-Worksheet.pdf',
  ),
  CourseModule(
    id: 10,
    title: 'Funnel Diagnosis',
    tagline: 'Find the largest leak instead of changing everything at once.',
    focus: 'Metrics',
    deliverable: 'A funnel snapshot, root-cause diagnosis, and one-variable experiment.',
    passGate: 'The bottleneck is supported by real evidence and the experiment has a defined observation window.',
    icon: Icons.monitor_heart_outlined,
    worksheetAsset: 'worksheets/Module-10-Funnel-Diagnosis-Worksheet.pdf',
  ),
  CourseModule(
    id: 11,
    title: 'Double Down on Evidence',
    tagline: 'Put more effort where real signals are strongest.',
    focus: 'Focus',
    deliverable: 'A strongest-lane decision, focused shortlist, relevant proof, and concentrated acquisition block.',
    passGate: 'Effort allocation follows evidence rather than preference or habit.',
    icon: Icons.trending_up_outlined,
    worksheetAsset: 'worksheets/Module-11-Double-Down-Worksheet.pdf',
  ),
  CourseModule(
    id: 12,
    title: 'Discovery Preparation',
    tagline: 'Prepare for serious conversations without over-rehearsing.',
    focus: 'Discovery',
    deliverable: 'Company research, three priority questions, one useful artifact, and a next-step plan.',
    passGate: 'Preparation helps uncover the business problem without pretending to know what has not been verified.',
    icon: Icons.forum_outlined,
    worksheetAsset: 'worksheets/Module-12-Discovery-Preparation-Worksheet.pdf',
  ),
  CourseModule(
    id: 13,
    title: 'Paid-Pilot Conversion',
    tagline: 'Make the first engagement small, clear, measurable, and paid.',
    focus: 'Conversion',
    deliverable: 'A bounded pilot with scope, metrics, responsibilities, compensation, and proposal.',
    passGate: 'Terms are explicit, risk is controlled, and no outcome outside the learner\'s control is guaranteed.',
    icon: Icons.handshake_outlined,
    worksheetAsset: 'worksheets/Module-13-Paid-Pilot-Conversion-Worksheet.pdf',
  ),
  CourseModule(
    id: 14,
    title: 'Review, Next Cycle & Graduation',
    tagline: 'Turn the first cycle into a system you can run again.',
    focus: 'Review',
    deliverable: 'Full funnel review, Keep/Change/Stop decisions, next hypothesis, and 30 fresh opportunities.',
    passGate: 'The learner can continue independently or has moved into onboarding and delivery for a real client.',
    icon: Icons.emoji_events_outlined,
    worksheetAsset: 'worksheets/Module-14-Review-Next-Cycle-Worksheet.pdf',
  ),
];
