/**
 * Structural field-tree diff: added / removed / type-changed paths.
 */

import { flattenFieldTree, typeKey } from './field-tree.mjs';

/**
 * @param {object} fromTree baseline / previous
 * @param {object} toTree current
 * @returns {{
 *   added: string[],
 *   removed: string[],
 *   typeChanged: { path: string, from: string|string[], to: string|string[] }[],
 *   unchangedCount: number,
 *   hasDrift: boolean,
 * }}
 */
export function diffFieldTrees(fromTree, toTree) {
  const from = flattenFieldTree(fromTree);
  const to = flattenFieldTree(toTree);
  const fromPaths = new Set(Object.keys(from));
  const toPaths = new Set(Object.keys(to));

  /** @type {string[]} */
  const added = [];
  /** @type {string[]} */
  const removed = [];
  /** @type {{ path: string, from: string|string[], to: string|string[] }[]} */
  const typeChanged = [];

  for (const path of [...toPaths].sort()) {
    if (!fromPaths.has(path)) {
      added.push(path);
      continue;
    }
    const a = from[path];
    const b = to[path];
    if (typeKey(a.type) !== typeKey(b.type)) {
      typeChanged.push({ path, from: a.type, to: b.type });
    }
  }
  for (const path of [...fromPaths].sort()) {
    if (!toPaths.has(path)) removed.push(path);
  }

  const unchangedCount =
    [...fromPaths].filter(
      (p) => toPaths.has(p) && typeKey(from[p].type) === typeKey(to[p].type),
    ).length;

  const hasDrift = added.length > 0 || removed.length > 0 || typeChanged.length > 0;
  return { added, removed, typeChanged, unchangedCount, hasDrift };
}

/**
 * Diff a map of endpoint-id → field tree.
 * @param {Record<string, object>} fromBaselines
 * @param {Record<string, object>} toTrees
 */
export function diffBaselineMaps(fromBaselines, toTrees) {
  /** @type {Record<string, ReturnType<typeof diffFieldTrees>>} */
  const byEndpoint = {};
  let hasDrift = false;
  const ids = unionSorted([...Object.keys(fromBaselines), ...Object.keys(toTrees)]);
  for (const id of ids) {
    if (!fromBaselines[id]) {
      byEndpoint[id] = {
        added: ['$'],
        removed: [],
        typeChanged: [],
        unchangedCount: 0,
        hasDrift: true,
        note: 'no prior baseline for endpoint',
      };
      hasDrift = true;
      continue;
    }
    if (!toTrees[id]) {
      byEndpoint[id] = {
        added: [],
        removed: ['$'],
        typeChanged: [],
        unchangedCount: 0,
        hasDrift: true,
        note: 'endpoint missing from capture',
      };
      hasDrift = true;
      continue;
    }
    const d = diffFieldTrees(fromBaselines[id], toTrees[id]);
    byEndpoint[id] = d;
    if (d.hasDrift) hasDrift = true;
  }
  return { byEndpoint, hasDrift };
}

/**
 * Markdown report for a multi-endpoint structural diff.
 * @param {{
 *   captureId: string,
 *   comparedAt: string,
 *   byEndpoint: Record<string, any>,
 *   hasDrift: boolean,
 *   notes?: string[],
 * }} input
 */
export function formatDiffReportMarkdown(input) {
  const lines = [
    `# API shape canary report — ${input.captureId}`,
    '',
    `- Compared at: ${input.comparedAt}`,
    `- Drift: **${input.hasDrift ? 'YES' : 'no'}**`,
    '',
    'Structural only (added / removed / type-changed paths). Bodies are not stored.',
    '',
  ];
  if (input.notes?.length) {
    lines.push('## Notes', '');
    for (const n of input.notes) lines.push(`- ${n}`);
    lines.push('');
  }
  for (const id of Object.keys(input.byEndpoint).sort()) {
    const d = input.byEndpoint[id];
    lines.push(`## \`${id}\``, '');
    if (d.note) lines.push(`_${d.note}_`, '');
    lines.push(`- Unchanged paths: ${d.unchangedCount}`);
    lines.push(`- Added (${d.added.length}): ${formatList(d.added)}`);
    lines.push(`- Removed (${d.removed.length}): ${formatList(d.removed)}`);
    if (d.typeChanged.length === 0) {
      lines.push('- Type-changed: (none)');
    } else {
      lines.push('- Type-changed:');
      for (const c of d.typeChanged) {
        lines.push(`  - \`${c.path}\`: \`${typeKey(c.from)}\` → \`${typeKey(c.to)}\``);
      }
    }
    lines.push('');
  }
  lines.push(
    '## Labels',
    '',
    '- Paths are **observed** live shapes, not OpenAPI authority.',
    '- Do not invent OpenAPI properties from a single sample; treat drift as review evidence.',
    '',
  );
  return lines.join('\n');
}

/** @param {string[]} items */
function formatList(items) {
  if (items.length === 0) return '(none)';
  if (items.length <= 12) return items.map((p) => `\`${p}\``).join(', ');
  return (
    items
      .slice(0, 12)
      .map((p) => `\`${p}\``)
      .join(', ') + ` … (+${items.length - 12} more)`
  );
}

/** @param {string[]} values */
function unionSorted(values) {
  return [...new Set(values)].sort();
}
