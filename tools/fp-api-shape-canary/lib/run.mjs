/**
 * Orchestrate allowlisted capture → field trees → baseline diff.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import {
  ALLOWLIST,
  EXIT,
  OIDC,
  OIDC_EVIDENCE,
  SCHEMA_VERSION,
  TOOL_ID,
  TOOL_VERSION,
  UNAUTH_LIST,
} from './constants.mjs';
import { buildFieldTree } from './field-tree.mjs';
import { diffBaselineMaps, formatDiffReportMarkdown } from './diff.mjs';
import {
  apiGetJson,
  pickCreatorIdFromSubscriptions,
  pickPostIdFromCreatorList,
  pickVideoAttachmentId,
  redactToken,
} from './probe.mjs';
import { loadBaselines, makeCaptureId, writeCapture } from './store.mjs';

/**
 * Resolve access token from env / file. Never invent tokens.
 * @param {{ token?: string|null, tokenFile?: string|null, env?: NodeJS.ProcessEnv }} opts
 */
export async function resolveAccessToken(opts = {}) {
  const env = opts.env || process.env;
  if (opts.token) return opts.token;
  if (env.FP_ACCESS_TOKEN) return env.FP_ACCESS_TOKEN;
  const file = opts.tokenFile || env.FP_TOKEN_FILE;
  if (!file) return null;
  try {
    const raw = await readFile(file, 'utf8');
    const token = raw.trim();
    return token || null;
  } catch (err) {
    if (err && err.code === 'ENOENT') return null;
    throw err;
  }
}

/**
 * Persist token to a local gitignored file (operator convenience).
 * @param {string} filePath
 * @param {string} accessToken
 */
export async function writeTokenFile(filePath, accessToken) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${accessToken}\n`, { encoding: 'utf8', mode: 0o600 });
}

/**
 * @param {{
 *   artifactsRoot: string,
 *   accessToken?: string|null,
 *   creatorId?: string|null,
 *   postId?: string|null,
 *   includeOptionalVideo?: boolean,
 *   unauthList?: boolean,
 *   unauthCreatorId?: string|null,
 *   promoteBaselines?: boolean,
 *   fetchImpl?: typeof fetch,
 *   now?: Date,
 *   dryRun?: boolean,
 * }} opts
 */
export async function runCapture(opts) {
  const now = opts.now || new Date();
  const captureId = makeCaptureId(now);
  /** @type {Record<string, object>} */
  const trees = {};
  /** @type {object[]} */
  const calls = [];
  /** @type {string[]} */
  const notes = [];
  /** @type {string[]} */
  const errors = [];

  let creatorId = opts.creatorId || null;
  let postId = opts.postId || null;
  let videoId = null;

  if (opts.unauthList) {
    const creator = opts.unauthCreatorId || UNAUTH_LIST.defaultCreatorId;
    const result = await apiGetJson({
      path: UNAUTH_LIST.path,
      query: { id: creator, limit: 1 },
      accessToken: null,
      fetchImpl: opts.fetchImpl,
    });
    calls.push({
      id: UNAUTH_LIST.id,
      method: 'GET',
      path: UNAUTH_LIST.path,
      status: result.status,
      ok: result.ok,
      auth: 'none',
    });
    if (result.ok && result.json != null) {
      trees[UNAUTH_LIST.id] = buildFieldTree(result.json);
      if (!postId) postId = pickPostIdFromCreatorList(result.json);
    } else {
      errors.push(`unauth list HTTP ${result.status}`);
    }
  }

  if (!opts.accessToken && !opts.unauthList) {
    return {
      exitCode: EXIT.NEEDS_AUTH,
      captureId,
      trees,
      calls,
      notes: [
        'No access token. Run: make api-shape-device-login (human approves device code), then set FP_ACCESS_TOKEN or state/api-shape-token.local',
      ],
      errors: ['missing access token'],
      diff: null,
      reportMd: null,
      dir: null,
    };
  }

  if (opts.accessToken) {
    notes.push(`Bearer present (${redactToken(opts.accessToken)})`);

    // 1) user/self
    {
      const ep = ALLOWLIST.find((e) => e.id === 'user-self');
      const result = await apiGetJson({
        path: ep.path,
        accessToken: opts.accessToken,
        fetchImpl: opts.fetchImpl,
      });
      calls.push({ id: ep.id, method: 'GET', path: ep.path, status: result.status, ok: result.ok, auth: 'bearer' });
      if (result.ok && result.json != null) trees[ep.id] = buildFieldTree(result.json);
      else errors.push(`user-self HTTP ${result.status}`);
    }

    // 2) subscriptions → creator id
    {
      const ep = ALLOWLIST.find((e) => e.id === 'user-subscriptions');
      const result = await apiGetJson({
        path: ep.path,
        accessToken: opts.accessToken,
        fetchImpl: opts.fetchImpl,
      });
      calls.push({
        id: ep.id,
        method: 'GET',
        path: ep.path,
        status: result.status,
        ok: result.ok,
        auth: 'bearer',
      });
      if (result.ok && result.json != null) {
        trees[ep.id] = buildFieldTree(result.json);
        if (!creatorId) creatorId = pickCreatorIdFromSubscriptions(result.json);
      } else {
        errors.push(`user-subscriptions HTTP ${result.status}`);
      }
    }

    if (!creatorId) {
      notes.push('No creatorId from subscriptions; pass --creator-id to continue list/post probe');
    } else {
      // 3) content/creator?limit=1
      const ep = ALLOWLIST.find((e) => e.id === 'content-creator');
      const result = await apiGetJson({
        path: ep.path,
        query: { id: creatorId, limit: 1 },
        accessToken: opts.accessToken,
        fetchImpl: opts.fetchImpl,
      });
      calls.push({
        id: ep.id,
        method: 'GET',
        path: ep.path,
        status: result.status,
        ok: result.ok,
        auth: 'bearer',
        query: { id: '(redacted)', limit: 1 },
      });
      if (result.ok && result.json != null) {
        trees[ep.id] = buildFieldTree(result.json);
        if (!postId) postId = pickPostIdFromCreatorList(result.json);
      } else {
        errors.push(`content-creator HTTP ${result.status}`);
      }
    }

    if (!postId) {
      notes.push('No postId available; pass --post-id for primary canary GET /api/v3/content/post');
    } else {
      // 4) content/post — primary
      const ep = ALLOWLIST.find((e) => e.id === 'content-post');
      const result = await apiGetJson({
        path: ep.path,
        query: { id: postId },
        accessToken: opts.accessToken,
        fetchImpl: opts.fetchImpl,
      });
      calls.push({
        id: ep.id,
        method: 'GET',
        path: ep.path,
        status: result.status,
        ok: result.ok,
        auth: 'bearer',
        query: { id: '(redacted)' },
      });
      if (result.ok && result.json != null) {
        trees[ep.id] = buildFieldTree(result.json);
        videoId = pickVideoAttachmentId(result.json);
      } else {
        errors.push(`content-post HTTP ${result.status}`);
      }
    }

    if (opts.includeOptionalVideo && videoId) {
      const ep = ALLOWLIST.find((e) => e.id === 'content-video');
      const result = await apiGetJson({
        path: ep.path,
        query: { id: videoId },
        accessToken: opts.accessToken,
        fetchImpl: opts.fetchImpl,
      });
      calls.push({
        id: ep.id,
        method: 'GET',
        path: ep.path,
        status: result.status,
        ok: result.ok,
        auth: 'bearer',
        query: { id: '(redacted)' },
        optional: true,
      });
      if (result.ok && result.json != null) trees[ep.id] = buildFieldTree(result.json);
      else notes.push(`optional content-video HTTP ${result.status}`);
    } else if (opts.includeOptionalVideo) {
      notes.push('optional content-video skipped (no video attachment id)');
    }
  }

  const baselines = await loadBaselines(opts.artifactsRoot);
  const hasAnyBaseline = Object.keys(baselines).length > 0;
  const comparable = {};
  for (const id of Object.keys(trees)) {
    if (baselines[id]) comparable[id] = baselines[id];
  }
  const diff =
    Object.keys(trees).length > 0
      ? {
          ...diffBaselineMaps(hasAnyBaseline ? comparable : {}, trees),
          // When no baselines exist, treat as first capture (no drift alarm)
          firstCapture: !hasAnyBaseline,
        }
      : null;

  if (diff && diff.firstCapture) {
    diff.hasDrift = false;
    if (opts.promoteBaselines) {
      notes.push('No prior baselines — seeding baselines/ from this capture (--promote-baselines)');
    } else {
      notes.push('No baselines yet — first capture; use --promote-baselines to seed baselines/');
    }
  }

  const reportMd =
    diff && Object.keys(trees).length > 0
      ? formatDiffReportMarkdown({
          captureId,
          comparedAt: now.toISOString(),
          byEndpoint: diff.byEndpoint,
          hasDrift: Boolean(diff.hasDrift),
          notes: [
            ...notes,
            `OIDC clientId=${OIDC.clientId} (evidence: frontend TV config)`,
            OIDC_EVIDENCE.clientIdSource,
          ],
        })
      : null;

  const meta = {
    schemaVersion: SCHEMA_VERSION,
    toolId: TOOL_ID,
    toolVersion: TOOL_VERSION,
    captureId,
    capturedAt: now.toISOString(),
    allowlist: ALLOWLIST.map((e) => ({ id: e.id, method: e.method, path: e.path, optional: !!e.optional })),
    oidc: {
      issuer: OIDC.issuer,
      clientId: OIDC.clientId,
      realm: OIDC.realm,
      evidence: OIDC_EVIDENCE,
    },
    calls,
    notes,
    errors,
    idsPresent: {
      creatorId: Boolean(creatorId),
      postId: Boolean(postId),
      videoId: Boolean(videoId),
    },
    endpointIds: Object.keys(trees).sort(),
    promoteBaselines: Boolean(opts.promoteBaselines),
  };

  if (opts.dryRun) {
    return {
      exitCode: errors.length ? EXIT.FAILURE : EXIT.SUCCESS,
      captureId,
      trees,
      calls,
      notes,
      errors,
      diff,
      reportMd,
      dir: null,
      meta,
    };
  }

  if (Object.keys(trees).length === 0) {
    return {
      exitCode: errors.length ? EXIT.FAILURE : EXIT.NEEDS_AUTH,
      captureId,
      trees,
      calls,
      notes,
      errors,
      diff: null,
      reportMd: null,
      dir: null,
      meta,
    };
  }

  const promote =
    opts.promoteBaselines ||
    (!hasAnyBaseline && Object.keys(trees).includes('content-post'));

  const { dir } = await writeCapture({
    artifactsRoot: opts.artifactsRoot,
    captureId,
    meta,
    trees,
    diff,
    reportMd,
    promoteBaselines: promote,
  });

  if (promote) notes.push(`Baselines promoted under baselines/ from ${captureId}`);

  let exitCode = EXIT.SUCCESS;
  if (errors.length) exitCode = EXIT.FAILURE;
  else if (diff && diff.hasDrift && !diff.firstCapture) exitCode = EXIT.DRIFT;

  return {
    exitCode,
    captureId,
    trees,
    calls,
    notes,
    errors,
    diff,
    reportMd,
    dir,
    meta,
  };
}
