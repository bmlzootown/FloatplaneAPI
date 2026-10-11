import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  accessNeedsRefresh,
  normalizeTokenResponse,
  redactAuthLifetime,
  refreshIsExpired,
} from '../../tools/fp-api-shape-canary/lib/auth-refresh.mjs';
import {
  decideShapeMonitorAction,
  formatShapePrBody,
} from '../../tools/fp-api-shape-canary/lib/schedule-decision.mjs';
import { refreshAccessToken } from '../../tools/fp-api-shape-canary/lib/auth-refresh.mjs';
import { EXIT, OIDC, SHAPE_MONITOR_BRANCH } from '../../tools/fp-api-shape-canary/lib/constants.mjs';
import { generateDpopKeyPair } from '../../tools/fp-api-shape-canary/lib/dpop.mjs';

describe('auth-refresh lifetimes', () => {
  it('normalizes refresh_expires_in into absolute wall clock', () => {
    const obtainedAtMs = 1_700_000_000_000;
    const session = normalizeTokenResponse(
      {
        access_token: 'a',
        refresh_token: 'r',
        expires_in: 300,
        refresh_expires_in: 1800,
        session_state: 'sess',
        scope: 'openid offline_access',
        token_type: 'DPoP',
      },
      { dpopKeyPair: {}, obtainedAtMs },
    );
    assert.equal(session.expiresIn, 300);
    assert.equal(session.refreshExpiresIn, 1800);
    assert.equal(session.accessExpiresAtMs, obtainedAtMs + 300_000);
    assert.equal(session.refreshExpiresAtMs, obtainedAtMs + 1_800_000);
    assert.ok(session.responseKeys.includes('refresh_expires_in'));
    const redacted = redactAuthLifetime(session, { label: 't', refreshTokenRotated: true });
    assert.equal(redacted.hasRefreshToken, true);
    // responseKeys may list the name "access_token"; secret values must not appear.
    assert.ok(!JSON.stringify(redacted).includes('"a"'));
    assert.ok(!JSON.stringify(redacted).includes('new-access'));
    assert.equal(redacted.refreshToken, undefined);
  });

  it('accessNeedsRefresh / refreshIsExpired respect wall clocks', () => {
    const now = 1_000_000;
    assert.equal(
      accessNeedsRefresh(
        { refreshToken: 'r', accessExpiresAtMs: now + 30_000 },
        { nowMs: now, skewMs: 60_000 },
      ),
      true,
    );
    assert.equal(
      accessNeedsRefresh(
        { refreshToken: 'r', accessExpiresAtMs: now + 120_000 },
        { nowMs: now, skewMs: 60_000 },
      ),
      false,
    );
    assert.equal(
      refreshIsExpired({ refreshToken: 'r', refreshExpiresAtMs: now - 1 }, { nowMs: now }),
      true,
    );
    assert.equal(
      refreshIsExpired({ refreshToken: 'r', refreshExpiresAtMs: now + 10 }, { nowMs: now }),
      false,
    );
  });

  it('refreshAccessToken sends DPoP + refresh_token grant (mocked)', async () => {
    const keyPair = await generateDpopKeyPair();
    let seenBody = '';
    let seenHeaders = null;
    const fetchImpl = async (url, init) => {
      if (String(url).includes('well-known')) {
        return jsonResponse({
          issuer: OIDC.issuer,
          device_authorization_endpoint: 'https://auth.example/device',
          token_endpoint: 'https://auth.example/token',
          grant_types_supported: [OIDC.grantTypeDeviceCode, OIDC.grantTypeRefreshToken],
        });
      }
      seenBody = String(init.body);
      seenHeaders = init.headers;
      return jsonResponse({
        access_token: 'new-access',
        refresh_token: 'new-refresh',
        expires_in: 300,
        refresh_expires_in: 1700,
        token_type: 'DPoP',
        scope: 'openid offline_access',
      });
    };
    const next = await refreshAccessToken({
      refreshToken: 'old-refresh',
      dpopKeyPair: keyPair,
      fetchImpl,
      discovery: {
        tokenEndpoint: 'https://auth.example/token',
      },
      now: () => 5_000,
    });
    assert.ok(seenBody.includes('grant_type=refresh_token'));
    assert.ok(seenBody.includes('refresh_token=old-refresh'));
    assert.ok(seenHeaders.dpop || seenHeaders.DPoP);
    assert.equal(next.accessToken, 'new-access');
    assert.equal(next.refreshToken, 'new-refresh');
    assert.equal(next.refreshExpiresIn, 1700);
    assert.equal(next.refreshExpiresAtMs, 5_000 + 1_700_000);
  });
});

describe('schedule decision', () => {
  it('returns needs_auth when ensureAuth fails', () => {
    const d = decideShapeMonitorAction({
      auth: { ok: false, exitCode: EXIT.NEEDS_AUTH, error: 'refresh dead', notes: [] },
      capture: null,
      openShapePrs: [],
    });
    assert.equal(d.action, 'needs_auth');
    assert.equal(d.mutateRepo, false);
  });

  it('returns noop when capture has no drift', () => {
    const d = decideShapeMonitorAction({
      auth: { ok: true, refreshed: true, lifetime: { refreshExpiresIn: 1800 } },
      capture: {
        exitCode: EXIT.SUCCESS,
        captureId: 'c1',
        hasDrift: false,
        endpointIds: ['content-post'],
        notes: [],
        errors: [],
      },
    });
    assert.equal(d.action, 'noop');
    assert.equal(d.mutateRepo, false);
  });

  it('opens or updates PR on structural drift', () => {
    const open = decideShapeMonitorAction({
      auth: { ok: true, refreshed: false },
      capture: {
        exitCode: EXIT.DRIFT,
        captureId: 'c2',
        hasDrift: true,
        dir: 'artifacts/api-shape/captures/c2',
        endpointIds: ['content-post'],
        byEndpoint: { 'content-post': { hasDrift: true, added: 1, removed: 0, typeChanged: 0 } },
        notes: [],
        errors: [],
      },
      openShapePrs: [],
    });
    assert.equal(open.action, 'open_shape_pr');
    assert.equal(open.mutateRepo, true);

    const update = decideShapeMonitorAction({
      auth: { ok: true },
      capture: {
        exitCode: EXIT.DRIFT,
        captureId: 'c3',
        hasDrift: true,
        endpointIds: ['content-post'],
        byEndpoint: {},
        notes: [],
        errors: [],
      },
      openShapePrs: [{ number: 99, url: 'https://example/pr/99', headRefName: SHAPE_MONITOR_BRANCH }],
    });
    assert.equal(update.action, 'update_shape_pr');
    assert.equal(update.existingPr.number, 99);

    const body = formatShapePrBody({
      decision: { ...open, authLifetime: { refreshExpiresIn: 1800, refreshExpiresAt: 'x', refreshTokenRotated: true, scope: 'openid offline_access' } },
      captureSummary: open.capture,
    });
    assert.match(body, /No OpenAPI/);
    assert.match(body, /content-post/);
  });
});

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (n) => (String(n).toLowerCase() === 'content-type' ? 'application/json' : null) },
    url: 'https://mock',
    text: async () => JSON.stringify(body),
    json: async () => body,
  };
}
