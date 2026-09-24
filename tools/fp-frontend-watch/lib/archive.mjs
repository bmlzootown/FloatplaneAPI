import { mkdir, writeFile, readFile, rename, rm, access } from 'node:fs/promises';
import path from 'node:path';
import { sha256 } from './hash.mjs';

/**
 * Preserve artifacts under a deterministic layout:
 *   {artifactsRoot}/{buildId}/<relative paths>
 *   {artifactsRoot}/{buildId}/_meta/observation.json
 *
 * Never overwrite an existing archived file when contents differ; instead write
 * to `_conflicts/{iso}/{relative path}` and return noteworthy notes.
 *
 * @param {{
 *   artifactsRoot: string,
 *   buildId: string,
 *   files: { relativePath: string, body: Buffer, meta: object }[],
 *   observation: object,
 *   now?: Date,
 * }} input
 */
export async function archiveObservation(input) {
  const { artifactsRoot, buildId, files, observation } = input;
  const now = input.now || new Date();
  const iso = now.toISOString().replace(/[:.]/g, '-');

  const buildDir = path.join(artifactsRoot, sanitizeSegment(buildId));
  await mkdir(buildDir, { recursive: true });

  /** @type {string[]} */
  const noteworthy = [];
  /** @type {{ path: string, archivedAs: string, sha256: string, conflict?: string }[]} */
  const written = [];

  for (const file of files) {
    const rel = normalizeRel(file.relativePath);
    const dest = path.join(buildDir, rel);
    await mkdir(path.dirname(dest), { recursive: true });

    const exists = await fileExists(dest);
    if (exists) {
      const existing = await readFile(dest);
      const existingHash = sha256(existing);
      const newHash = sha256(file.body);
      if (existingHash === newHash) {
        written.push({ path: rel, archivedAs: dest, sha256: newHash });
        continue;
      }

      // Discovery snapshots are volatile (e.g. Cloudflare challenge markup). Overwrite
      // in place without conflict noise; compared identity uses CDN artifacts only.
      if (rel.startsWith('_discovery/')) {
        await writeFile(dest, file.body);
        written.push({ path: rel, archivedAs: dest, sha256: newHash });
        continue;
      }

      const conflictRel = path.join('_conflicts', iso, rel);
      const conflictDest = path.join(buildDir, conflictRel);
      await mkdir(path.dirname(conflictDest), { recursive: true });
      await writeFile(conflictDest, file.body);
      const note =
        `Content mismatch for archived ${rel} under build ${buildId}: ` +
        `existing sha256=${existingHash}, new sha256=${newHash}; preserved new copy at ${conflictRel}`;
      noteworthy.push(note);
      written.push({
        path: rel,
        archivedAs: conflictDest,
        sha256: newHash,
        conflict: conflictRel,
      });
      continue;
    }

    await writeFile(dest, file.body);
    written.push({ path: rel, archivedAs: dest, sha256: sha256(file.body) });
  }

  const metaDir = path.join(buildDir, '_meta');
  await mkdir(metaDir, { recursive: true });
  const metaPath = path.join(metaDir, 'observation.json');
  const metaBody = `${JSON.stringify({ ...observation, noteworthy }, null, 2)}\n`;
  // observation.json is bookkeeping for the last successful archive of this build.
  // Overwrite in place — do not treat timestamp-only meta churn as a content conflict.
  await writeFile(metaPath, metaBody);

  return {
    buildDir,
    noteworthy,
    written,
  };
}

/**
 * Write files into a staging directory then rename into place on success.
 * Used so a failed check does not leave a half-written build directory as "good".
 *
 * @param {string} stagingRoot
 * @param {() => Promise<T>} fn
 * @template T
 */
export async function withStagingDir(stagingRoot, fn) {
  await rm(stagingRoot, { recursive: true, force: true });
  await mkdir(stagingRoot, { recursive: true });
  try {
    const result = await fn();
    return result;
  } catch (err) {
    await rm(stagingRoot, { recursive: true, force: true }).catch(() => {});
    throw err;
  }
}

/** @param {string} stagingPath @param {string} finalPath */
export async function promoteStaging(stagingPath, finalPath) {
  await mkdir(path.dirname(finalPath), { recursive: true });
  // If final exists, merge is handled by archiveObservation; staging is per-run temp.
  await rename(stagingPath, finalPath);
}

/** @param {string} p */
function normalizeRel(p) {
  const norm = path.posix.normalize(p.replace(/\\/g, '/'));
  if (norm.startsWith('..') || path.isAbsolute(norm)) {
    throw new Error(`Unsafe artifact path: ${p}`);
  }
  return norm;
}

/** @param {string} seg */
function sanitizeSegment(seg) {
  if (!seg || seg.includes('..') || seg.includes('/') || seg.includes('\\')) {
    throw new Error(`Unsafe build id segment: ${seg}`);
  }
  return seg;
}

/** @param {string} p */
async function fileExists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}
