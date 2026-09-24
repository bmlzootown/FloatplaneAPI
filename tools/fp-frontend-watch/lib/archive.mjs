import { mkdir, writeFile, readFile, rename, rm, access } from 'node:fs/promises';
import path from 'node:path';
import { sha256 } from './hash.mjs';
import { STAGING_DIR_NAME } from './constants.mjs';

/**
 * Archive layout (Phase 1.1):
 *   {artifactsRoot}/{buildId}/{observationId}/
 *     observation.json
 *     <artifact relative paths…>
 *     _discovery/homepage.html   (evidence only; not compared)
 *
 * observationId is content-derived (see observation-id.mjs). Same content always
 * maps to the same directory — no overwrite/conflict loop.
 *
 * Transaction:
 *   1. Write complete observation under {artifactsRoot}/.staging/…
 *   2. Atomically rename into {buildId}/{observationId}/
 *   3. Caller writes last-known-good state only after promote succeeds
 */

/**
 * @param {{
 *   artifactsRoot: string,
 *   buildId: string,
 *   observationId: string,
 *   files: { relativePath: string, body: Buffer }[],
 *   observation: object,
 *   hooks?: {
 *     beforePromote?: () => void | Promise<void>,
 *     afterStagingWrite?: () => void | Promise<void>,
 *   },
 * }} input
 */
export async function archiveObservationTransactional(input) {
  const { artifactsRoot, buildId, observationId, files, observation, hooks } = input;

  const safeBuild = sanitizeSegment(buildId);
  const safeObs = sanitizeSegment(observationId);
  const finalDir = path.join(artifactsRoot, safeBuild, safeObs);

  if (await fileExists(finalDir)) {
    await assertExistingObservationMatches(finalDir, observationId, files);
    return {
      observationDir: finalDir,
      promoted: false,
      alreadyPresent: true,
      written: files.map((f) => ({
        path: normalizeRel(f.relativePath),
        archivedAs: path.join(finalDir, normalizeRel(f.relativePath)),
        sha256: sha256(f.body),
      })),
    };
  }

  const stagingRoot = path.join(artifactsRoot, STAGING_DIR_NAME);
  const stagingDir = path.join(
    stagingRoot,
    `${safeBuild}-${safeObs.slice(0, 12)}-${process.pid}-${Date.now()}`,
  );

  await rm(stagingDir, { recursive: true, force: true });
  await mkdir(stagingDir, { recursive: true });

  /** @type {{ path: string, archivedAs: string, sha256: string }[]} */
  const written = [];

  try {
    for (const file of files) {
      const rel = normalizeRel(file.relativePath);
      const dest = path.join(stagingDir, rel);
      await mkdir(path.dirname(dest), { recursive: true });
      await writeFile(dest, file.body);
      written.push({ path: rel, archivedAs: dest, sha256: sha256(file.body) });
    }

    const metaBody = `${JSON.stringify(observation, null, 2)}\n`;
    await writeFile(path.join(stagingDir, 'observation.json'), metaBody);

    if (hooks?.afterStagingWrite) {
      await hooks.afterStagingWrite();
    }
    if (hooks?.beforePromote) {
      await hooks.beforePromote();
    }

    await mkdir(path.join(artifactsRoot, safeBuild), { recursive: true });

    // Atomic promote (same-filesystem rename of the directory).
    try {
      await rename(stagingDir, finalDir);
    } catch (err) {
      // Race: another process promoted the same observationId.
      if (err && /** @type {NodeJS.ErrnoException} */ (err).code === 'ENOTEMPTY') {
        await rm(stagingDir, { recursive: true, force: true }).catch(() => {});
        await assertExistingObservationMatches(finalDir, observationId, files);
        return {
          observationDir: finalDir,
          promoted: false,
          alreadyPresent: true,
          written: files.map((f) => ({
            path: normalizeRel(f.relativePath),
            archivedAs: path.join(finalDir, normalizeRel(f.relativePath)),
            sha256: sha256(f.body),
          })),
        };
      }
      // EEXIST on some platforms when dest exists
      if (err && /** @type {NodeJS.ErrnoException} */ (err).code === 'EEXIST') {
        await rm(stagingDir, { recursive: true, force: true }).catch(() => {});
        await assertExistingObservationMatches(finalDir, observationId, files);
        return {
          observationDir: finalDir,
          promoted: false,
          alreadyPresent: true,
          written: files.map((f) => ({
            path: normalizeRel(f.relativePath),
            archivedAs: path.join(finalDir, normalizeRel(f.relativePath)),
            sha256: sha256(f.body),
          })),
        };
      }
      throw err;
    }

    return {
      observationDir: finalDir,
      promoted: true,
      alreadyPresent: false,
      written: written.map((w) => ({
        ...w,
        archivedAs: path.join(finalDir, w.path),
      })),
    };
  } catch (err) {
    await rm(stagingDir, { recursive: true, force: true }).catch(() => {});
    // Leave any incomplete finalDir alone only if we didn't create it; rename is atomic.
    throw err;
  }
}

/**
 * @param {string} finalDir
 * @param {string} observationId
 * @param {{ relativePath: string, body: Buffer }[]} files
 */
async function assertExistingObservationMatches(finalDir, observationId, files) {
  const metaPath = path.join(finalDir, 'observation.json');
  if (!(await fileExists(metaPath))) {
    throw new Error(
      `Observation directory exists but observation.json missing: ${finalDir}`,
    );
  }
  let meta;
  try {
    meta = JSON.parse(await readFile(metaPath, 'utf8'));
  } catch {
    throw new Error(`Unreadable observation.json in ${finalDir}`);
  }
  if (meta.observationId !== observationId) {
    throw new Error(
      `Observation id mismatch in ${finalDir}: on-disk ${meta.observationId} vs ${observationId}`,
    );
  }
  for (const file of files) {
    const rel = normalizeRel(file.relativePath);
    // Discovery HTML may differ between runs; skip strict byte match for evidence-only paths.
    if (rel.startsWith('_discovery/')) continue;
    const dest = path.join(finalDir, rel);
    if (!(await fileExists(dest))) {
      throw new Error(`Existing observation missing artifact ${rel} under ${finalDir}`);
    }
    const existingHash = sha256(await readFile(dest));
    const expectedHash = sha256(file.body);
    if (existingHash !== expectedHash) {
      throw new Error(
        `Existing observation artifact ${rel} hash mismatch under ${finalDir}`,
      );
    }
  }
}

/** @deprecated use archiveObservationTransactional */
export const archiveObservation = archiveObservationTransactional;

/**
 * @param {string} stagingRoot
 * @param {() => Promise<T>} fn
 * @template T
 */
export async function withStagingDir(stagingRoot, fn) {
  await rm(stagingRoot, { recursive: true, force: true });
  await mkdir(stagingRoot, { recursive: true });
  try {
    return await fn();
  } catch (err) {
    await rm(stagingRoot, { recursive: true, force: true }).catch(() => {});
    throw err;
  }
}

/** @param {string} stagingPath @param {string} finalPath */
export async function promoteStaging(stagingPath, finalPath) {
  await mkdir(path.dirname(finalPath), { recursive: true });
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
    throw new Error(`Unsafe path segment: ${seg}`);
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
