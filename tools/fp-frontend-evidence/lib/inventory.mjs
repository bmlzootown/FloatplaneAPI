/**
 * Build human-reviewable inventory markdown for ONE observation.
 * Not a change report. Does not claim complete server API.
 */

import { EVIDENCE_CATEGORY, EXTRACTOR_ID, EXTRACTOR_VERSION } from './constants.mjs';
import { countStructuredOperations } from './extract.mjs';

/**
 * @param {{
 *   observationId: string,
 *   buildId: string,
 *   evidence: object,
 *   chunkGraph: object,
 * }} input
 * @returns {string}
 */
export function renderInventoryMarkdown(input) {
  const { observationId, buildId, evidence, chunkGraph } = input;
  const items = evidence.items || [];
  const structured = items.filter((i) => i.category === EVIDENCE_CATEGORY.STRUCTURED_OPERATION);
  const byCategory = countBy(items, (i) => i.category);
  const byMethod = countBy(
    structured.filter((i) => i.method),
    (i) => i.method,
  );

  const lines = [];
  lines.push(`# Frontend API evidence inventory`);
  lines.push(``);
  lines.push(`**Observation:** \`${observationId}\``);
  lines.push(`**Build:** \`${buildId}\``);
  lines.push(`**Extractor:** \`${EXTRACTOR_ID}@${EXTRACTOR_VERSION}\``);
  lines.push(`**Evidence schema:** \`v${evidence.schemaVersion}\``);
  lines.push(`**Extracted at:** ${evidence.extractedAt}`);
  lines.push(``);
  lines.push(`> Frontend client evidence from archived JS for this observation only.`);
  lines.push(`> This is **not** a complete server API catalog and **not** an inter-observation change report.`);
  lines.push(``);

  lines.push(`## Counts`);
  lines.push(``);
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|------:|`);
  lines.push(`| Structured operations (unique method+path) | ${countStructuredOperations(items)} |`);
  lines.push(`| Evidence items (all categories) | ${items.length} |`);
  for (const [cat, n] of Object.entries(byCategory).sort()) {
    lines.push(`| Category \`${cat}\` | ${n} |`);
  }
  lines.push(`| Rejected signals | ${(evidence.rejectedSignals || []).length} |`);
  lines.push(`| Reachable JS modules | ${chunkGraph.stats?.reachableJsCount ?? '—'} |`);
  lines.push(`| Lazy JS (excl. entry) | ${chunkGraph.stats?.lazyJsCount ?? '—'} |`);
  lines.push(`| JS bytes archived (phase2 chunks) | ${chunkGraph.stats?.archivedChunkBytes ?? '—'} |`);
  lines.push(`| Collection status | ${chunkGraph.collectionStatus ?? '—'} |`);
  lines.push(``);

  lines.push(`## Structured operations by method`);
  lines.push(``);
  lines.push(`| Method | Count |`);
  lines.push(`|--------|------:|`);
  for (const [method, n] of Object.entries(byMethod).sort()) {
    lines.push(`| ${method} | ${n} |`);
  }
  if (Object.keys(byMethod).length === 0) {
    lines.push(`| — | 0 |`);
  }
  lines.push(``);

  lines.push(`## Structured operations (METHOD PATH SOURCE)`);
  lines.push(``);
  lines.push(`| Method | Path | Source |`);
  lines.push(`|--------|------|--------|`);
  const sortedOps = [...structured].sort((a, b) => {
    const pa = a.pathNormalized || '';
    const pb = b.pathNormalized || '';
    if (pa !== pb) return pa.localeCompare(pb);
    return (a.method || '').localeCompare(b.method || '');
  });
  for (const op of sortedOps) {
    lines.push(
      `| ${op.method} | \`${op.pathNormalized}\` | \`${op.source.path}\` |`,
    );
  }
  if (sortedOps.length === 0) {
    lines.push(`| — | — | — |`);
  }
  lines.push(``);

  const realtime = items.filter((i) => i.category === EVIDENCE_CATEGORY.REALTIME_OPERATION);
  lines.push(`## Realtime`);
  lines.push(``);
  if (realtime.length === 0) {
    lines.push(`_(none)_`);
  } else {
    for (const r of realtime) {
      lines.push(
        `- \`${r.method || '—'}\` \`${r.pathNormalized || r.path || '—'}\` (${r.structuralContext}) — \`${r.source.path}\``,
      );
    }
  }
  lines.push(``);

  const templates = items.filter((i) => i.category === EVIDENCE_CATEGORY.URL_TEMPLATE);
  if (templates.length) {
    lines.push(`## URL templates`);
    lines.push(``);
    for (const t of templates) {
      lines.push(`- \`${t.pathNormalized || t.path}\` — \`${t.source.path}\``);
    }
    lines.push(``);
  }

  const warnings = evidence.warnings || [];
  lines.push(`## Warnings`);
  lines.push(``);
  if (warnings.length === 0) {
    lines.push(`_(none)_`);
  } else {
    for (const w of warnings) {
      lines.push(`- ${w}`);
    }
  }
  lines.push(``);

  const rejected = evidence.rejectedSignals || [];
  if (rejected.length) {
    lines.push(`## Rejected signals`);
    lines.push(``);
    for (const r of rejected.slice(0, 50)) {
      lines.push(`- \`${r.reason}\`: \`${String(r.raw).slice(0, 120)}\` (\`${r.sourcePath}\`)`);
    }
    if (rejected.length > 50) {
      lines.push(`- _…and ${rejected.length - 50} more_`);
    }
    lines.push(``);
  }

  lines.push(`## Disclaimer`);
  lines.push(``);
  lines.push(
    `Paths and methods above are evidenced in frontend client bundles for this observation.`,
  );
  lines.push(
    `Presence in the client does not confirm public availability, authorization, or server behavior.`,
  );
  lines.push(``);

  return `${lines.join('\n')}\n`;
}

/**
 * @template T
 * @param {T[]} arr
 * @param {(x: T) => string} keyFn
 */
function countBy(arr, keyFn) {
  /** @type {Record<string, number>} */
  const out = {};
  for (const x of arr) {
    const k = keyFn(x);
    out[k] = (out[k] || 0) + 1;
  }
  return out;
}
