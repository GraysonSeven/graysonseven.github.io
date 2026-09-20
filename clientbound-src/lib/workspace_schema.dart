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
  });

  final String key;
  final String label;
  final double width;
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
          WorkspaceTableColumn(
            key: 'company',
            label: 'Company',
            width: 180,
          ),
          WorkspaceTableColumn(
            key: 'website',
            label: 'Website',
            width: 220,
          ),
          WorkspaceTableColumn(
            key: 'whyFit',
            label: 'Why it fits',
            width: 270,
          ),
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
          WorkspaceTableColumn(
            key: 'company',
            label: 'Company',
            width: 170,
          ),
          WorkspaceTableColumn(
            key: 'contact',
            label: 'Contact',
            width: 160,
          ),
          WorkspaceTableColumn(
            key: 'role',
            label: 'Role',
            width: 170,
          ),
          WorkspaceTableColumn(
            key: 'contactRoute',
            label: 'Contact route',
            width: 190,
          ),
          WorkspaceTableColumn(
            key: 'companyProof',
            label: 'Company proof',
            width: 250,
          ),
          WorkspaceTableColumn(
            key: 'roleProof',
            label: 'Role proof',
            width: 250,
          ),
          WorkspaceTableColumn(
            key: 'contactProof',
            label: 'Contact proof',
            width: 250,
          ),
          WorkspaceTableColumn(
            key: 'reasonProof',
            label: 'Reason proof',
            width: 270,
          ),
          WorkspaceTableColumn(
            key: 'source',
            label: 'Source URL',
            width: 240,
          ),
          WorkspaceTableColumn(
            key: 'audit',
            label: 'Audit',
            width: 130,
          ),
        ],
      ),
    ],
  ),
};
