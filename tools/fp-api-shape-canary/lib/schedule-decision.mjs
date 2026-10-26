/**
 * Pure decision helpers for Phase 3.1 scheduled shape canary.
 * Offline-testable; no network.
 */

import {
  EXIT,
  SHAPE_MONITOR_BRANCH,
  SHAPE_PR_TITLE_PREFIX,
} from './constants.mjs';

/**
 * @param {{
 *   auth: { ok?: boolean, exitCode?: number, refreshed?: boolean, error?: string|null, notes?: string[], lifetime?: object|null },
 *   capture: null | {
 *     exitCode: number,
 *     captureId?: string,
 *     dir?: string|null,
 *     hasDrift?: boolean,
 *     firstCapture?: boolean,
 *     endpointIds?: string[],
 *     notes?: string[],
 *     errors?: string[],
 *     byEndpoint?: object,
 *     calls?: object[],
 *   },
 *   openShapePrs?: { number?: number, url?: string, headRefName?: string, title?: string }[],
 *   nowIso?: string,
 * }} input
 */
export function decideShapeMonitorAction(input) {
  const notes = [...(input.auth?.notes || [])];
  const open = normalizeOpenShapePrs(input.openShapePrs || []);
  const existing = selectShapePr(open);

  if (!input.auth?.ok) {
    const needsAuth = input.auth?.exitCode === EXIT.NEEDS_AUTH;
    return {
      action: needsAuth ? 'needs_auth' : 'report_failure',
      reason: needsAuth ? 'auth_required' : 'auth_failed',
      mutateRepo: false,
      openOrUpdatePr: false,
      capture: null,
      captureId: null,
      error: input.auth?.error || 'auth failed',
      notes: [
        ...notes,
        needsAuth
          ? 'Device re-login required: make api-shape-device-login (prefer SCOPE="openid offline_access").'
          : 'Auth ensure failed operationally.',
      ],
      existingPr: existing,
      authLifetime: input.auth?.lifetime || null,
      decidedAt: input.nowIso || null,
    };
  }

  if (!input.capture) {
    return {
      action: 'report_failure',
      reason: 'missing_capture',
      mutateRepo: false,
      openOrUpdatePr: false,
      capture: null,
      captureId: null,
      error: 'capture result missing',
      notes,
      existingPr: existing,
      authLifetime: input.auth?.lifetime || null,
      decidedAt: input.nowIso || null,
    };
  }

  notes.push(...(input.capture.notes || []));

  if (input.capture.exitCode === EXIT.NEEDS_AUTH) {
    return {
      action: 'needs_auth',
      reason: 'capture_needs_auth',
      mutateRepo: false,
      openOrUpdatePr: false,
      capture: input.capture,
      captureId: input.capture.captureId || null,
      error: 'capture reported missing auth',
      notes,
      existingPr: existing,
      authLifetime: input.auth?.lifetime || null,
      decidedAt: input.nowIso || null,
    };
  }

  if (input.capture.exitCode === EXIT.FAILURE || (input.capture.errors || []).length) {
    return {
      action: 'report_failure',
      reason: 'capture_failed',
      mutateRepo: false,
      openOrUpdatePr: false,
      capture: input.capture,
      captureId: input.capture.captureId || null,
      error: (input.capture.errors || []).join('; ') || 'capture failed',
      notes,
      existingPr: existing,
      authLifetime: input.auth?.lifetime || null,
      decidedAt: input.nowIso || null,
    };
  }

  if (!input.capture.hasDrift) {
    return {
      action: 'noop',
      reason: input.capture.firstCapture ? 'first_capture_without_promote' : 'no_structural_drift',
      mutateRepo: false,
      openOrUpdatePr: false,
      capture: input.capture,
      captureId: input.capture.captureId || null,
      error: null,
      notes: [
        ...notes,
        'No structural drift vs committed baselines — no PR mutation.',
        input.auth?.refreshed ? 'Access token was refreshed this run.' : 'Used existing access token.',
      ],
      existingPr: existing,
      authLifetime: input.auth?.lifetime || null,
      decidedAt: input.nowIso || null,
    };
  }

  const action = existing ? 'update_shape_pr' : 'open_shape_pr';
  return {
    action,
    reason: 'structural_drift',
    mutateRepo: true,
    openOrUpdatePr: true,
    capture: input.capture,
    captureId: input.capture.captureId || null,
    commitMessage: `API shape canary: structural drift ${input.capture.captureId || ''}`.trim(),
    prTitle: `${SHAPE_PR_TITLE_PREFIX} structural drift`,
    error: null,
    notes: [
      ...notes,
      'Structural drift vs baselines — open/update reviewable PR (no OpenAPI auto-edit).',
      `Branch: ${SHAPE_MONITOR_BRANCH}`,
    ],
    existingPr: existing,
    authLifetime: input.auth?.lifetime || null,
    decidedAt: input.nowIso || null,
  };
}

/** @param {object[]} prs */
export function normalizeOpenShapePrs(prs) {
  return (prs || [])
    .filter((p) => p && (p.headRefName === SHAPE_MONITOR_BRANCH || /api shape canary/i.test(p.title || '')))
    .map((p) => ({
      number: p.number ?? null,
      url: p.url || null,
      headRefName: p.headRefName || null,
      title: p.title || null,
    }));
}

/** @param {ReturnType<typeof normalizeOpenShapePrs>} prs */
export function selectShapePr(prs) {
  return prs.find((p) => p.headRefName === SHAPE_MONITOR_BRANCH) || prs[0] || null;
}

/**
 * @param {{ decision: object, captureSummary: object }} input
 */
export function formatShapePrBody({ decision, captureSummary }) {
  const lines = [];
  lines.push('## Authenticated API response-shape canary (Phase 3.1)');
  lines.push('');
  lines.push('Structural field-tree drift vs committed `artifacts/api-shape/baselines/`.');
  lines.push('**No OpenAPI/AsyncAPI auto-edits. No Hydravion changes. Read-only allowlist only.**');
  lines.push('');
  lines.push(`- Capture: \`${captureSummary.captureId || decision.captureId || 'n/a'}\``);
  lines.push(`- Action: \`${decision.action}\``);
  lines.push(`- Reason: \`${decision.reason}\``);
  if (captureSummary.dir) lines.push(`- Artifacts: \`${captureSummary.dir}\``);
  lines.push('');
  lines.push('### Endpoints');
  const by = captureSummary.byEndpoint || {};
  for (const id of Object.keys(by).sort()) {
    const d = by[id];
    const added = countOrLen(d.addedCount, d.added);
    const removed = countOrLen(d.removedCount, d.removed);
    const typeChanged = countOrLen(d.typeChangedCount, d.typeChanged);
    lines.push(
      `- \`${id}\`: drift=${d.hasDrift} added=${added} removed=${removed} typeChanged=${typeChanged}`,
    );
    const samples = sampleLines(d);
    for (const s of samples) lines.push(`  - ${s}`);
  }
  if (!Object.keys(by).length) {
    lines.push(`- ids: ${(captureSummary.endpointIds || []).join(', ') || '(none)'}`);
  }
  lines.push('');
  lines.push('### Auth (redacted)');
  const life = decision.authLifetime;
  if (life) {
    lines.push(`- refresh_expires_in: ${life.refreshExpiresIn}`);
    lines.push(`- refreshExpiresAt: ${life.refreshExpiresAt}`);
    lines.push(`- refreshTokenRotated: ${life.refreshTokenRotated}`);
    lines.push(`- scope: ${life.scope}`);
  } else {
    lines.push('- (no lifetime snapshot)');
  }
  lines.push('');
  lines.push('### Operator');
  lines.push('- Review field trees / report under the capture dir before merging.');
  lines.push('- Promote baseline updates only after human review.');
  lines.push('- If auth dies: `make api-shape-device-login` with `SCOPE="openid offline_access"`.');
  lines.push('');
  lines.push('_Separate from Phase 1/2 frontend watch schedule._');
  return `${lines.join('\n')}\n`;
}

function countOrLen(count, arrOrNum) {
  if (typeof count === 'number') return count;
  if (Array.isArray(arrOrNum)) return arrOrNum.length;
  if (typeof arrOrNum === 'number') return arrOrNum;
  return 0;
}

/** Compact path samples for PR body (capped). */
function sampleLines(d, cap = 6) {
  const out = [];
  const removed = Array.isArray(d.removed) ? d.removed : [];
  const added = Array.isArray(d.added) ? d.added : [];
  const typed = Array.isArray(d.typeChanged) ? d.typeChanged : [];
  for (const p of removed.slice(0, cap)) out.push(`removed \`${p}\``);
  for (const p of added.slice(0, Math.max(0, cap - out.length))) out.push(`added \`${p}\``);
  for (const t of typed.slice(0, Math.max(0, cap - out.length))) {
    if (typeof t === 'string') out.push(`type \`${t}\``);
    else out.push(`type \`${t.path}\`: ${fmtType(t.from)} → ${fmtType(t.to)}`);
  }
  return out;
}

function fmtType(t) {
  return Array.isArray(t) ? t.join('|') : String(t);
}
