enum WorkspaceFieldType {
  shortText,
  longText,
  number,
  url,
  table,
}

class WorkspaceTableColumn {
  const WorkspaceTableColumn({
    required this.key,
    required this.label,
    this.width = 170,
    this.required = true,
  });

  final String key;
  final String label;
  final double width;
  final bool required;
}

class WorkspaceFieldDefinition {
  const WorkspaceFieldDefinition({
    required this.key,
    required this.label,
    required this.type,
    required this.help,
    this.required = false,
    this.columns = const <WorkspaceTableColumn>[],
    this.expectedRows,
  });

  final String key;
  final String label;
  final WorkspaceFieldType type;
  final String help;
  final bool required;
  final List<WorkspaceTableColumn> columns;
  final int? expectedRows;
}

class ModuleWorkspaceDefinition {
  const ModuleWorkspaceDefinition({
    required this.moduleId,
    required this.title,
    required this.fields,
  });

  final int moduleId;
  final String title;
  final List<WorkspaceFieldDefinition> fields;
}

const moduleWorkspaceDefinitions = <int, ModuleWorkspaceDefinition>{
  1: ModuleWorkspaceDefinition(
    moduleId: 1,
    title: 'Offer Foundation Workspace',
    fields: [
      WorkspaceFieldDefinition(
        key: 'niche',
        label: 'Target niche',
        type: WorkspaceFieldType.shortText,
        help: 'One specific B2B market you can research and serve now.',
        required: true,
      ),
      WorkspaceFieldDefinition(
        key: 'buyer',
        label: 'Primary buyer',
        type: WorkspaceFieldType.shortText,
        help: 'The role most likely to own or influence the problem.',
        required: true,
      ),
      WorkspaceFieldDefinition(
        key: 'scope',
        label: 'Bounded service scope',
        type: WorkspaceFieldType.longText,
        help: 'What you will do now and what you will not promise yet.',
        required: true,
      ),
      WorkspaceFieldDefinition(
        key: 'offer',
        label: 'One-sentence offer',
        type: WorkspaceFieldType.longText,
        help: 'Who you help, what you do, and the outcome you are trying to create.',
        required: true,
      ),
      WorkspaceFieldDefinition(
        key: 'candidateClients',
        label: 'Candidate clients',
        type: WorkspaceFieldType.table,
        help: 'Build the first evidence-backed list of real companies.',
        required: true,
        expectedRows: 10,
        columns: [
          WorkspaceTableColumn(key: 'company', label: 'Company', width: 180),
          WorkspaceTableColumn(key: 'website', label: 'Website', width: 220),
          WorkspaceTableColumn(key: 'whyFit', label: 'Why it fits', width: 270),
        ],
      ),
    ],
  ),
  2: ModuleWorkspaceDefinition(
    moduleId: 2,
    title: 'ICP & Lead Research Workspace',
    fields: [
      WorkspaceFieldDefinition(
        key: 'industry',
        label: 'Target industry',
        type: WorkspaceFieldType.shortText,
        help: 'The industry or narrow category this prospect list targets.',
        required: true,
      ),
      WorkspaceFieldDefinition(
        key: 'geography',
        label: 'Geography',
        type: WorkspaceFieldType.shortText,
        help: 'Where qualified accounts should be located.',
        required: true,
      ),
      WorkspaceFieldDefinition(
        key: 'companySize',
        label: 'Company-size rule',
        type: WorkspaceFieldType.shortText,
        help: 'A practical size signal such as employee range or operating footprint.',
        required: true,
      ),
      WorkspaceFieldDefinition(
        key: 'targetRoles',
        label: 'Target roles',
        type: WorkspaceFieldType.longText,
        help: 'Roles that plausibly own or influence the buying problem.',
        required: true,
      ),
      WorkspaceFieldDefinition(
        key: 'exclusions',
        label: 'Exclusions',
        type: WorkspaceFieldType.longText,
        help: 'Accounts or contacts that should not enter this list.',
      ),
      WorkspaceFieldDefinition(
        key: 'leadResearch',
        label: '10-lead four-proof audit',
        type: WorkspaceFieldType.table,
        help: 'Every row must prove company fit, role fit, a legitimate contact route, and an account-specific reason.',
        required: true,
        expectedRows: 10,
        columns: [
          WorkspaceTableColumn(key: 'company', label: 'Company', width: 170),
          WorkspaceTableColumn(key: 'website', label: 'Website', width: 220),
          WorkspaceTableColumn(key: 'location', label: 'Location', width: 180),
          WorkspaceTableColumn(key: 'sizeEvidence', label: 'Size evidence', width: 250),
          WorkspaceTableColumn(key: 'contact', label: 'Contact', width: 160),
          WorkspaceTableColumn(key: 'role', label: 'Role', width: 170),
          WorkspaceTableColumn(key: 'contactRoute', label: 'Contact route', width: 190),
          WorkspaceTableColumn(key: 'companyProof', label: 'Company proof', width: 250),
          WorkspaceTableColumn(key: 'roleProof', label: 'Role proof', width: 250),
          WorkspaceTableColumn(key: 'contactProof', label: 'Contact proof', width: 250),
          WorkspaceTableColumn(key: 'reasonProof', label: 'Reason proof', width: 270),
          WorkspaceTableColumn(key: 'source', label: 'Source URL', width: 240),
          WorkspaceTableColumn(key: 'audit', label: 'Audit result', width: 150),
          WorkspaceTableColumn(
            key: 'failReason',
            label: 'Fail reason',
            width: 240,
            required: false,
          ),
        ],
      ),
    ],
  ),
  3: ModuleWorkspaceDefinition(
    moduleId: 3,
    title: 'Outreach System Workspace',
    fields: [
      WorkspaceFieldDefinition(
        key: 'coldEmail',
        label: 'Cold email',
        type: WorkspaceFieldType.longText,
        help: 'Write a truthful, specific first-touch email with one low-friction ask.',
        required: true,
      ),
      WorkspaceFieldDefinition(
        key: 'followUp1',
        label: 'Follow-up 1',
        type: WorkspaceFieldType.longText,
        help: 'Advance the conversation without repeating the first message.',
        required: true,
      ),
      WorkspaceFieldDefinition(
        key: 'followUp2',
        label: 'Follow-up 2',
        type: WorkspaceFieldType.longText,
        help: 'A concise second follow-up or clean close-the-loop message.',
      ),
      WorkspaceFieldDefinition(
        key: 'directMessage',
        label: 'Direct message',
        type: WorkspaceFieldType.longText,
        help: 'A short version suitable for a legitimate professional DM channel.',
        required: true,
      ),
      WorkspaceFieldDefinition(
        key: 'callOpener',
        label: 'Call opener',
        type: WorkspaceFieldType.longText,
        help: 'A natural opener that can survive leaving the script.',
        required: true,
      ),
      WorkspaceFieldDefinition(
        key: 'bridgeQuestions',
        label: 'Bridge questions',
        type: WorkspaceFieldType.table,
        help: 'Questions that move naturally from the opener toward useful context.',
        required: true,
        expectedRows: 3,
        columns: [
          WorkspaceTableColumn(key: 'question', label: 'Question', width: 300),
          WorkspaceTableColumn(key: 'purpose', label: 'Purpose', width: 260),
        ],
      ),
      WorkspaceFieldDefinition(
        key: 'objectionResponses',
        label: 'Objection responses',
        type: WorkspaceFieldType.table,
        help: 'Prepare concise responses that acknowledge the real concern and return to a useful next step.',
        required: true,
        expectedRows: 5,
        columns: [
          WorkspaceTableColumn(key: 'objection', label: 'Objection', width: 240),
          WorkspaceTableColumn(key: 'response', label: 'Response', width: 360),
        ],
      ),
    ],
  ),
  4: ModuleWorkspaceDefinition(
    moduleId: 4,
    title: 'Proof Package Workspace',
    fields: [
      WorkspaceFieldDefinition(
        key: 'serviceBrief',
        label: 'Service brief',
        type: WorkspaceFieldType.longText,
        help: 'Explain the service, scope, buyer, process, and boundaries in one compact brief.',
        required: true,
      ),
      WorkspaceFieldDefinition(
        key: 'outreachSample',
        label: 'Outreach sample',
        type: WorkspaceFieldType.longText,
        help: 'Show a relevant example without inventing client results.',
        required: true,
      ),
      WorkspaceFieldDefinition(
        key: 'campaignTeardown',
        label: 'Campaign teardown',
        type: WorkspaceFieldType.longText,
        help: 'Analyze a real company or campaign and explain what you would improve and why.',
        required: true,
      ),
      WorkspaceFieldDefinition(
        key: 'voiceSamplePlan',
        label: 'Voice / call sample evidence',
        type: WorkspaceFieldType.longText,
        help: 'Record where the sample is stored or describe the recorded scenario and what it demonstrates.',
        required: true,
      ),
      WorkspaceFieldDefinition(
        key: 'proofAssets',
        label: 'Proof asset register',
        type: WorkspaceFieldType.table,
        help: 'Track the five core proof assets and the evidence/reference for each.',
        required: true,
        expectedRows: 5,
        columns: [
          WorkspaceTableColumn(key: 'asset', label: 'Asset', width: 210),
          WorkspaceTableColumn(key: 'reference', label: 'Evidence / reference', width: 320),
          WorkspaceTableColumn(key: 'status', label: 'Status', width: 150),
        ],
      ),
    ],
  ),
  5: ModuleWorkspaceDefinition(
    moduleId: 5,
    title: 'Opportunity Pipeline Workspace',
    fields: [
      WorkspaceFieldDefinition(
        key: 'pipeline',
        label: '50-opportunity pipeline',
        type: WorkspaceFieldType.table,
        help: 'Mix direct clients, targeted jobs/projects, and legitimate warm opportunities. Every row needs a clear next action.',
        required: true,
        expectedRows: 50,
        columns: [
          WorkspaceTableColumn(key: 'company', label: 'Company / opportunity', width: 210),
          WorkspaceTableColumn(key: 'lane', label: 'Lane', width: 150),
          WorkspaceTableColumn(key: 'contact', label: 'Contact', width: 170),
          WorkspaceTableColumn(key: 'role', label: 'Role', width: 170),
          WorkspaceTableColumn(key: 'fit', label: 'Fit', width: 110),
          WorkspaceTableColumn(key: 'status', label: 'Status', width: 150),
          WorkspaceTableColumn(key: 'nextAction', label: 'Next action', width: 250),
          WorkspaceTableColumn(key: 'nextDate', label: 'Next-action date', width: 170),
          WorkspaceTableColumn(key: 'source', label: 'Source URL', width: 240),
        ],
      ),
    ],
  ),
  6: ModuleWorkspaceDefinition(
    moduleId: 6,
    title: 'First Live Outreach Workspace',
    fields: [
      WorkspaceFieldDefinition(
        key: 'outreachLog',
        label: 'Live outreach log',
        type: WorkspaceFieldType.table,
        help: 'Record work that was actually sent. One row per real touch.',
        required: true,
        expectedRows: 1,
        columns: [
          WorkspaceTableColumn(key: 'date', label: 'Date', width: 130),
          WorkspaceTableColumn(key: 'company', label: 'Company', width: 180),
          WorkspaceTableColumn(key: 'contact', label: 'Contact', width: 170),
          WorkspaceTableColumn(key: 'channel', label: 'Channel', width: 130),
          WorkspaceTableColumn(key: 'message', label: 'What was sent', width: 300),
          WorkspaceTableColumn(key: 'outcome', label: 'Reply / outcome', width: 220),
          WorkspaceTableColumn(key: 'nextAction', label: 'Next action', width: 230),
        ],
      ),
      WorkspaceFieldDefinition(
        key: 'replyRules',
        label: 'Reply-handling rules',
        type: WorkspaceFieldType.longText,
        help: 'State how you will handle positive replies, objections, requests for information, and escalation.',
        required: true,
      ),
    ],
  ),
  7: ModuleWorkspaceDefinition(
    moduleId: 7,
    title: 'Consistent Acquisition Workspace',
    fields: [
      WorkspaceFieldDefinition(
        key: 'acquisitionBlocks',
        label: 'Acquisition block log',
        type: WorkspaceFieldType.table,
        help: 'Track replenishment, new outreach, due follow-ups, practice, and the result of each work block.',
        required: true,
        expectedRows: 1,
        columns: [
          WorkspaceTableColumn(key: 'date', label: 'Date', width: 130),
          WorkspaceTableColumn(key: 'qualifiedAdded', label: 'Qualified added', width: 150),
          WorkspaceTableColumn(key: 'newOutreach', label: 'New outreach', width: 150),
          WorkspaceTableColumn(key: 'followUps', label: 'Follow-ups', width: 140),
          WorkspaceTableColumn(key: 'practice', label: 'Practice', width: 220),
          WorkspaceTableColumn(key: 'result', label: 'Result / learning', width: 280),
        ],
      ),
      WorkspaceFieldDefinition(
        key: 'rhythm',
        label: 'Sustainable operating rhythm',
        type: WorkspaceFieldType.longText,
        help: 'Describe the acquisition rhythm you can actually repeat without sacrificing targeting quality.',
        required: true,
      ),
    ],
  ),
  8: ModuleWorkspaceDefinition(
    moduleId: 8,
    title: 'Targeting Improvement Workspace',
    fields: [
      WorkspaceFieldDefinition(
        key: 'targetingAudit',
        label: 'Targeting audit',
        type: WorkspaceFieldType.longText,
        help: 'Identify weak accounts, wrong roles, poor contactability, timing problems, or other targeting failures.',
        required: true,
      ),
      WorkspaceFieldDefinition(
        key: 'strongerProspects',
        label: '10 stronger prospects',
        type: WorkspaceFieldType.table,
        help: 'Replace weak opportunities with accounts supported by clearer evidence.',
        required: true,
        expectedRows: 10,
        columns: [
          WorkspaceTableColumn(key: 'company', label: 'Company', width: 180),
          WorkspaceTableColumn(key: 'contact', label: 'Contact', width: 170),
          WorkspaceTableColumn(key: 'fitEvidence', label: 'Fit evidence', width: 300),
          WorkspaceTableColumn(key: 'source', label: 'Source URL', width: 240),
        ],
      ),
      WorkspaceFieldDefinition(
        key: 'controlledChange',
        label: 'One controlled targeting change',
        type: WorkspaceFieldType.longText,
        help: 'Change only one major targeting variable.',
        required: true,
      ),
      WorkspaceFieldDefinition(
        key: 'hypothesis',
        label: 'Hypothesis',
        type: WorkspaceFieldType.longText,
        help: 'State what you expect to improve and why.',
        required: true,
      ),
    ],
  ),
  9: ModuleWorkspaceDefinition(
    moduleId: 9,
    title: 'Communication Improvement Workspace',
    fields: [
      WorkspaceFieldDefinition(
        key: 'openerVariations',
        label: 'Opener variations',
        type: WorkspaceFieldType.table,
        help: 'Practice variations that sound natural without reading word-for-word.',
        required: true,
        expectedRows: 5,
        columns: [
          WorkspaceTableColumn(key: 'opener', label: 'Opener', width: 360),
          WorkspaceTableColumn(key: 'note', label: 'What felt natural / weak', width: 300),
        ],
      ),
      WorkspaceFieldDefinition(
        key: 'objectionDrills',
        label: 'Objection drills',
        type: WorkspaceFieldType.table,
        help: 'Practice realistic objections and recovery.',
        required: true,
        expectedRows: 10,
        columns: [
          WorkspaceTableColumn(key: 'objection', label: 'Objection', width: 230),
          WorkspaceTableColumn(key: 'response', label: 'Response', width: 360),
          WorkspaceTableColumn(key: 'reflection', label: 'Reflection', width: 280),
        ],
      ),
      WorkspaceFieldDefinition(
        key: 'appointmentAsks',
        label: 'Appointment asks',
        type: WorkspaceFieldType.table,
        help: 'Prepare three low-friction ways to ask for the next conversation.',
        required: true,
        expectedRows: 3,
        columns: [
          WorkspaceTableColumn(key: 'ask', label: 'Ask', width: 360),
          WorkspaceTableColumn(key: 'when', label: 'When to use it', width: 260),
        ],
      ),
      WorkspaceFieldDefinition(
        key: 'interactionReview',
        label: 'Interaction review',
        type: WorkspaceFieldType.longText,
        help: 'Review one real or recorded interaction and identify the single biggest communication weakness.',
        required: true,
      ),
    ],
  ),
  10: ModuleWorkspaceDefinition(
    moduleId: 10,
    title: 'Funnel Diagnosis Workspace',
    fields: [
      WorkspaceFieldDefinition(
        key: 'funnel',
        label: 'Current funnel',
        type: WorkspaceFieldType.table,
        help: 'Use real activity and consistent stage definitions.',
        required: true,
        expectedRows: 1,
        columns: [
          WorkspaceTableColumn(key: 'researched', label: 'Researched', width: 120),
          WorkspaceTableColumn(key: 'contacted', label: 'Contacted', width: 120),
          WorkspaceTableColumn(key: 'replies', label: 'Replies', width: 110),
          WorkspaceTableColumn(key: 'positive', label: 'Positive', width: 110),
          WorkspaceTableColumn(key: 'meetings', label: 'Meetings', width: 110),
          WorkspaceTableColumn(key: 'proposals', label: 'Proposals', width: 110),
          WorkspaceTableColumn(key: 'clients', label: 'Clients', width: 100),
        ],
      ),
      WorkspaceFieldDefinition(
        key: 'bottleneck',
        label: 'Largest bottleneck',
        type: WorkspaceFieldType.longText,
        help: 'Identify the largest meaningful drop and the evidence behind it.',
        required: true,
      ),
      WorkspaceFieldDefinition(
        key: 'examples',
        label: 'Examples around the drop',
        type: WorkspaceFieldType.longText,
        help: 'Inspect real examples instead of diagnosing from percentages alone.',
        required: true,
      ),
      WorkspaceFieldDefinition(
        key: 'experiment',
        label: 'One-variable experiment',
        type: WorkspaceFieldType.longText,
        help: 'State the single change you will test.',
        required: true,
      ),
      WorkspaceFieldDefinition(
        key: 'observationWindow',
        label: 'Observation window',
        type: WorkspaceFieldType.shortText,
        help: 'Define when you will evaluate the experiment.',
        required: true,
      ),
    ],
  ),
  11: ModuleWorkspaceDefinition(
    moduleId: 11,
    title: 'Double Down on Evidence Workspace',
    fields: [
      WorkspaceFieldDefinition(
        key: 'evidenceSummary',
        label: 'Evidence summary',
        type: WorkspaceFieldType.longText,
        help: 'Summarize the strongest real signals by lane, target, and message.',
        required: true,
      ),
      WorkspaceFieldDefinition(
        key: 'strongestLane',
        label: 'Strongest acquisition lane',
        type: WorkspaceFieldType.shortText,
        help: 'Choose based on real evidence, not preference.',
        required: true,
      ),
      WorkspaceFieldDefinition(
        key: 'focusedShortlist',
        label: 'Focused shortlist',
        type: WorkspaceFieldType.table,
        help: 'Record the opportunities receiving concentrated effort.',
        required: true,
        expectedRows: 1,
        columns: [
          WorkspaceTableColumn(key: 'opportunity', label: 'Opportunity', width: 220),
          WorkspaceTableColumn(key: 'whyNow', label: 'Why this deserves focus', width: 320),
          WorkspaceTableColumn(key: 'proof', label: 'Matched proof', width: 250),
          WorkspaceTableColumn(key: 'nextAction', label: 'Next action', width: 230),
        ],
      ),
      WorkspaceFieldDefinition(
        key: 'allocation',
        label: 'Effort allocation',
        type: WorkspaceFieldType.longText,
        help: 'Describe what receives more effort and what receives less.',
        required: true,
      ),
    ],
  ),
  12: ModuleWorkspaceDefinition(
    moduleId: 12,
    title: 'Discovery Preparation Workspace',
    fields: [
      WorkspaceFieldDefinition(
        key: 'company',
        label: 'Company',
        type: WorkspaceFieldType.shortText,
        help: 'The live company you are preparing to speak with.',
        required: true,
      ),
      WorkspaceFieldDefinition(
        key: 'contact',
        label: 'Contact',
        type: WorkspaceFieldType.shortText,
        help: 'The person and role involved in the conversation.',
        required: true,
      ),
      WorkspaceFieldDefinition(
        key: 'verifiedObservation',
        label: 'Verified observation',
        type: WorkspaceFieldType.longText,
        help: 'One useful observation grounded in real company/contact research.',
        required: true,
      ),
      WorkspaceFieldDefinition(
        key: 'priorityQuestions',
        label: 'Three priority questions',
        type: WorkspaceFieldType.table,
        help: 'Ask only questions that help uncover the business problem or process.',
        required: true,
        expectedRows: 3,
        columns: [
          WorkspaceTableColumn(key: 'question', label: 'Question', width: 360),
          WorkspaceTableColumn(key: 'why', label: 'Why it matters', width: 300),
        ],
      ),
      WorkspaceFieldDefinition(
        key: 'artifact',
        label: 'Useful artifact / reference',
        type: WorkspaceFieldType.longText,
        help: 'Record the sample, teardown, research, or other useful artifact you may use.',
        required: true,
      ),
      WorkspaceFieldDefinition(
        key: 'desiredNextStep',
        label: 'Desired next step',
        type: WorkspaceFieldType.longText,
        help: 'Define the next action you want if the conversation is a fit.',
        required: true,
      ),
    ],
  ),
  13: ModuleWorkspaceDefinition(
    moduleId: 13,
    title: 'Paid-Pilot Conversion Workspace',
    fields: [
      WorkspaceFieldDefinition(
        key: 'problem',
        label: 'Problem to solve',
        type: WorkspaceFieldType.longText,
        help: 'State the verified problem or opportunity the pilot addresses.',
        required: true,
      ),
      WorkspaceFieldDefinition(
        key: 'objective',
        label: 'Pilot objective',
        type: WorkspaceFieldType.longText,
        help: 'Define the useful outcome of the bounded pilot without guaranteeing an uncontrollable result.',
        required: true,
      ),
      WorkspaceFieldDefinition(
        key: 'scope',
        label: 'Scope',
        type: WorkspaceFieldType.longText,
        help: 'Define what is included and excluded.',
        required: true,
      ),
      WorkspaceFieldDefinition(
        key: 'deliverables',
        label: 'Deliverables',
        type: WorkspaceFieldType.table,
        help: 'List each concrete deliverable.',
        required: true,
        expectedRows: 1,
        columns: [
          WorkspaceTableColumn(key: 'deliverable', label: 'Deliverable', width: 330),
          WorkspaceTableColumn(key: 'due', label: 'Due / cadence', width: 180),
        ],
      ),
      WorkspaceFieldDefinition(
        key: 'clientResponsibilities',
        label: 'Client responsibilities',
        type: WorkspaceFieldType.longText,
        help: 'Record the information, access, approvals, or responses the client must provide.',
        required: true,
      ),
      WorkspaceFieldDefinition(
        key: 'metrics',
        label: 'Pilot metrics',
        type: WorkspaceFieldType.table,
        help: 'Use process/funnel metrics that can be observed without promising final sales outcomes.',
        required: true,
        expectedRows: 1,
        columns: [
          WorkspaceTableColumn(key: 'metric', label: 'Metric', width: 240),
          WorkspaceTableColumn(key: 'target', label: 'Target / expectation', width: 250),
          WorkspaceTableColumn(key: 'owner', label: 'Owner', width: 150),
        ],
      ),
      WorkspaceFieldDefinition(
        key: 'duration',
        label: 'Duration',
        type: WorkspaceFieldType.shortText,
        help: 'Define the bounded pilot period.',
        required: true,
      ),
      WorkspaceFieldDefinition(
        key: 'compensation',
        label: 'Compensation & payment timing',
        type: WorkspaceFieldType.longText,
        help: 'State payment clearly before work begins.',
        required: true,
      ),
      WorkspaceFieldDefinition(
        key: 'reviewPoint',
        label: 'Review point',
        type: WorkspaceFieldType.shortText,
        help: 'When and how the pilot will be reviewed.',
        required: true,
      ),
      WorkspaceFieldDefinition(
        key: 'proposalDraft',
        label: 'Proposal draft',
        type: WorkspaceFieldType.longText,
        help: 'Assemble the complete bounded pilot proposal.',
        required: true,
      ),
    ],
  ),
  14: ModuleWorkspaceDefinition(
    moduleId: 14,
    title: 'Review, Next Cycle & Graduation Workspace',
    fields: [
      WorkspaceFieldDefinition(
        key: 'funnelReview',
        label: 'Full funnel review',
        type: WorkspaceFieldType.longText,
        help: 'Summarize what happened across the acquisition cycle using real evidence.',
        required: true,
      ),
      WorkspaceFieldDefinition(
        key: 'keep',
        label: 'KEEP',
        type: WorkspaceFieldType.longText,
        help: 'What produced useful evidence and should continue?',
        required: true,
      ),
      WorkspaceFieldDefinition(
        key: 'change',
        label: 'CHANGE',
        type: WorkspaceFieldType.longText,
        help: 'What single system should be improved next?',
        required: true,
      ),
      WorkspaceFieldDefinition(
        key: 'stop',
        label: 'STOP',
        type: WorkspaceFieldType.longText,
        help: 'What low-value activity should be removed?',
        required: true,
      ),
      WorkspaceFieldDefinition(
        key: 'nextExperiment',
        label: 'Next experiment',
        type: WorkspaceFieldType.longText,
        help: 'State the next evidence-producing hypothesis and test.',
        required: true,
      ),
      WorkspaceFieldDefinition(
        key: 'clientOutcome',
        label: 'Current outcome',
        type: WorkspaceFieldType.shortText,
        help: 'Examples: no client yet, paid pilot active, client onboarded.',
        required: true,
      ),
      WorkspaceFieldDefinition(
        key: 'nextCyclePlan',
        label: 'Next-cycle plan',
        type: WorkspaceFieldType.longText,
        help: 'Explain how you will continue independently from this point.',
        required: true,
      ),
      WorkspaceFieldDefinition(
        key: 'freshOpportunities',
        label: 'Fresh opportunity reserve',
        type: WorkspaceFieldType.table,
        help: 'If no client is active, prepare up to 30 fresh qualified opportunities for the next cycle.',
        expectedRows: 30,
        columns: [
          WorkspaceTableColumn(key: 'company', label: 'Company / opportunity', width: 220),
          WorkspaceTableColumn(key: 'whyFit', label: 'Why it fits', width: 300),
          WorkspaceTableColumn(key: 'nextAction', label: 'Next action', width: 230),
        ],
      ),
    ],
  ),
};
