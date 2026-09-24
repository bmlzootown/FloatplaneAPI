/**
 * Human-readable Markdown report for Phase 2.2 / 2.2.1 evidence diffs.
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
  lines.push('### Directional gating (2.2.1)');
  lines.push('');
  lines.push(
    `* Addition conclusions allowed (requires FROM complete): **${bool(diff.additionConclusionsAllowed)}**`,
  );
  lines.push(
    `* Disappearance conclusions allowed (requires TO complete): **${bool(diff.disappearanceConclusionsAllowed)}**`,
  );
  lines.push(
    `* Method-set conclusions allowed (requires both complete): **${bool(diff.methodSetConclusionsAllowed)}**`,
  );
  lines.push('');

  if (!diff.additionConclusionsAllowed && !diff.disappearanceConclusionsAllowed) {
    lines.push(
      '**FROM and TO incomplete:** additions that depend on absence from FROM are suppressed; ' +
        'disappearances that depend on absence from TO are suppressed.',
    );
    lines.push('');
  } else if (!diff.additionConclusionsAllowed) {
    lines.push(
      '**FROM incomplete:** additions that depend on absence from FROM are suppressed. ' +
        'Disappearances may still appear when TO is complete.',
    );
    lines.push('');
  } else if (!diff.disappearanceConclusionsAllowed) {
    lines.push(
      '**TO incomplete:** disappearances that depend on absence from TO are suppressed. ' +
        'Additions may still appear when FROM is complete.',
    );
    lines.push('');
  }

  lines.push('## Summary');
  lines.push('');
  const c = diff.counts || {};
  lines.push('### Atomic (primary facts)');
  lines.push('');
  lines.push(`* Structured operations added: **${c.structured_operation_added || 0}**`);
  lines.push(
    `* Structured operations disappeared from frontend evidence: **${c.structured_operation_disappeared || 0}**`,
  );
  lines.push(`* Request-construction changes: **${c.request_construction_changed || 0}**`);
  lines.push(`* Auth/header evidence changes: **${c.auth_evidence_changed || 0}**`);
  lines.push(`* Response mapper changes: **${c.response_mapper_changed || 0}**`);
  lines.push(`* Realtime evidence changes: **${c.realtime_evidence_changed || 0}**`);
  lines.push(
    `* Weaker references added: **${c.weak_reference_added || 0}**; disappeared: **${c.weak_reference_disappeared || 0}**`,
  );
  lines.push(`* Frontend-only / provenance movement: **${c.provenance_moved || 0}**`);
  lines.push(`* Atomic total: **${c.totalAtomic ?? '—'}**`);
  lines.push('');
  lines.push('### Derived (grouped — do not triple-count with atomic)');
  lines.push('');
  lines.push(
    `* Method-set changes: **${c.method_set_changed || 0}** (derived from atomic method+path add/disappear on the same path)`,
  );
  lines.push(`* Derived total: **${c.totalDerived ?? '—'}**`);
  lines.push('');
  lines.push(`* Authoritative emitted changes (atomic + derived): **${c.total || 0}**`);
  lines.push(
    `* Suppressed (indeterminate) conclusions: **${c.suppressedTotal || 0}** — not in authoritative totals`,
  );
  lines.push('');

  sectionTable(
    lines,
    'Structured operation changes (atomic + derived)',
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

  lines.push('## Suppressed / indeterminate');
  lines.push('');
  const suppressed = diff.suppressedChanges || [];
  if (!suppressed.length) {
    lines.push('_None._');
    lines.push('');
  } else {
    for (const s of suppressed) {
      lines.push(
        `* **\`${s.proposedCategory}\`** (incomplete: ${s.incompleteObservation}) — ${s.reason}`,
      );
      if (s.path || s.method) {
        lines.push(`  * ${s.method || '—'} \`${s.path || '—'}\``);
      }
    }
    lines.push('');
  }

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
  lines.push('| Change | Kind | Method | Path | Evidence |');
  lines.push('| ------ | ---- | ------ | ---- | -------- |');
  for (const ch of changes) {
    const method =
      ch.method ||
      (ch.details?.methodsBefore
        ? `${(ch.details.methodsBefore || []).join('|')}→${(ch.details.methodsAfter || []).join('|')}`
        : '—');
    const path = ch.path || '—';
    const evidence = citeEvidence(ch);
    const kind = ch.kind || 'atomic';
    lines.push(
      `| \`${ch.category}\` | ${kind} | ${escapeCell(String(method))} | \`${escapeCell(path)}\` | ${escapeCell(evidence)} |`,
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
    lines.push(`* **\`${ch.category}\`** (${ch.kind || 'atomic'}) — ${ch.summary}`);
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

/** @param {unknown} v */
function bool(v) {
  return v ? 'yes' : 'no';
}
