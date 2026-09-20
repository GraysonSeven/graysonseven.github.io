import 'package:flutter/material.dart';

import 'workspace_schema.dart';
import 'workspace_store.dart';

class ModuleWorkspaceCard extends StatefulWidget {
  const ModuleWorkspaceCard({
    super.key,
    required this.moduleId,
  });

  final int moduleId;

  @override
  State<ModuleWorkspaceCard> createState() =>
      _ModuleWorkspaceCardState();
}

class _ModuleWorkspaceCardState extends State<ModuleWorkspaceCard> {
  @override
  Widget build(BuildContext context) {
    final definition = moduleWorkspaceDefinitions[widget.moduleId];
    if (definition == null) return const SizedBox.shrink();

    final store = WorkspaceScope.of(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.dashboard_customize_outlined,
                  color: Theme.of(context).colorScheme.primary,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    definition.title,
                    style: const TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 18,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            const Text(
              'Structured fields autosave locally and are included in Clientbound backups.',
              style: TextStyle(
                color: Colors.white60,
                height: 1.45,
              ),
            ),
            const SizedBox(height: 18),
            for (final field in definition.fields) ...[
              _WorkspaceField(
                moduleId: widget.moduleId,
                definition: field,
                store: store,
                onStructureChanged: () => setState(() {}),
              ),
              const SizedBox(height: 18),
            ],
          ],
        ),
      ),
    );
  }
}

class _WorkspaceField extends StatelessWidget {
  const _WorkspaceField({
    required this.moduleId,
    required this.definition,
    required this.store,
    required this.onStructureChanged,
  });

  final int moduleId;
  final WorkspaceFieldDefinition definition;
  final WorkspaceStore store;
  final VoidCallback onStructureChanged;

  @override
  Widget build(BuildContext context) {
    final rows = definition.type == WorkspaceFieldType.table
        ? store.tableValue(moduleId, definition.key)
        : const <Map<String, String>>[];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                definition.required
                    ? '${definition.label} *'
                    : definition.label,
                style: const TextStyle(
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
            if (definition.expectedRows case final expected?)
              Text(
                '${rows.length}/$expected rows',
                style: TextStyle(
                  color: rows.length >= expected
                      ? const Color(0xFF50D890)
                      : Colors.white54,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
          ],
        ),
        const SizedBox(height: 5),
        Text(
          definition.help,
          style: const TextStyle(
            color: Colors.white54,
            height: 1.4,
            fontSize: 12,
          ),
        ),
        const SizedBox(height: 10),
        if (definition.type == WorkspaceFieldType.table)
          _WorkspaceTable(
            moduleId: moduleId,
            definition: definition,
            store: store,
            onStructureChanged: onStructureChanged,
          )
        else
          TextFormField(
            key: ValueKey(
              'workspace-$moduleId-${definition.key}',
            ),
            initialValue:
                store.stringValue(moduleId, definition.key),
            keyboardType: switch (definition.type) {
              WorkspaceFieldType.number =>
                TextInputType.number,
              WorkspaceFieldType.url =>
                TextInputType.url,
              _ => TextInputType.text,
            },
            minLines:
                definition.type == WorkspaceFieldType.longText ? 3 : 1,
            maxLines:
                definition.type == WorkspaceFieldType.longText ? 7 : 1,
            onChanged: (value) =>
                store.setString(moduleId, definition.key, value),
          ),
      ],
    );
  }
}

class _WorkspaceTable extends StatelessWidget {
  const _WorkspaceTable({
    required this.moduleId,
    required this.definition,
    required this.store,
    required this.onStructureChanged,
  });

  final int moduleId;
  final WorkspaceFieldDefinition definition;
  final WorkspaceStore store;
  final VoidCallback onStructureChanged;

  @override
  Widget build(BuildContext context) {
    final rows = store.tableValue(moduleId, definition.key);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (rows.isEmpty)
          const Padding(
            padding: EdgeInsets.only(bottom: 10),
            child: Text(
              'No rows yet.',
              style: TextStyle(color: Colors.white54),
            ),
          )
        else
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const SizedBox(width: 38),
                    for (final column in definition.columns)
                      SizedBox(
                        width: column.width,
                        child: Padding(
                          padding: const EdgeInsets.only(
                            right: 8,
                            bottom: 7,
                          ),
                          child: Text(
                            column.label,
                            style: const TextStyle(
                              color: Colors.white54,
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
                for (var rowIndex = 0;
                    rowIndex < rows.length;
                    rowIndex++)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SizedBox(
                          width: 38,
                          child: IconButton(
                            tooltip: 'Remove row',
                            visualDensity: VisualDensity.compact,
                            onPressed: () {
                              store.removeTableRow(
                                moduleId,
                                definition.key,
                                rowIndex,
                              );
                              onStructureChanged();
                            },
                            icon: const Icon(
                              Icons.remove_circle_outline,
                              size: 18,
                            ),
                          ),
                        ),
                        for (final column in definition.columns)
                          SizedBox(
                            width: column.width,
                            child: Padding(
                              padding:
                                  const EdgeInsets.only(right: 8),
                              child: TextFormField(
                                key: ValueKey(
                                  'workspace-$moduleId-${definition.key}-$rowIndex-${column.key}',
                                ),
                                initialValue:
                                    rows[rowIndex][column.key] ?? '',
                                minLines: 1,
                                maxLines: 4,
                                onChanged: (value) =>
                                    store.setTableCell(
                                  moduleId,
                                  definition.key,
                                  rowIndex,
                                  column.key,
                                  value,
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            OutlinedButton.icon(
              onPressed: () {
                store.addTableRow(
                  moduleId,
                  definition.key,
                  definition.columns.map((column) => column.key),
                );
                onStructureChanged();
              },
              icon: const Icon(Icons.add_rounded),
              label: const Text('Add row'),
            ),
            if (definition.expectedRows case final expected?)
              if (rows.length < expected)
                OutlinedButton.icon(
                  onPressed: () {
                    store.ensureTableRows(
                      moduleId,
                      definition.key,
                      definition.columns.map((column) => column.key),
                      expected,
                    );
                    onStructureChanged();
                  },
                  icon: const Icon(Icons.playlist_add_rounded),
                  label: Text(
                    'Add remaining ${expected - rows.length} required row(s)',
                  ),
                ),
          ],
        ),
      ],
    );
  }
}
