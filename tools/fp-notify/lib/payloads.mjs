/**
 * Build Discord/Fluxer-compatible webhook payloads from monitor decisions.
 *
 * Shape canary: summary + concrete field path examples (added/removed/typeChanged).
 * Frontend watch: build/evidence delta only — never invent server API claims.
 */

import {
  AUTH_NOTIFY_ACTIONS,
  CHANGE_NOTIFY_ACTIONS,
  COLOR_AUTH,
  COLOR_FRONTEND,
  COLOR_SHAPE_DRIFT,
  DEFAULT_USERNAME,
  MAX_ENDPOINTS_IN_EMBED,
  MAX_PATHS_PER_KIND,
} from './constants.mjs';
import { formatPathList, truncDescription, truncField, truncTitle } from './truncate.mjs';

/**
 * @param {object} decision
 * @param {{ notifyOnAuth?: boolean }} [opts]
 */
export function shouldNotify(decision, opts = {}) {
  const action = decision?.action;
  if (!action) return false;
  if (CHANGE_NOTIFY_ACTIONS.has(action)) return true;
  if (opts.notifyOnAuth && AUTH_NOTIFY_ACTIONS.has(action)) return true;
  return false;
}

/**
 * Detect monitor lane from decision shape.
 * @param {object} decision
 * @returns {'shape'|'frontend'|'auth'|'unknown'}
 */
export function detectLane(decision) {
  const a = decision?.action || '';
  if (a.includes('shape') || decision?.orchestratorId === 'fp-api-shape-schedule') {
    return 'shape';
  }
  if (a === 'needs_auth') return 'auth';
  if (
    a.includes('monitor') ||
    decision?.orchestratorId === 'phase2.3-frontend-evidence-orchestrate' ||
    decision?.phase1 ||
    decision?.phase2
  ) {
    return 'frontend';
  }
  return 'unknown';
}

/**
 * @param {object} decision
 * @param {{
 *   prUrl?: string|null,
 *   notifyOnAuth?: boolean,
 *   username?: string,
 * }} [opts]
 * @returns {{ skipped: true, reason: string } | { skipped: false, payload: object, lane: string }}
 */
export function buildNotifyPayload(decision, opts = {}) {
  if (!shouldNotify(decision, opts)) {
    return { skipped: true, reason: `action_${decision?.action || 'missing'}` };
  }

  const lane = detectLane(decision);
  if (lane === 'shape') {
    return {
      skipped: false,
      lane,
      payload: buildShapePayload(decision, opts),
    };
  }
  if (lane === 'frontend') {
    return {
      skipped: false,
      lane,
      payload: buildFrontendPayload(decision, opts),
    };
  }
  if (lane === 'auth' || decision.action === 'needs_auth') {
    return {
      skipped: false,
      lane: 'auth',
      payload: buildAuthPayload(decision, opts),
    };
  }

  return {
    skipped: false,
    lane: 'unknown',
    payload: {
      username: opts.username || DEFAULT_USERNAME,
      content: truncDescription(
        `FloatplaneAPI Watch: \`${decision.action}\` — ${decision.reason || ''}`.trim(),
      ),
    },
  };
}

/**
 * @param {object} decision
 * @param {{ prUrl?: string|null, username?: string }} opts
 */
export function buildShapePayload(decision, opts = {}) {
  const capture = decision.capture || {};
  const by = capture.byEndpoint || {};
  const captureId = decision.captureId || capture.captureId || 'n/a';
  const prUrl = opts.prUrl || decision.existingPr?.url || null;

  const fields = [
    {
      name: 'Action',
      value: truncField(`\`${decision.action}\``),
      inline: true,
    },
    {
      name: 'Capture',
      value: truncField(`\`${captureId}\``),
      inline: true,
    },
  ];

  const endpointIds = Object.keys(by).sort();
  const drifted = endpointIds.filter((id) => by[id]?.hasDrift);
  const show = (drifted.length ? drifted : endpointIds).slice(0, MAX_ENDPOINTS_IN_EMBED);

  for (const id of show) {
    fields.push({
      name: truncTitle(id),
      value: truncField(formatEndpointExample(by[id])),
      inline: false,
    });
  }
  const omitted = drifted.length - show.length;
  if (omitted > 0) {
    fields.push({
      name: 'More endpoints',
      value: truncField(`… +${omitted} drifted endpoint(s) not shown`),
      inline: false,
    });
  }

  if (prUrl) {
    fields.push({ name: 'PR', value: truncField(prUrl), inline: false });
  }

  /** @type {object} */
  const embed = {
    title: truncTitle('API response-shape drift'),
    description: truncDescription(
      [
        'Structural field-tree change vs committed baselines.',
        '**Read-only canary · no OpenAPI auto-edit · no Hydravion.**',
        decision.reason ? `Reason: \`${decision.reason}\`` : null,
      ]
        .filter(Boolean)
        .join('\n'),
    ),
    color: COLOR_SHAPE_DRIFT,
    fields,
    footer: { text: 'Phase 3.1 api-shape-canary' },
    timestamp: decision.decidedAt || new Date().toISOString(),
  };
  if (prUrl) embed.url = prUrl;

  return {
    username: opts.username || DEFAULT_USERNAME,
    embeds: [embed],
  };
}

/**
 * Visible example of API shape change for one endpoint.
 * Prefers concrete path lists from decision.capture.byEndpoint.*.{added,removed,typeChanged}.
 * @param {object|null|undefined} ep
 */
export function formatEndpointExample(ep) {
  if (!ep) return '(no detail)';
  const parts = [];
  const added = asPathArray(ep.added);
  const removed = asPathArray(ep.removed);
  const typeChanged = asTypeChangedArray(ep.typeChanged);

  if (removed.length) {
    parts.push('**removed**');
    parts.push(formatPathList(removed, MAX_PATHS_PER_KIND, '− '));
  }
  if (added.length) {
    parts.push('**added**');
    parts.push(formatPathList(added, MAX_PATHS_PER_KIND, '+ '));
  }
  if (typeChanged.length) {
    parts.push('**type changed**');
    const lines = typeChanged.slice(0, MAX_PATHS_PER_KIND).map((t) => {
      if (typeof t === 'string') return `~ \`${t}\``;
      const from = Array.isArray(t.from) ? t.from.join('|') : t.from;
      const to = Array.isArray(t.to) ? t.to.join('|') : t.to;
      return `~ \`${t.path}\`: ${from} → ${to}`;
    });
    if (typeChanged.length > MAX_PATHS_PER_KIND) {
      lines.push(`… +${typeChanged.length - MAX_PATHS_PER_KIND} more`);
    }
    parts.push(lines.join('\n'));
  }

  if (!parts.length) {
    // Counts-only fallback (older decision JSON)
    const a = ep.added?.length ?? ep.added ?? 0;
    const r = ep.removed?.length ?? ep.removed ?? 0;
    const t = ep.typeChanged?.length ?? ep.typeChanged ?? 0;
    if (typeof a === 'number' || typeof r === 'number') {
      return `added=${Number(a) || 0} removed=${Number(r) || 0} typeChanged=${Number(t) || 0}`;
    }
    return ep.note || '(drift flagged; no path samples)';
  }
  return parts.join('\n');
}

/**
 * @param {object} decision
 * @param {{ prUrl?: string|null, username?: string }} opts
 */
export function buildFrontendPayload(decision, opts = {}) {
  const phase1 = decision.phase1 || {};
  const phase2 = decision.phase2 || {};
  const buildId =
    phase1.buildId ||
    decision.buildId ||
    lastPendingBuild(decision) ||
    'n/a';
  const prUrl =
    opts.prUrl ||
    decision.openMonitorPr?.url ||
    phase1.openMonitorPr?.url ||
    null;

  const pending = decision.pendingObservations || phase1.pendingObservations || [];
  const analyses = decision.analyses || phase2.analyses || [];
  const commits = decision.commitSequence?.commits || [];

  const summaryLines = [
    'Frontend watch / evidence change (not a server API claim).',
    decision.reason ? `Reason: \`${decision.reason}\`` : null,
  ].filter(Boolean);

  const fields = [
    {
      name: 'Action',
      value: truncField(`\`${decision.action}\``),
      inline: true,
    },
    {
      name: 'Build',
      value: truncField(`\`${buildId}\``),
      inline: true,
    },
    {
      name: 'Phase 1',
      value: truncField(`\`${phase1.action || decision.action}\``),
      inline: true,
    },
  ];

  if (pending.length) {
    const ids = pending
      .slice(-3)
      .map((o) => o.buildId || o.observationId || '?')
      .join(', ');
    fields.push({
      name: 'Pending ledger',
      value: truncField(`${pending.length} observation(s): ${ids}`),
      inline: false,
    });
  }

  if (commits.length) {
    const lines = commits.slice(0, 6).map((c) => `• [${c.phase}/${c.step}] ${c.message || c.step}`);
    if (commits.length > 6) lines.push(`… +${commits.length - 6} more`);
    fields.push({
      name: 'Commits',
      value: truncField(lines.join('\n')),
      inline: false,
    });
  }

  if (analyses.length) {
    const lines = analyses.slice(0, 4).map((a) => {
      const id = a.observationId || a.buildId || '?';
      const st = a.comparisonStatus || a.extractStatus || a.status || 'analyzed';
      const counts = a.summary || a.counts;
      const extra = counts ? ` (${compactCounts(counts)})` : '';
      return `• \`${id}\`: ${st}${extra}`;
    });
    if (analyses.length > 4) lines.push(`… +${analyses.length - 4} more`);
    fields.push({
      name: 'Evidence / analysis',
      value: truncField(lines.join('\n')),
      inline: false,
    });
  }

  if (prUrl) {
    fields.push({ name: 'PR', value: truncField(prUrl), inline: false });
  }

  /** @type {object} */
  const embed = {
    title: truncTitle('Frontend observation update'),
    description: truncDescription(summaryLines.join('\n')),
    color: COLOR_FRONTEND,
    fields,
    footer: { text: 'Phase 1–2 frontend-watch · evidence only' },
    timestamp: new Date().toISOString(),
  };
  if (prUrl) embed.url = prUrl;

  return {
    username: opts.username || DEFAULT_USERNAME,
    embeds: [embed],
  };
}

/**
 * @param {object} decision
 * @param {{ username?: string }} opts
 */
export function buildAuthPayload(decision, opts = {}) {
  return {
    username: opts.username || DEFAULT_USERNAME,
    embeds: [
      {
        title: truncTitle('API shape canary needs auth'),
        description: truncDescription(
          [
            'Refresh token missing/expired/rejected. Human device re-login required.',
            '```',
            'make api-shape-device-login SCOPE="openid offline_access"',
            '```',
            'Mirror auth to Project `secrets/api-shape-auth.local.json` (never commit).',
            decision.error ? `Error: ${decision.error}` : null,
          ]
            .filter(Boolean)
            .join('\n'),
        ),
        color: COLOR_AUTH,
        footer: { text: 'Phase 3.1 · needs_auth' },
        timestamp: decision.decidedAt || new Date().toISOString(),
      },
    ],
  };
}

function lastPendingBuild(decision) {
  const pending = decision.pendingObservations || decision.phase1?.pendingObservations || [];
  if (!pending.length) return null;
  return pending[pending.length - 1]?.buildId || null;
}

function asPathArray(v) {
  if (!v) return [];
  if (Array.isArray(v)) {
    if (!v.length) return [];
    if (typeof v[0] === 'string') return v;
    // unexpected object array — stringify paths
    return v.map((x) => (typeof x === 'string' ? x : x?.path || JSON.stringify(x)));
  }
  if (typeof v === 'number') return []; // counts-only
  return [];
}

function asTypeChangedArray(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  return [];
}

function compactCounts(counts) {
  if (typeof counts === 'string') return counts;
  if (!counts || typeof counts !== 'object') return '';
  const bits = [];
  for (const k of ['added', 'removed', 'changed', 'endpoints', 'ops']) {
    if (counts[k] != null) bits.push(`${k}=${counts[k]}`);
  }
  return bits.join(' ') || JSON.stringify(counts).slice(0, 80);
}
