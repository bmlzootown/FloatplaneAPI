/**
 * Apply sanitized example fixtures into OpenAPI operation response `example`
 * (and request query `schema.example` for id params when present).
 *
 * Evidence-only: never invents fields; only replaces example payloads from
 * reviewable sanitized fixtures under artifacts/api-shape/examples/.
 */

import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { EXAMPLE_OPENAPI_TARGETS } from './sanitize.mjs';

/**
 * @param {{
 *   openapiPath: string,
 *   examplesDir: string,
 *   endpointIds?: string[] | null,
 * }} opts
 */
export async function applyExamplesToOpenApi(opts) {
  const raw = await readFile(opts.openapiPath, 'utf8');
  const spec = JSON.parse(raw);
  const files = await readdir(opts.examplesDir);
  /** @type {string[]} */
  const applied = [];
  /** @type {string[]} */
  const skipped = [];

  for (const name of files.sort()) {
    if (!name.endsWith('.json')) continue;
    const endpointId = name.replace(/\.json$/, '');
    if (opts.endpointIds && !opts.endpointIds.includes(endpointId)) continue;
    const target = EXAMPLE_OPENAPI_TARGETS[endpointId];
    if (!target) {
      skipped.push(`${endpointId} (no OpenAPI target mapping)`);
      continue;
    }
    const doc = JSON.parse(await readFile(path.join(opts.examplesDir, name), 'utf8'));
    const exampleValue = doc.value;
    if (exampleValue === undefined) {
      skipped.push(`${endpointId} (missing value)`);
      continue;
    }

    const pathItem = spec.paths?.[target.path];
    const op = pathItem?.[target.method];
    if (!op) {
      skipped.push(`${endpointId} (operation missing)`);
      continue;
    }

    const media =
      op.responses?.['200']?.content?.['application/json'] ||
      op.responses?.['200']?.content?.['application/json; charset=utf-8'];
    if (!media) {
      skipped.push(`${endpointId} (no 200 application/json)`);
      continue;
    }
    media.example = exampleValue;

    // Request-side: stub query/path id examples from the sanitized payload when possible.
    const idExample = pickIdExample(endpointId, exampleValue);
    if (idExample && Array.isArray(op.parameters)) {
      for (const param of op.parameters) {
        if (param.in === 'query' && param.name === 'id') {
          if (!param.schema) param.schema = { type: 'string' };
          param.schema.example = idExample;
        }
      }
    }

    applied.push(endpointId);
  }

  await writeFile(opts.openapiPath, `${JSON.stringify(spec, null, '\t')}\n`, 'utf8');
  return { applied, skipped, openapiPath: opts.openapiPath };
}

/**
 * @param {string} endpointId
 * @param {unknown} exampleValue
 * @returns {string|null}
 */
function pickIdExample(endpointId, exampleValue) {
  if (endpointId === 'content-post' || endpointId === 'content-video') {
    if (exampleValue && typeof exampleValue === 'object' && !Array.isArray(exampleValue)) {
      const id = /** @type {Record<string, unknown>} */ (exampleValue).id;
      return typeof id === 'string' ? id : null;
    }
  }
  if (endpointId === 'content-creator') {
    if (Array.isArray(exampleValue) && exampleValue[0] && typeof exampleValue[0] === 'object') {
      const creator = /** @type {Record<string, unknown>} */ (exampleValue[0]).creator;
      if (creator && typeof creator === 'object') {
        const id = /** @type {Record<string, unknown>} */ (creator).id;
        return typeof id === 'string' ? id : null;
      }
    }
  }
  return null;
}
