/**
 * Durable artifact layout for api-shape canary.
 *
 * artifacts/api-shape/
 *   README.md
 *   baselines/{endpointId}.schema.json
 *   captures/{captureId}/
 *     meta.json
 *     trees/{endpointId}.schema.json
 *     diff.json
 *     report.md
 */

import { mkdir, readFile, writeFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';
import {
  BASELINES_DIR,
  CAPTURES_DIR,
  SCHEMA_VERSION,
  TOOL_ID,
  TOOL_VERSION,
} from './constants.mjs';

/**
 * @param {string} artifactsRoot
 */
export function baselinesDir(artifactsRoot) {
  return path.join(artifactsRoot, BASELINES_DIR);
}

/**
 * @param {string} artifactsRoot
 */
export function capturesDir(artifactsRoot) {
  return path.join(artifactsRoot, CAPTURES_DIR);
}

/**
 * @param {Date} [now]
 */
export function makeCaptureId(now = new Date()) {
  const iso = now.toISOString().replace(/[:.]/g, '-');
  return iso.replace(/Z$/, 'Z');
}

/**
 * @param {string} artifactsRoot
 * @param {string} endpointId
 */
export function baselinePath(artifactsRoot, endpointId) {
  return path.join(baselinesDir(artifactsRoot), `${endpointId}.schema.json`);
}

/**
 * @param {string} artifactsRoot
 */
export async function loadBaselines(artifactsRoot) {
  const dir = baselinesDir(artifactsRoot);
  /** @type {Record<string, object>} */
  const out = {};
  let entries = [];
  try {
    entries = await readdir(dir);
  } catch (err) {
    if (err && err.code === 'ENOENT') return out;
    throw err;
  }
  for (const name of entries.sort()) {
    if (!name.endsWith('.schema.json')) continue;
    const id = name.replace(/\.schema\.json$/, '');
    const raw = await readFile(path.join(dir, name), 'utf8');
    const doc = JSON.parse(raw);
    out[id] = doc.tree || doc;
  }
  return out;
}

/**
 * @param {string} artifactsRoot
 * @param {string} endpointId
 * @param {object} tree
 * @param {object} [meta]
 */
export async function writeBaseline(artifactsRoot, endpointId, tree, meta = {}) {
  const dir = baselinesDir(artifactsRoot);
  await mkdir(dir, { recursive: true });
  const doc = {
    schemaVersion: SCHEMA_VERSION,
    toolId: TOOL_ID,
    toolVersion: TOOL_VERSION,
    endpointId,
    label: 'observed',
    updatedAt: new Date().toISOString(),
    ...meta,
    tree,
  };
  const file = baselinePath(artifactsRoot, endpointId);
  await writeFile(file, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
  return file;
}

/**
 * @param {{
 *   artifactsRoot: string,
 *   captureId: string,
 *   meta: object,
 *   trees: Record<string, object>,
 *   diff?: object | null,
 *   reportMd?: string | null,
 *   promoteBaselines?: boolean,
 * }} input
 */
export async function writeCapture(input) {
  const dir = path.join(capturesDir(input.artifactsRoot), input.captureId);
  const treesDir = path.join(dir, 'trees');
  await mkdir(treesDir, { recursive: true });

  await writeFile(path.join(dir, 'meta.json'), `${JSON.stringify(input.meta, null, 2)}\n`, 'utf8');

  /** @type {string[]} */
  const written = [];
  for (const [id, tree] of Object.entries(input.trees).sort(([a], [b]) => a.localeCompare(b))) {
    const doc = {
      schemaVersion: SCHEMA_VERSION,
      toolId: TOOL_ID,
      toolVersion: TOOL_VERSION,
      endpointId: id,
      label: 'observed',
      captureId: input.captureId,
      tree,
    };
    const file = path.join(treesDir, `${id}.schema.json`);
    await writeFile(file, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
    written.push(file);
    if (input.promoteBaselines) {
      await writeBaseline(input.artifactsRoot, id, tree, {
        sourceCaptureId: input.captureId,
      });
    }
  }

  if (input.diff) {
    await writeFile(path.join(dir, 'diff.json'), `${JSON.stringify(input.diff, null, 2)}\n`, 'utf8');
  }
  if (input.reportMd) {
    await writeFile(path.join(dir, 'report.md'), input.reportMd.endsWith('\n') ? input.reportMd : `${input.reportMd}\n`, 'utf8');
  }

  return { dir, written };
}

/**
 * @param {string} filePath
 */
export async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}
