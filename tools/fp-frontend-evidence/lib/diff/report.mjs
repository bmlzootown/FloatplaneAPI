/**
 * Human-readable Markdown report for Phase 2.2 evidence diffs (§11).
 */

/**
 * @param {object} diff — machine-readable evidence-diff.json document
 * @returns {string}
 */
export function renderEvidenceDiffMarkdown(diff) {
  const lines = [];
  const realNote = diff.labelAsReal
    ? '\n> **Label:** real archived Floatplane observations.\n'
    : '\n> **Label:** comparison may include controlled fixture mutations — not presented as real Floatplane changes unless `labelAsReal` is true.\n';

  lines.push('# Floatplane Frontend API Evidence Changes');
  lines.push('');
  lines.push('From:');
  lines.push(`\`${diff.fromBuildId} / ${diff.fromObservationId}\``);
  lines.push('');
  lines.push('To:');
  lines.push(`\`${diff.toBuildId} / ${diff.toObservationId}\``);
  lines.push(realNote);
  lines.push(
    '_Frontend-evidence change report only. **Not** an authoritative server API changelog._',
  );
  lines.push('');

  lines.push('## Extraction status');
  lines.push('');
  lines.push('| Side | Observation | Build | Closure status | refuseRemoval | completeEnough |');
  lines.push('| ---- | ----------- | ----- | -------------- | ------------- | -------------- |');
  lines.push(
    `| From | \`${shortId(diff.fromObservationId)}\` | \`${diff.fromBuildId}\` | \`${diff.completeness.from.status}\` | ${diff.completeness.from.refuseRemoval} | ${diff.completeness.from.completeEnough} |`,
  );
  lines.push(
    `| To | \`${shortId(diff.toObservationId)}\` | \`${diff.toBuildId}\` | \`${diff.completeness.to.status}\` | ${diff.completeness.to.refuseRemoval} | ${diff.completeness.to.completeEnough} |`,
  );
  lines.push('');
  lines.push(`Comparison status: **${diff.comparisonStatus}**`);
  lines.push('');
  if (diff.removalSuppressed) {
    lines.push(
      '**Removal conclusions suppressed** (incomplete inventory and/or `refuseRemoval`). ' +
        'Additions may still be listed; do not treat missing ops as API removal.',
    );
    lines.push('');
  }

  lines.push('## Summary');
  lines.push('');
  const c = diff.counts || {};
  lines.push(`* Structured operations added: **${c.structured_operation_added || 0}**`);
  lines.push(
    `* Structured operations disappeared from frontend evidence: **${c.structured_operation_disappeared || 0}**`,
  );
  lines.push(`* Method-set changes: **${c.method_set_changed || 0}**`);
  lines.push(`* Request-construction changes: **${c.request_construction_changed || 0}**`);
  lines.push(`* Auth/header evidence changes: **${c.auth_evidence_changed || 0}**`);
  lines.push(`* Response mapper changes: **${c.response_mapper_changed || 0}**`);
  lines.push(`* Realtime evidence changes: **${c.realtime_evidence_changed || 0}**`);
  lines.push(
    `* Weaker references added: **${c.weak_reference_added || 0}**; disappeared: **${c.weak_reference_disappeared || 0}**`,
  );
  lines.push(`* Frontend-only / provenance movement: **${c.provenance_moved || 0}**`);
  lines.push(`* Total recorded changes: **${c.total || 0}**`);
  lines.push('');

  sectionTable(
    lines,
    'Structured operation changes',
    diff.changes.filter((x) =>
      [
        'structured_operation_added',
        'structured_operation_disappeared',
        'method_set_changed',
      ].includes(x.category),
    ),
  );

  sectionList(
    lines,
    'Request behavior changes',
    diff.changes.filter((x) => x.category === 'request_construction_changed'),
  );

  sectionList(
    lines,
    'Authentication/header changes',
    diff.changes.filter((x) => x.category === 'auth_evidence_changed'),
  );

  sectionList(
    lines,
    'Response mapper changes',
    diff.changes.filter((x) => x.category === 'response_mapper_changed'),
  );

  sectionList(
    lines,
    'Realtime changes',
    diff.changes.filter((x) => x.category === 'realtime_evidence_changed'),
  );

  sectionList(
    lines,
    'Weaker/ambiguous evidence',
    diff.changes.filter((x) =>
      ['weak_reference_added', 'weak_reference_disappeared'].includes(x.category),
    ),
  );

  sectionList(
    lines,
    'Frontend-only movement',
    diff.changes.filter((x) => x.category === 'provenance_moved'),
  );

  lines.push('## Warnings / limitations');
  lines.push('');
  if (diff.warnings?.length) {
    for (const w of diff.warnings) {
      lines.push(`* ${w}`);
    }
  } else {
    lines.push('* (none)');
  }
  lines.push('');
  lines.push(`* Comparator: \`${diff.comparatorId}@${diff.comparatorVersion}\` (schema v${diff.schemaVersion})`);
  lines.push(`* ${diff.disclaimer}`);
  lines.push('');

  return `${lines.join('\n')}\n`;
}

/**
 * @param {string[]} lines
 * @param {string} title
 * @param {object[]} changes
 */
function sectionTable(lines, title, changes) {
  lines.push(`## ${title}`);
  lines.push('');
  if (!changes.length) {
    lines.push('_None._');
    lines.push('');
    return;
  }
  lines.push('| Change | Method | Path | Evidence |');
  lines.push('| ------ | ------ | ---- | -------- |');
  for (const ch of changes) {
    const method =
      ch.method ||
      (ch.details?.methodsBefore
        ? `${(ch.details.methodsBefore || []).join('|')}→${(ch.details.methodsAfter || []).join('|')}`
        : '—');
    const path = ch.path || '—';
    const evidence = citeEvidence(ch);
    lines.push(
      `| \`${ch.category}\` | ${escapeCell(String(method))} | \`${escapeCell(path)}\` | ${escapeCell(evidence)} |`,
    );
  }
  lines.push('');
}

/**
 * @param {string[]} lines
 * @param {string} title
 * @param {object[]} changes
 */
function sectionList(lines, title, changes) {
  lines.push(`## ${title}`);
  lines.push('');
  if (!changes.length) {
    lines.push('_None._');
    lines.push('');
    return;
  }
  for (const ch of changes) {
    lines.push(`* **\`${ch.category}\`** — ${ch.summary}`);
    if (ch.path || ch.method) {
      lines.push(
        `  * ${ch.method || '—'} \`${ch.path || '—'}\` · ${citeEvidence(ch)}`,
      );
    }
    if (ch.details?.property) {
      lines.push(
        `  * \`${ch.details.property}\`: \`${fmt(ch.details.before)}\` → \`${fmt(ch.details.after)}\``,
      );
    }
  }
  lines.push('');
}

/** @param {object} ch */
function citeEvidence(ch) {
  const parts = [];
  if (ch.fromEvidenceId) parts.push(`from \`${ch.fromEvidenceId}\``);
  if (ch.toEvidenceId) parts.push(`to \`${ch.toEvidenceId}\``);
  const prov =
    (ch.toProvenance && ch.toProvenance[0]) ||
    (ch.fromProvenance && ch.fromProvenance[0]);
  if (prov?.sourcePath) {
    parts.push(`@ ${prov.sourcePath}`);
  }
  return parts.join(' · ') || '—';
}

/** @param {string} id */
function shortId(id) {
  if (!id || id.length <= 16) return id;
  return `${id.slice(0, 12)}…`;
}

/** @param {string} s */
function escapeCell(s) {
  return String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

/** @param {unknown} v */
function fmt(v) {
  if (v === null || v === undefined) return 'null';
  return String(v);
}
