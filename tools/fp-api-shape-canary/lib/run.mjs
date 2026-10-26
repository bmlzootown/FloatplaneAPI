/**
 * Orchestrate allowlisted capture → field trees → baseline diff.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import {
  ALLOWLIST,
  DEFAULT_AUTH_FILE,
  EXIT,
  OIDC,
  OIDC_EVIDENCE,
  SCHEMA_VERSION,
  TOOL_ID,
  TOOL_VERSION,
  UNAUTH_LIST,
} from './constants.mjs';
import {
  accessNeedsRefresh,
  redactAuthLifetime,
  refreshAccessToken,
  refreshIsExpired,
} from './auth-refresh.mjs';
import { persistAuthToStore, restoreAuthFromStore } from './auth-store.mjs';
import { buildFieldTree } from './field-tree.mjs';
import { diffBaselineMaps, formatDiffReportMarkdown } from './diff.mjs';
import { importDpopKeyPair } from './dpop.mjs';
import {
  apiGetJson,
  listCreatorIdsFromSubscriptions,
  pickCreatorIdFromSubscriptions,
  pickPostIdFromCreatorList,
  pickVideoAttachmentId,
  redactToken,
} from './probe.mjs';
import { loadBaselines, makeCaptureId, writeCapture } from './store.mjs';

/**
 * @typedef {{
 *   accessToken: string,
 *   refreshToken?: string|null,
 *   dpopKeyPair: Awaited<ReturnType<typeof importDpopKeyPair>> | null,
 *   authFile?: string | null,
 *   expiresIn?: number|null,
 *   refreshExpiresIn?: number|null,
 *   accessExpiresAtMs?: number|null,
 *   refreshExpiresAtMs?: number|null,
 *   scope?: string|null,
 *   sessionState?: string|null,
 *   obtainedAtMs?: number|null,
 *   responseKeys?: string[]|null,
 * }} AuthSession
 */

/**
 * Resolve access token + optional DPoP keys. Never invent tokens.
 * Prefers FP_ACCESS_TOKEN / --token, then auth JSON file, then bare token file.
 * @param {{
 *   token?: string|null,
 *   tokenFile?: string|null,
 *   authFile?: string|null,
 *   dpopKeyPair?: AuthSession['dpopKeyPair'],
 *   env?: NodeJS.ProcessEnv,
 * }} opts
 * @returns {Promise<AuthSession|null>}
 */
export async function resolveAuthSession(opts = {}) {
  const env = opts.env || process.env;
  if (opts.dpopKeyPair && (opts.token || env.FP_ACCESS_TOKEN)) {
    return {
      accessToken: opts.token || env.FP_ACCESS_TOKEN,
      dpopKeyPair: opts.dpopKeyPair,
      refreshToken: null,
    };
  }

  const authFile = opts.authFile || env.FP_AUTH_FILE || null;
  if (authFile) {
    try {
      const raw = await readFile(authFile, 'utf8');
      const doc = JSON.parse(raw);
      if (doc.accessToken && doc.dpop?.publicJwk && doc.dpop?.privateJwk) {
        const dpopKeyPair = await importDpopKeyPair({
          publicJwk: doc.dpop.publicJwk,
          privateJwk: doc.dpop.privateJwk,
        });
        return {
          accessToken: doc.accessToken,
          refreshToken: doc.refreshToken || null,
          dpopKeyPair,
          authFile,
          expiresIn: doc.expiresIn ?? null,
          refreshExpiresIn: doc.refreshExpiresIn ?? null,
          accessExpiresAtMs: doc.accessExpiresAtMs ?? null,
          refreshExpiresAtMs: doc.refreshExpiresAtMs ?? null,
          scope: doc.scope || null,
          sessionState: doc.sessionState || null,
          obtainedAtMs: doc.obtainedAtMs || (doc.writtenAt ? Date.parse(doc.writtenAt) : null),
          responseKeys: doc.responseKeys || null,
        };
      }
      if (doc.accessToken) {
        return {
          accessToken: doc.accessToken,
          refreshToken: doc.refreshToken || null,
          dpopKeyPair: null,
          authFile,
          expiresIn: doc.expiresIn ?? null,
          refreshExpiresIn: doc.refreshExpiresIn ?? null,
          accessExpiresAtMs: doc.accessExpiresAtMs ?? null,
          refreshExpiresAtMs: doc.refreshExpiresAtMs ?? null,
          scope: doc.scope || null,
        };
      }
    } catch (err) {
      if (!err || err.code !== 'ENOENT') throw err;
    }
  }

  if (opts.token) {
    return {
      accessToken: opts.token,
      dpopKeyPair: opts.dpopKeyPair || null,
      refreshToken: null,
    };
  }
  if (env.FP_ACCESS_TOKEN) {
    return {
      accessToken: env.FP_ACCESS_TOKEN,
      dpopKeyPair: opts.dpopKeyPair || null,
      refreshToken: null,
    };
  }

  const file = opts.tokenFile || env.FP_TOKEN_FILE;
  if (!file) return null;
  try {
    const raw = await readFile(file, 'utf8');
    const token = raw.trim();
    if (!token) return null;
    return { accessToken: token, dpopKeyPair: opts.dpopKeyPair || null, refreshToken: null };
  } catch (err) {
    if (err && err.code === 'ENOENT') return null;
    throw err;
  }
}

/**
 * Ensure a usable access token: refresh with DPoP when near expiry.
 * Persists rotated tokens back to the auth file when provided.
 * @param {{
 *   token?: string|null,
 *   tokenFile?: string|null,
 *   authFile?: string|null,
 *   env?: NodeJS.ProcessEnv,
 *   forceRefresh?: boolean,
 *   fetchImpl?: typeof fetch,
 *   skewMs?: number,
 *   now?: () => number,
 * }} opts
 */
export async function ensureAuthSession(opts = {}) {
  const env = opts.env || process.env;
  const authFile =
    opts.authFile || env.FP_AUTH_FILE || path.resolve(DEFAULT_AUTH_FILE);
  const restore = await restoreAuthFromStore({
    authFile,
    storePath: opts.authStore || env.FP_API_SHAPE_AUTH_STORE || null,
    env,
  });

  const session = await resolveAuthSession({ ...opts, authFile, env });
  if (!session?.accessToken) {
    return {
      ok: false,
      exitCode: EXIT.NEEDS_AUTH,
      session: null,
      refreshed: false,
      lifetime: null,
      error: 'missing auth session — run make api-shape-device-login',
      notes: [
        'No access token / auth file. Human device login required.',
        `Preferred schedule scope: ${OIDC.scheduleScope}`,
        restore.restored
          ? `Restored auth from store but session still unreadable (${restore.store}).`
          : restore.reason === 'store-missing'
            ? `FP_API_SHAPE_AUTH_STORE set but missing (${restore.store}).`
            : restore.reason === 'no-store'
              ? 'Set FP_API_SHAPE_AUTH_STORE to Project secrets/api-shape-auth.local.json for weekly VMs.'
              : `Auth store restore: ${restore.reason}`,
      ],
    };
  }

  const now = opts.now || (() => Date.now());
  const notes = [];
  if (restore.restored) {
    notes.push(`Restored auth session from FP_API_SHAPE_AUTH_STORE (${restore.store}).`);
  }
  if (!session.dpopKeyPair) {
    notes.push(
      'No DPoP key pair — live fp-tv-app refresh/API usually require DPoP. Prefer state/api-shape-auth.local.json.',
    );
  }

  const needRefresh =
    Boolean(opts.forceRefresh) ||
    accessNeedsRefresh(session, { skewMs: opts.skewMs, nowMs: now() });

  if (!needRefresh) {
    return {
      ok: true,
      exitCode: EXIT.SUCCESS,
      session,
      refreshed: false,
      lifetime: redactAuthLifetime(session, { label: 'cached' }),
      error: null,
      notes,
    };
  }

  if (!session.refreshToken) {
    return {
      ok: false,
      exitCode: EXIT.NEEDS_AUTH,
      session,
      refreshed: false,
      lifetime: redactAuthLifetime(session, { label: 'no-refresh-token' }),
      error: 'access token expired/unknown and no refresh_token — device re-login required',
      notes: [
        ...notes,
        'Seed with: make api-shape-device-login SCOPE="openid offline_access"',
      ],
    };
  }

  if (refreshIsExpired(session, { nowMs: now() })) {
    return {
      ok: false,
      exitCode: EXIT.NEEDS_AUTH,
      session,
      refreshed: false,
      lifetime: redactAuthLifetime(session, { label: 'refresh-expired' }),
      error: 'refresh_expires_in wall clock passed — device re-login required',
      notes: [
        ...notes,
        'Rolling refresh cannot continue past Keycloak refresh_expires_in / session max once the refresh token is dead.',
      ],
    };
  }

  if (!session.dpopKeyPair) {
    return {
      ok: false,
      exitCode: EXIT.NEEDS_AUTH,
      session,
      refreshed: false,
      lifetime: redactAuthLifetime(session, { label: 'missing-dpop' }),
      error: 'refresh requires DPoP key pair (fp-tv-app usesExtendedSecurity)',
      notes,
    };
  }

  try {
    const previousRefresh = session.refreshToken;
    const next = await refreshAccessToken({
      refreshToken: session.refreshToken,
      dpopKeyPair: session.dpopKeyPair,
      fetchImpl: opts.fetchImpl,
      now,
    });
    const rotated =
      Boolean(next.refreshToken) && Boolean(previousRefresh) && next.refreshToken !== previousRefresh;
    const merged = {
      ...session,
      accessToken: next.accessToken,
      refreshToken: next.refreshToken || session.refreshToken,
      expiresIn: next.expiresIn,
      refreshExpiresIn: next.refreshExpiresIn,
      accessExpiresAtMs: next.accessExpiresAtMs,
      refreshExpiresAtMs: next.refreshExpiresAtMs ?? session.refreshExpiresAtMs,
      scope: next.scope || session.scope,
      sessionState: next.sessionState || session.sessionState,
      obtainedAtMs: next.obtainedAtMs,
      responseKeys: next.responseKeys,
      dpopKeyPair: session.dpopKeyPair,
    };

    if (session.authFile) {
      await writeAuthFile(session.authFile, merged);
      const persisted = await persistAuthToStore({
        authFile: session.authFile,
        storePath: opts.authStore || env.FP_API_SHAPE_AUTH_STORE || null,
        env,
      });
      if (persisted.persisted) {
        notes.push(`Persisted rotated auth to FP_API_SHAPE_AUTH_STORE (${persisted.store}).`);
      }
    }
    const tokenFile = opts.tokenFile || env.FP_TOKEN_FILE;
    if (tokenFile) {
      await writeTokenFile(tokenFile, merged.accessToken);
    }

    notes.push(rotated ? 'refresh_token rotated' : 'refresh_token reused (no rotation observed)');
    return {
      ok: true,
      exitCode: EXIT.SUCCESS,
      session: merged,
      refreshed: true,
      lifetime: redactAuthLifetime(merged, {
        label: 'refreshed',
        refreshTokenRotated: rotated,
      }),
      error: null,
      notes,
    };
  } catch (err) {
    const code = err?.code || '';
    const needsAuth = [
      'invalid_grant',
      'invalid_token',
      'expired_token',
      'unauthorized_client',
    ].includes(code);
    return {
      ok: false,
      exitCode: needsAuth ? EXIT.NEEDS_AUTH : EXIT.FAILURE,
      session,
      refreshed: false,
      lifetime: redactAuthLifetime(session, { label: 'refresh-failed' }),
      error: err?.message || String(err),
      notes: [
        ...notes,
        needsAuth
          ? 'Refresh failed permanently — run make api-shape-device-login again.'
          : 'Refresh failed operationally — retry later.',
      ],
    };
  }
}

/**
 * Resolve access token from env / file. Never invent tokens.
 * @param {{ token?: string|null, tokenFile?: string|null, authFile?: string|null, env?: NodeJS.ProcessEnv }} opts
 */
export async function resolveAccessToken(opts = {}) {
  const session = await resolveAuthSession(opts);
  return session?.accessToken || null;
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
 * Persist access token + DPoP JWKs (required for fp-tv-app resource calls).
 * @param {string} filePath
 * @param {{
 *   accessToken: string,
 *   refreshToken?: string|null,
 *   expiresIn?: number|null,
 *   refreshExpiresIn?: number|null,
 *   accessExpiresAtMs?: number|null,
 *   refreshExpiresAtMs?: number|null,
 *   scope?: string|null,
 *   sessionState?: string|null,
 *   obtainedAtMs?: number|null,
 *   responseKeys?: string[]|null,
 *   dpopKeyPair: { publicJwk: object, privateJwk: object },
 * }} session
 */
export async function writeAuthFile(filePath, session) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const doc = {
    schemaVersion: 1,
    writtenAt: new Date().toISOString(),
    accessToken: session.accessToken,
    refreshToken: session.refreshToken || null,
    expiresIn: session.expiresIn ?? null,
    refreshExpiresIn: session.refreshExpiresIn ?? null,
    accessExpiresAtMs: session.accessExpiresAtMs ?? null,
    refreshExpiresAtMs: session.refreshExpiresAtMs ?? null,
    obtainedAtMs: session.obtainedAtMs ?? Date.now(),
    scope: session.scope || null,
    sessionState: session.sessionState || null,
    responseKeys: session.responseKeys || null,
    tokenType: 'DPoP',
    dpop: {
      publicJwk: session.dpopKeyPair.publicJwk,
      privateJwk: session.dpopKeyPair.privateJwk,
    },
    warning: 'SECRET — do not commit. Gitignored as *.local / api-shape-auth.local.json',
  };
  await writeFile(filePath, `${JSON.stringify(doc, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
}

/**
 * @param {{
 *   artifactsRoot: string,
 *   accessToken?: string|null,
 *   dpopKeyPair?: AuthSession['dpopKeyPair'],
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
  const dpopKeyPair = opts.dpopKeyPair || null;

  let creatorId = opts.creatorId || null;
  let postId = opts.postId || null;
  let videoId = null;

  /** @param {Parameters<typeof apiGetJson>[0]} partial */
  async function getJson(partial) {
    return apiGetJson({
      ...partial,
      accessToken: opts.accessToken,
      dpopKeyPair,
      fetchImpl: opts.fetchImpl,
    });
  }

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
        'No access token. Run: make api-shape-device-login (human approves device code), then set FP_ACCESS_TOKEN or state/api-shape-auth.local.json',
      ],
      errors: ['missing access token'],
      diff: null,
      reportMd: null,
      dir: null,
    };
  }

  if (opts.accessToken) {
    notes.push(
      `Token present (${redactToken(opts.accessToken)}); auth=${dpopKeyPair ? 'DPoP' : 'Bearer-fallback'}`,
    );
    if (!dpopKeyPair) {
      notes.push(
        'No DPoP key pair loaded — live fp-tv-app tokens usually require DPoP. Prefer state/api-shape-auth.local.json from device-login.',
      );
    }

    // 1) user/self
    {
      const ep = ALLOWLIST.find((e) => e.id === 'user-self');
      const result = await getJson({ path: ep.path });
      calls.push({
        id: ep.id,
        method: 'GET',
        path: ep.path,
        status: result.status,
        ok: result.ok,
        auth: result.authScheme,
      });
      if (result.ok && result.json != null) trees[ep.id] = buildFieldTree(result.json);
      else errors.push(`user-self HTTP ${result.status}`);
    }

    // 2) subscriptions → creator id(s)
    /** @type {string[]} */
    let creatorIds = [];
    {
      const ep = ALLOWLIST.find((e) => e.id === 'user-subscriptions');
      const result = await getJson({ path: ep.path });
      calls.push({
        id: ep.id,
        method: 'GET',
        path: ep.path,
        status: result.status,
        ok: result.ok,
        auth: result.authScheme,
      });
      if (result.ok && result.json != null) {
        trees[ep.id] = buildFieldTree(result.json);
        creatorIds = listCreatorIdsFromSubscriptions(result.json);
        if (creatorId && !creatorIds.includes(creatorId)) creatorIds.unshift(creatorId);
        if (!creatorId) creatorId = creatorIds[0] || null;
      } else {
        errors.push(`user-subscriptions HTTP ${result.status}`);
      }
    }

    if (creatorId && creatorIds.length === 0) creatorIds = [creatorId];

    if (creatorIds.length === 0) {
      notes.push('No creatorId from subscriptions; pass --creator-id to continue list/post probe');
    } else {
      // 3) content/creator?limit=1 — try subscribed creators until a post id appears
      const ep = ALLOWLIST.find((e) => e.id === 'content-creator');
      for (const candidate of creatorIds) {
        const result = await getJson({
          path: ep.path,
          query: { id: candidate, limit: 1 },
        });
        calls.push({
          id: ep.id,
          method: 'GET',
          path: ep.path,
          status: result.status,
          ok: result.ok,
          auth: result.authScheme,
          query: { id: '(redacted)', limit: 1 },
          creatorAttempt: candidate === creatorIds[0] ? 'first' : 'fallback',
        });
        if (result.ok && result.json != null) {
          trees[ep.id] = buildFieldTree(result.json);
          const found = pickPostIdFromCreatorList(result.json);
          if (found) {
            creatorId = candidate;
            if (!postId) postId = found;
            break;
          }
          notes.push(`content-creator for a subscribed creator returned no posts; trying next`);
        } else {
          errors.push(`content-creator HTTP ${result.status}`);
        }
      }
    }

    if (!postId) {
      notes.push('No postId available; pass --post-id for primary canary GET /api/v3/content/post');
    } else {
      const ep = ALLOWLIST.find((e) => e.id === 'content-post');
      const result = await getJson({
        path: ep.path,
        query: { id: postId },
      });
      calls.push({
        id: ep.id,
        method: 'GET',
        path: ep.path,
        status: result.status,
        ok: result.ok,
        auth: result.authScheme,
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
      const result = await getJson({
        path: ep.path,
        query: { id: videoId },
      });
      calls.push({
        id: ep.id,
        method: 'GET',
        path: ep.path,
        status: result.status,
        ok: result.ok,
        auth: result.authScheme,
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
  } else if (diff) {
    // Endpoints without a prior baseline are first observations, not regressions.
    let realDrift = false;
    for (const [id, d] of Object.entries(diff.byEndpoint)) {
      if (!baselines[id] && trees[id]) {
        d.hasDrift = false;
        d.note = d.note || 'first observation for endpoint (seeding baseline)';
        continue;
      }
      if (d.hasDrift) realDrift = true;
    }
    diff.hasDrift = realDrift;
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
    allowlist: ALLOWLIST.map((e) => ({
      id: e.id,
      method: e.method,
      path: e.path,
      optional: !!e.optional,
    })),
    oidc: {
      issuer: OIDC.issuer,
      clientId: OIDC.clientId,
      realm: OIDC.realm,
      evidence: OIDC_EVIDENCE,
      dpop: Boolean(dpopKeyPair),
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
    (!hasAnyBaseline && Object.keys(trees).includes('content-post')) ||
    (Object.keys(trees).includes('content-post') && !baselines['content-post']);

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

export { DEFAULT_AUTH_FILE };
