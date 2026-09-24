import path from 'node:path';
import { sha256 } from './hash.mjs';
import { DEFAULT_HOMEPAGE_URL, SCHEMA_VERSION } from './constants.mjs';
import { discoverFromHomepageHtml } from './discover.mjs';
import { fetchHomepage, fetchArtifact } from './fetch-artifact.mjs';
import { archiveObservationTransactional } from './archive.mjs';
import { compareStates } from './compare.mjs';
import { loadState, saveState } from './state.mjs';
import { observationIdFromArtifacts } from './observation-id.mjs';

/**
 * Run one frontend watch check.
 *
 * Pipeline: discover → fetch+validate all → fingerprint → stage → promote → state.
 * Failed checks do not write last-known-good state and do not leave a partial
 * observation directory treated as valid.
 *
 * @param {{
 *   repoRoot: string,
 *   statePath: string,
 *   artifactsRoot: string,
 *   homepageUrl?: string,
 *   fetchImpl?: import('./fetch-artifact.mjs').FetchLike,
 *   homepageHtml?: string,
 *   now?: Date,
 *   dryRun?: boolean,
 *   homepageTimeoutMs?: number,
 *   artifactTimeoutMs?: number,
 *   hooks?: {
 *     beforePromote?: () => void | Promise<void>,
 *     afterStagingWrite?: () => void | Promise<void>,
 *     afterPromoteBeforeState?: () => void | Promise<void>,
 *   },
 * }} options
 */
export async function runCheck(options) {
  const homepageUrl = options.homepageUrl || DEFAULT_HOMEPAGE_URL;
  const now = options.now || new Date();
  const observedAt = now.toISOString();

  let previous = null;
  try {
    previous = await loadState(options.statePath);
  } catch (err) {
    return failureResult(err, previous);
  }

  try {
    let homepageText;
    let homepageRecord = null;

    if (typeof options.homepageHtml === 'string') {
      homepageText = options.homepageHtml;
    } else {
      homepageRecord = await fetchHomepage(homepageUrl, {
        fetchImpl: options.fetchImpl,
        timeoutMs: options.homepageTimeoutMs,
      });
      homepageText = homepageRecord.text;
    }

    const discovery = discoverFromHomepageHtml(homepageText, { homepageUrl });

    /** @type {{ relativePath: string, body: Buffer }[]} */
    const files = [];
    /** @type {import('./state.mjs').ArtifactRecord[]} */
    const artifactRecords = [];

    // Evidence-only homepage snapshot (not part of compared fingerprint).
    const homeBody = homepageRecord
      ? homepageRecord.body
      : Buffer.from(homepageText, 'utf8');
    files.push({
      relativePath: '_discovery/homepage.html',
      body: homeBody,
    });

    for (const rel of discovery.artifactPaths) {
      const url = new URL(rel, discovery.baseUrl).href;
      const fetched = await fetchArtifact(url, rel, {
        fetchImpl: options.fetchImpl,
        timeoutMs: options.artifactTimeoutMs,
      });
      artifactRecords.push({
        path: rel,
        url: fetched.url,
        sha256: fetched.sha256,
        bytes: fetched.bytes,
        contentType: fetched.contentType,
      });
      files.push({ relativePath: rel, body: fetched.body });
    }

    const observationId = observationIdFromArtifacts(artifactRecords);

    /** @type {string | null} */
    let previousObservationId = null;
    if (previous) {
      previousObservationId =
        previous.observationId === observationId
          ? previous.previousObservationId
          : previous.observationId;
    }

    const artifactDir = path.posix.join(
      toPosixRel(options.repoRoot, options.artifactsRoot) || 'artifacts/frontend',
      discovery.buildId,
      observationId,
    );

    /** @type {import('./state.mjs').FrontendState} */
    const current = {
      schemaVersion: SCHEMA_VERSION,
      observationId,
      previousObservationId,
      buildId: discovery.buildId,
      layout: discovery.layout,
      baseUrl: discovery.baseUrl,
      homepageUrl,
      discoveryMethod: 'homepage-html-asset-urls',
      observedAt,
      artifacts: artifactRecords,
      artifactDir,
    };

    // Keep observedAt stable when re-observing the same fingerprint.
    if (previous && previous.observationId === observationId) {
      current.observedAt = previous.observedAt;
    }

    const comparison = compareStates(previous, current);
    let archiveInfo = null;

    if (!options.dryRun) {
      const observationDoc = {
        schemaVersion: SCHEMA_VERSION,
        observationId,
        previousObservationId: current.previousObservationId,
        buildId: current.buildId,
        layout: current.layout,
        baseUrl: current.baseUrl,
        homepageUrl,
        discoveryMethod: current.discoveryMethod,
        observedAt: now.toISOString(),
        artifacts: artifactRecords,
        artifactDir,
        comparison,
        evidence: discovery.evidence,
        discoveryHomepageSha256: sha256(homeBody),
      };

      archiveInfo = await archiveObservationTransactional({
        artifactsRoot: options.artifactsRoot,
        buildId: discovery.buildId,
        observationId,
        files,
        observation: observationDoc,
        hooks: options.hooks,
      });

      if (options.hooks?.afterPromoteBeforeState) {
        await options.hooks.afterPromoteBeforeState();
      }

      // Persist last-known-good only after a complete promoted observation.
      // Unchanged + already archived: leave state bytes stable.
      const shouldWriteState =
        comparison.status !== 'unchanged' || !previous || previous.observationId !== observationId;

      if (shouldWriteState) {
        await saveState(options.statePath, current);
      }
    }

    const isChanged =
      comparison.status === 'first_observation' ||
      comparison.status === 'new_build' ||
      comparison.status === 'content_changed';

    return {
      ok: true,
      changed: isChanged,
      comparison,
      previous,
      current,
      discovery,
      noteworthy: [],
      archive: archiveInfo
        ? {
            observationDir: archiveInfo.observationDir,
            promoted: archiveInfo.promoted,
            alreadyPresent: archiveInfo.alreadyPresent,
            written: archiveInfo.written,
          }
        : null,
    };
  } catch (err) {
    return failureResult(err, previous);
  }
}

/**
 * @param {{
 *   homepageUrl?: string,
 *   fetchImpl?: import('./fetch-artifact.mjs').FetchLike,
 *   homepageHtml?: string,
 *   homepageTimeoutMs?: number,
 * }} options
 */
export async function runDiscover(options = {}) {
  const homepageUrl = options.homepageUrl || DEFAULT_HOMEPAGE_URL;
  let homepageText;
  if (typeof options.homepageHtml === 'string') {
    homepageText = options.homepageHtml;
  } else {
    const homepage = await fetchHomepage(homepageUrl, {
      fetchImpl: options.fetchImpl,
      timeoutMs: options.homepageTimeoutMs,
    });
    homepageText = homepage.text;
  }
  const discovery = discoverFromHomepageHtml(homepageText, { homepageUrl });
  return { ok: true, homepageUrl, discovery };
}

/**
 * @param {unknown} err
 * @param {import('./state.mjs').FrontendState | null} previous
 */
function failureResult(err, previous) {
  const error = err instanceof Error ? err : new Error(String(err));
  return {
    ok: false,
    changed: false,
    error,
    previous,
    current: null,
    comparison: null,
    discovery: null,
    noteworthy: [],
    archive: null,
  };
}

/** @param {string} repoRoot @param {string} abs */
function toPosixRel(repoRoot, abs) {
  const rel = path.relative(repoRoot, abs);
  return rel.split(path.sep).join('/');
}
