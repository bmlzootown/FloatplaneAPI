import path from 'node:path';
import { sha256 } from './hash.mjs';
import { DEFAULT_HOMEPAGE_URL, SCHEMA_VERSION } from './constants.mjs';
import { discoverFromHomepageHtml } from './discover.mjs';
import { fetchHomepage, fetchArtifact } from './fetch-artifact.mjs';
import { archiveObservation } from './archive.mjs';
import { compareStates } from './compare.mjs';
import { loadState, saveState } from './state.mjs';

/**
 * Run one frontend watch check.
 *
 * Failed checks do not write last-known-good state.
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
    // Malformed state is an operational failure — do not overwrite.
    return failureResult(err, previous);
  }

  try {
    let homepageText;
    let homepageRecord = null;

    if (typeof options.homepageHtml === 'string') {
      homepageText = options.homepageHtml;
    } else {
      homepageRecord = await fetchHomepage(homepageUrl, { fetchImpl: options.fetchImpl });
      homepageText = homepageRecord.text;
    }

    const discovery = discoverFromHomepageHtml(homepageText, { homepageUrl });

    /** @type {{ relativePath: string, body: Buffer, meta: object }[]} */
    const files = [];
    /** @type {import('./state.mjs').ArtifactRecord[]} */
    const artifactRecords = [];

    // Preserve discovery HTML under archive for investigation, but do NOT include it in
    // compared artifact identity — homepages often embed volatile CDN/challenge markup.
    const homeBody = homepageRecord
      ? homepageRecord.body
      : Buffer.from(homepageText, 'utf8');
    files.push({
      relativePath: '_discovery/homepage.html',
      body: homeBody,
      meta: {
        path: '_discovery/homepage.html',
        url: homepageUrl,
        sha256: sha256(homeBody),
        bytes: homeBody.length,
        contentType: homepageRecord?.contentType || 'text/html',
      },
    });

    for (const rel of discovery.artifactPaths) {
      const url = new URL(rel, discovery.baseUrl).href;
      const fetched = await fetchArtifact(url, rel, { fetchImpl: options.fetchImpl });
      const meta = {
        path: rel,
        url: fetched.url,
        sha256: fetched.sha256,
        bytes: fetched.bytes,
        contentType: fetched.contentType,
      };
      files.push({ relativePath: rel, body: fetched.body, meta });
      artifactRecords.push(meta);
    }

    const artifactDir = path.join(
      path.relative(options.repoRoot, options.artifactsRoot) || 'artifacts/frontend',
      discovery.buildId,
    );

    /** @type {import('./state.mjs').FrontendState} */
    const current = {
      schemaVersion: SCHEMA_VERSION,
      buildId: discovery.buildId,
      layout: discovery.layout,
      baseUrl: discovery.baseUrl,
      homepageUrl,
      discoveryMethod: 'homepage-html-asset-urls',
      observedAt,
      artifacts: artifactRecords,
      artifactDir: artifactDir.replace(/\\/g, '/'),
    };

    const comparison = compareStates(previous, current);

    /** @type {string[]} */
    let noteworthy = [];
    let archiveInfo = null;

    if (!options.dryRun) {
      // Always archive successful observations so disk matches what we hashed.
      // Conflict preservation handles same-path content mismatches.
      archiveInfo = await archiveObservation({
        artifactsRoot: options.artifactsRoot,
        buildId: discovery.buildId,
        files,
        observation: {
          ...current,
          comparison,
          evidence: discovery.evidence,
        },
        now,
      });
      noteworthy = archiveInfo.noteworthy;

      if (noteworthy.length > 0) {
        current.noteworthy = noteworthy;
        // Same id + unexpected content conflict is always a "change" signal.
        if (comparison.status === 'unchanged') {
          comparison.status = 'content_changed';
          comparison.summary =
            `Build id ${discovery.buildId} matched state but on-disk archive conflicted; see noteworthy`;
        }
      }

      // Only persist last-known-good after a fully successful observation.
      // On unchanged without conflicts, keep prior state file bytes stable
      // (avoid dirtying git with observedAt churn) unless there was no previous.
      const shouldWriteState =
        comparison.status !== 'unchanged' || noteworthy.length > 0 || !previous;

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
      noteworthy,
      archive: archiveInfo
        ? { buildDir: archiveInfo.buildDir, written: archiveInfo.written }
        : null,
    };
  } catch (err) {
    return failureResult(err, previous);
  }
}

/**
 * Discovery-only (no artifact fetch beyond homepage HTML).
 * @param {{
 *   homepageUrl?: string,
 *   fetchImpl?: import('./fetch-artifact.mjs').FetchLike,
 *   homepageHtml?: string,
 * }} options
 */
export async function runDiscover(options = {}) {
  const homepageUrl = options.homepageUrl || DEFAULT_HOMEPAGE_URL;
  let homepageText;
  if (typeof options.homepageHtml === 'string') {
    homepageText = options.homepageHtml;
  } else {
    const homepage = await fetchHomepage(homepageUrl, { fetchImpl: options.fetchImpl });
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
