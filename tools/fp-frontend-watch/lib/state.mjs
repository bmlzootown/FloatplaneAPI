import { readFile, writeFile, mkdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { SCHEMA_VERSION } from './constants.mjs';

/**
 * @typedef {{
 *   path: string,
 *   url: string,
 *   sha256: string,
 *   bytes: number,
 *   contentType?: string | null,
 * }} ArtifactRecord
 *
 * @typedef {{
 *   schemaVersion: number,
 *   buildId: string,
 *   layout: string,
 *   baseUrl: string,
 *   homepageUrl: string,
 *   discoveryMethod: string,
 *   observedAt: string,
 *   artifacts: ArtifactRecord[],
 *   artifactDir: string,
 *   noteworthy?: string[],
 * }} FrontendState
 */

/**
 * @param {string} statePath
 * @returns {Promise<FrontendState | null>}
 */
export async function loadState(statePath) {
  let raw;
  try {
    raw = await readFile(statePath, 'utf8');
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      return null;
    }
    throw err;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new StateError(`Malformed state JSON at ${statePath}`);
  }

  return normalizeState(parsed, statePath);
}

/**
 * @param {unknown} parsed
 * @param {string} statePath
 * @returns {FrontendState}
 */
export function normalizeState(parsed, statePath = '<memory>') {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new StateError(`Malformed state at ${statePath}: expected object`);
  }
  const s = /** @type {Record<string, unknown>} */ (parsed);

  if (s.schemaVersion !== SCHEMA_VERSION) {
    throw new StateError(
      `Unsupported state schemaVersion at ${statePath}: ${String(s.schemaVersion)} (expected ${SCHEMA_VERSION})`,
    );
  }
  for (const key of ['buildId', 'layout', 'baseUrl', 'homepageUrl', 'discoveryMethod', 'observedAt', 'artifactDir']) {
    if (typeof s[key] !== 'string' || s[key].length === 0) {
      throw new StateError(`Malformed state at ${statePath}: missing string field ${key}`);
    }
  }
  if (!Array.isArray(s.artifacts) || s.artifacts.length === 0) {
    throw new StateError(`Malformed state at ${statePath}: artifacts must be a non-empty array`);
  }

  /** @type {ArtifactRecord[]} */
  const artifacts = [];
  for (const item of s.artifacts) {
    if (!item || typeof item !== 'object') {
      throw new StateError(`Malformed state at ${statePath}: artifact entry not an object`);
    }
    const a = /** @type {Record<string, unknown>} */ (item);
    if (typeof a.path !== 'string' || typeof a.url !== 'string' || typeof a.sha256 !== 'string') {
      throw new StateError(`Malformed state at ${statePath}: artifact missing path/url/sha256`);
    }
    if (typeof a.bytes !== 'number' || !Number.isFinite(a.bytes) || a.bytes < 0) {
      throw new StateError(`Malformed state at ${statePath}: artifact bytes invalid for ${a.path}`);
    }
    if (!/^[a-f0-9]{64}$/.test(a.sha256)) {
      throw new StateError(`Malformed state at ${statePath}: artifact sha256 invalid for ${a.path}`);
    }
    artifacts.push({
      path: a.path,
      url: a.url,
      sha256: a.sha256,
      bytes: a.bytes,
      contentType: typeof a.contentType === 'string' ? a.contentType : null,
    });
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    buildId: /** @type {string} */ (s.buildId),
    layout: /** @type {string} */ (s.layout),
    baseUrl: /** @type {string} */ (s.baseUrl),
    homepageUrl: /** @type {string} */ (s.homepageUrl),
    discoveryMethod: /** @type {string} */ (s.discoveryMethod),
    observedAt: /** @type {string} */ (s.observedAt),
    artifacts,
    artifactDir: /** @type {string} */ (s.artifactDir),
    noteworthy: Array.isArray(s.noteworthy)
      ? s.noteworthy.filter((x) => typeof x === 'string')
      : undefined,
  };
}

/**
 * Atomically write state JSON. Writes to a temp file then renames.
 * @param {string} statePath
 * @param {FrontendState} state
 */
export async function saveState(statePath, state) {
  const dir = path.dirname(statePath);
  await mkdir(dir, { recursive: true });
  const tmp = path.join(dir, `.${path.basename(statePath)}.${process.pid}.${Date.now()}.tmp`);
  const body = `${JSON.stringify(state, null, 2)}\n`;
  try {
    await writeFile(tmp, body, 'utf8');
    await rename(tmp, statePath);
  } catch (err) {
    await rm(tmp, { force: true }).catch(() => {});
    throw err;
  }
}

export class StateError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message);
    this.name = 'StateError';
  }
}
