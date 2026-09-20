import 'dart:convert';

import 'course_catalog.dart';
import 'progress_store.dart';
import 'workspace_schema.dart';

class ReviewPackage {
  const ReviewPackage({
    required this.data,
    required this.markdown,
  });

  final Map<String, dynamic> data;
  final String markdown;

  String get json => const JsonEncoder.withIndent('  ').convert(data);
}

class ReviewPackageBuilder {
  const ReviewPackageBuilder._();

  static const packageSchemaVersion = 1;

  static ReviewPackage build({
    required String appVersion,
    required CourseModule module,
    required ReviewSubmission submission,
    required List<ReviewSubmission> history,
  }) {
    final previousFeedback = history
        .where(
          (item) =>
              item.revision < submission.revision &&
              item.reviewerFeedback.trim().isNotEmpty,
        )
        .map(
          (item) => <String, dynamic>{
            'revision': item.revision,
            'decision': item.decision.name,
            'feedback': item.reviewerFeedback,
            'reviewedAt': item.reviewedAt?.toIso8601String(),
          },
        )
        .toList(growable: false);

    final taskSnapshot = <Map<String, dynamic>>[
      for (var i = 0; i < module.taskSteps.length; i++)
        <String, dynamic>{
          'index': i,
          'label': module.taskSteps[i],
          'completed': submission.completedTaskIndexes.contains(i),
        },
    ];

    final data = <String, dynamic>{
      'format': 'clientbound-review-package',
      'packageSchemaVersion': packageSchemaVersion,
      'clientboundVersion': appVersion,
      'module': <String, dynamic>{
        'id': module.id,
        'title': module.title,
        'focus': module.focus,
        'deliverable': module.deliverable,
        'qualityGate': module.passGate,
      },
      'submission': <String, dynamic>{
        'id': submission.id,
        'revision': submission.revision,
        'submittedAt': submission.submittedAt.toIso8601String(),
        'decision': submission.decision.name,
        'reviewerFeedback': submission.reviewerFeedback,
        'reviewedAt': submission.reviewedAt?.toIso8601String(),
      },
      'taskCompletion': taskSnapshot,
      'structuredEvidence': submission.evidenceSnapshot,
      'scratchNotes': submission.learnerNotesSnapshot,
      'previousReviewerFeedback': previousFeedback,
    };

    return ReviewPackage(
      data: data,
      markdown: _toMarkdown(
        module: module,
        submission: submission,
        previousFeedback: previousFeedback,
        taskSnapshot: taskSnapshot,
      ),
    );
  }

  static String _toMarkdown({
    required CourseModule module,
    required ReviewSubmission submission,
    required List<Map<String, dynamic>> previousFeedback,
    required List<Map<String, dynamic>> taskSnapshot,
  }) {
    final out = StringBuffer()
      ..writeln('# Clientbound Review Package')
      ..writeln()
      ..writeln('- Package schema: $packageSchemaVersion')
      ..writeln('- Module: ${module.id} — ${module.title}')
      ..writeln('- Focus: ${module.focus}')
      ..writeln('- Revision: ${submission.revision}')
      ..writeln('- Submitted: ${submission.submittedAt.toIso8601String()}')
      ..writeln('- Decision: ${submission.decision.label}')
      ..writeln()
      ..writeln('## Deliverable')
      ..writeln()
      ..writeln(module.deliverable)
      ..writeln()
      ..writeln('## Quality gate')
      ..writeln()
      ..writeln(module.passGate)
      ..writeln()
      ..writeln('## Task completion')
      ..writeln();

    for (final task in taskSnapshot) {
      out.writeln(
        '- [${task['completed'] == true ? 'x' : ' '}] ${task['label']}',
      );
    }

    out
      ..writeln()
      ..writeln('## Structured evidence')
      ..writeln();

    _writeEvidence(out, module.id, submission.evidenceSnapshot);

    out
      ..writeln()
      ..writeln('## Scratch notes')
      ..writeln()
      ..writeln(
        submission.learnerNotesSnapshot.trim().isEmpty
            ? '_No scratch notes submitted._'
            : submission.learnerNotesSnapshot.trim(),
      )
      ..writeln()
      ..writeln('## Previous reviewer feedback')
      ..writeln();

    if (previousFeedback.isEmpty) {
      out.writeln('_No previous reviewer feedback._');
    } else {
      for (final item in previousFeedback) {
        out
          ..writeln(
            '### Revision ${item['revision']} — ${item['decision'].toString().toUpperCase()}',
          )
          ..writeln()
          ..writeln(item['feedback'])
          ..writeln();
      }
    }

    return out.toString().trimRight();
  }

  static void _writeEvidence(
    StringBuffer out,
    int moduleId,
    Map<String, dynamic> evidence,
  ) {
    final definition = moduleWorkspaceDefinitions[moduleId];
    if (definition == null || evidence.isEmpty) {
      out.writeln('_No structured evidence snapshot available._');
      return;
    }

    for (final field in definition.fields) {
      final value = evidence[field.key];
      out
        ..writeln('### ${field.label}')
        ..writeln();

      if (value is List) {
        if (value.isEmpty) {
          out.writeln('_No rows submitted._');
          out.writeln();
          continue;
        }

        for (var rowIndex = 0; rowIndex < value.length; rowIndex++) {
          final row = value[rowIndex];
          out.writeln('**Row ${rowIndex + 1}**');
          if (row is Map) {
            for (final column in field.columns) {
              final cell = row[column.key]?.toString().trim() ?? '';
              out.writeln(
                '- ${column.label}: ${cell.isEmpty ? '—' : cell}',
              );
            }
          } else {
            out.writeln('- ${row.toString()}');
          }
          out.writeln();
        }
        continue;
      }

      final text = value?.toString().trim() ?? '';
      out
        ..writeln(text.isEmpty ? '_Not provided._' : text)
        ..writeln();
    }
  }
}
