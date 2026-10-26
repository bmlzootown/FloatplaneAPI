/**
 * Build Discord/Fluxer-compatible webhook payloads from monitor decisions.
 *
 * Human-first copy: titles a person can skim; Action/PR secondary in footer.
 * Shape canary: before → after JSON fragment (capture sample or illustrative).
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
import { formatBeforeAfterFields } from './before-after.mjs';
import { packShapePayloads } from './pack-embeds.mjs';
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
 * @returns {{
 *   skipped: true,
 *   reason: string,
 * } | {
 *   skipped: false,
 *   payload: object,
 *   payloads?: object[],
 *   lane: string,
 * }}
 */
export function buildNotifyPayload(decision, opts = {}) {
  if (!shouldNotify(decision, opts)) {
    return { skipped: true, reason: `action_${decision?.action || 'missing'}` };
  }

  const lane = detectLane(decision);
  if (lane === 'shape') {
    const payloads = buildShapePayloads(decision, opts);
    return {
      skipped: false,
      lane,
      payload: payloads[0],
      payloads,
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
 * Build one or more webhook payloads for shape drift (full sanitized JSON;
 * split across fields/embeds/messages instead of silent truncation).
 * @param {object} decision
 * @param {{ prUrl?: string|null, username?: string }} opts
 * @returns {object[]}
 */
export function buildShapePayloads(decision, opts = {}) {
  const capture = decision.capture || {};
  const by = mergeEndpointViews(decision, capture);
  const captureId = decision.captureId || capture.captureId || null;
  const prUrl = opts.prUrl || decision.existingPr?.url || decision.prUrl || null;

  const endpointIds = Object.keys(by).sort();
  const drifted = endpointIds.filter((id) => by[id]?.hasDrift);
  const show = (drifted.length ? drifted : endpointIds).slice(0, MAX_ENDPOINTS_IN_EMBED);

  const headline = shapeHeadline(show, by);
  const summary = shapeSummarySentence(show, by);

  const fields = [];

  for (const id of show) {
    const ep = by[id];
    const changeSummary = formatEndpointExample(ep);
    fields.push({
      name: truncTitle(humanEndpointName(id)),
      value: truncField(changeSummary || '(drift flagged)'),
      inline: false,
    });

    for (const f of formatBeforeAfterFields(ep)) {
      // Values are already Discord-capped via explicit chunking — do not truncField
      // (that would silently ellipsize mid-JSON).
      fields.push({
        name: truncTitle(f.name),
        value: f.value,
        inline: Boolean(f.inline),
      });
    }
  }

  const omitted = drifted.length - show.length;
  if (omitted > 0) {
    fields.push({
      name: 'Also changed',
      value: truncField(`… +${omitted} more endpoint(s)`),
      inline: false,
    });
  }

  if (prUrl) {
    fields.push({
      name: 'Review',
      value: truncField(`[Open pull request](${prUrl})`),
      inline: false,
    });
  }

  const footerBits = ['API shape canary · read-only'];
  if (captureId) footerBits.push(`capture ${captureId}`);
  if (decision.action) footerBits.push(decision.action);

  const { payloads } = packShapePayloads({
    title: headline,
    description: [
      summary,
      'Compared against the last committed baseline. Read-only check — no OpenAPI edits.',
    ].join('\n'),
    color: COLOR_SHAPE_DRIFT,
    fields,
    footer: { text: truncField(footerBits.join(' · ')).slice(0, 2048) },
    timestamp: decision.decidedAt || decision.ranAt || new Date().toISOString(),
    url: prUrl,
    username: opts.username || DEFAULT_USERNAME,
  });

  return payloads;
}

/**
 * @param {object} decision
 * @param {{ prUrl?: string|null, username?: string }} opts
 */
export function buildShapePayload(decision, opts = {}) {
  return buildShapePayloads(decision, opts)[0];
}

/**
 * Merge capture.byEndpoint with optional top-level driftSummary (path arrays).
 * @param {object} decision
 * @param {object} capture
 */
function mergeEndpointViews(decision, capture) {
  const by = { ...(capture.byEndpoint || {}) };
  const summary = decision.driftSummary || {};
  for (const [id, s] of Object.entries(summary)) {
    const cur = by[id] || {};
    by[id] = {
      ...cur,
      hasDrift: cur.hasDrift ?? s.hasDrift ?? true,
      added: preferPaths(cur.added, s.added),
      removed: preferPaths(cur.removed, s.removed),
      typeChanged: preferTypeChanged(cur.typeChanged, s.typeChanged),
      typeHints: { ...(cur.typeHints || {}), ...(s.typeHints || {}) },
      sampleBefore: cur.sampleBefore ?? s.sampleBefore,
      sampleAfter: cur.sampleAfter ?? s.sampleAfter,
    };
  }
  return by;
}

function preferPaths(a, b) {
  const aa = asPathArray(a);
  if (aa.length) return aa;
  return asPathArray(b);
}

function preferTypeChanged(a, b) {
  const aa = asTypeChangedArray(a);
  if (aa.length) return aa;
  return asTypeChangedArray(b);
}

/**
 * @param {string[]} endpointIds
 * @param {Record<string, object>} by
 */
export function shapeHeadline(endpointIds, by) {
  if (!endpointIds.length) return 'Floatplane API response shape changed';
  if (endpointIds.length > 1) {
    return `Floatplane changed ${endpointIds.length} API response shapes`;
  }
  const id = endpointIds[0];
  const ep = by[id] || {};
  const added = asPathArray(ep.added);
  const removed = asPathArray(ep.removed);
  const typed = asTypeChangedArray(ep.typeChanged);
  const name = humanEndpointName(id);

  if (removed.length && !added.length && !typed.length) {
    return removed.length === 1
      ? `Floatplane removed a field from ${name}`
      : `Floatplane removed ${removed.length} fields from ${name}`;
  }
  if (added.length && !removed.length && !typed.length) {
    return added.length === 1
      ? `Floatplane added a field to ${name}`
      : `Floatplane added ${added.length} fields to ${name}`;
  }
  if (typed.length && !added.length && !removed.length) {
    return typed.length === 1
      ? `Floatplane changed a field type in ${name}`
      : `Floatplane changed field types in ${name}`;
  }
  return `Floatplane changed the shape of ${name}`;
}

/**
 * @param {string[]} endpointIds
 * @param {Record<string, object>} by
 */
function shapeSummarySentence(endpointIds, by) {
  if (!endpointIds.length) return 'Structural change vs the committed field-tree baseline.';
  if (endpointIds.length === 1) {
    const id = endpointIds[0];
    const ep = by[id] || {};
    const removed = asPathArray(ep.removed);
    const added = asPathArray(ep.added);
    const bits = [];
    if (removed.length) {
      bits.push(
        removed.length === 1
          ? `removed \`${removed[0]}\``
          : `removed ${removed.length} fields (e.g. \`${removed[0]}\`)`,
      );
    }
    if (added.length) {
      bits.push(
        added.length === 1
          ? `added \`${added[0]}\``
          : `added ${added.length} fields (e.g. \`${added[0]}\`)`,
      );
    }
    const typed = asTypeChangedArray(ep.typeChanged);
    if (typed.length) {
      const p = typeof typed[0] === 'string' ? typed[0] : typed[0]?.path;
      bits.push(p ? `type-changed \`${p}\`` : `type-changed ${typed.length} field(s)`);
    }
    if (bits.length) return `${humanEndpointName(id)}: ${bits.join('; ')}.`;
  }
  return `Observed on: ${endpointIds.map(humanEndpointName).join(', ')}.`;
}

/**
 * Friendly label for allowlisted endpoint ids.
 * @param {string} id
 */
export function humanEndpointName(id) {
  const map = {
    'content-post': 'content posts',
    'content-creator': 'creator listings',
    'content-creator-unauth': 'public creator listings',
    'content-video': 'video metadata',
    'user-self': 'the current-user profile',
    'user-subscriptions': 'user subscriptions',
  };
  return map[id] || id.replace(/-/g, ' ');
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
    parts.push('**Removed**');
    parts.push(formatPathList(removed, MAX_PATHS_PER_KIND, '− '));
  }
  if (added.length) {
    parts.push('**Added**');
    parts.push(formatPathList(added, MAX_PATHS_PER_KIND, '+ '));
  }
  if (typeChanged.length) {
    parts.push('**Type changed**');
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
  const previousBuild =
    phase1.previousBuildId ||
    decision.previousBuildId ||
    phase1.previousObservation?.buildId ||
    parsePreviousBuild(phase1.comparisonSummary) ||
    null;
  const prUrl =
    opts.prUrl ||
    decision.openMonitorPr?.url ||
    phase1.openMonitorPr?.url ||
    decision.prUrl ||
    null;

  const pending = decision.pendingObservations || phase1.pendingObservations || [];
  const analyses = decision.analyses || phase2.analyses || [];
  const commits =
    decision.commitSequence?.commits ||
    decision.commits ||
    [];

  const title = 'New frontend build observed';

  const descLines = [
    previousBuild
      ? `Build \`${buildId}\` (was \`${previousBuild}\`).`
      : `Build \`${buildId}\`.`,
    'Frontend evidence only — this is **not** a claim that the server API changed.',
  ];

  const fields = [];

  const evidenceLine = humanizeFrontendEvidence({
    analyses,
    commits,
    phase2,
    phase1,
  });
  if (evidenceLine) {
    fields.push({
      name: 'What we saw',
      value: truncField(evidenceLine),
      inline: false,
    });
  }

  if (pending.length > 1) {
    const ids = pending
      .slice(-3)
      .map((o) => o.buildId || o.observationId || '?')
      .join(', ');
    fields.push({
      name: 'Pending observations',
      value: truncField(`${pending.length} waiting: ${ids}`),
      inline: false,
    });
  }

  if (prUrl) {
    fields.push({
      name: 'Review',
      value: truncField(`[Open pull request](${prUrl})`),
      inline: false,
    });
  }

  const footerBits = ['Frontend watch · evidence only'];
  if (decision.action) footerBits.push(decision.action);

  /** @type {object} */
  const embed = {
    title: truncTitle(title),
    description: truncDescription(descLines.join('\n')),
    color: COLOR_FRONTEND,
    fields,
    footer: { text: truncField(footerBits.join(' · ')).slice(0, 2048) },
    timestamp: decision.decidedAt || decision.ranAt || new Date().toISOString(),
  };
  if (prUrl) embed.url = prUrl;

  return {
    username: opts.username || DEFAULT_USERNAME,
    embeds: [embed],
  };
}

/**
 * @param {{
 *   analyses?: object[],
 *   commits?: object[],
 *   phase2?: object,
 *   phase1?: object,
 * }} input
 */
function humanizeFrontendEvidence(input) {
  const { analyses, commits, phase2, phase1 } = input;
  if (phase2?.headline) return String(phase2.headline);
  if (phase1?.comparisonSummary) return String(phase1.comparisonSummary);

  const lines = [];
  for (const a of (analyses || []).slice(0, 3)) {
    const counts = a.summary || a.counts;
    const human = compactCountsHuman(counts);
    if (human) lines.push(human);
    else if (a.comparisonStatus || a.extractStatus) {
      lines.push(String(a.comparisonStatus || a.extractStatus));
    }
  }
  if (!lines.length && commits?.length) {
    lines.push(
      commits
        .slice(0, 3)
        .map((c) => c.message || `${c.phase}/${c.step}`)
        .join('; '),
    );
  }
  return lines.join('\n');
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
        title: truncTitle('API shape canary needs a fresh login'),
        description: truncDescription(
          [
            'The saved refresh token is missing, expired, or was rejected.',
            'A human needs to re-approve device login, then mirror auth back to Project secrets (never commit tokens).',
            '```',
            'make api-shape-device-login SCOPE="openid offline_access"',
            '```',
            decision.error ? `Detail: ${decision.error}` : null,
          ]
            .filter(Boolean)
            .join('\n'),
        ),
        color: COLOR_AUTH,
        footer: { text: 'API shape canary · needs login' },
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
    return v.map((x) => (typeof x === 'string' ? x : x?.path || JSON.stringify(x)));
  }
  if (typeof v === 'number') return [];
  return [];
}

function asTypeChangedArray(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  return [];
}

function compactCountsHuman(counts) {
  if (typeof counts === 'string') return counts;
  if (!counts || typeof counts !== 'object') return '';
  if (typeof counts.headline === 'string') return counts.headline;
  const bits = [];
  if (counts.removed != null) {
    bits.push(`${counts.removed} structured op(s) disappeared from frontend evidence`);
  }
  if (counts.added != null) bits.push(`${counts.added} structured op(s) newly seen`);
  if (counts.changed != null) bits.push(`${counts.changed} changed`);
  if (counts.ops != null && !bits.length) bits.push(`${counts.ops} op(s)`);
  if (!bits.length) {
    for (const k of Object.keys(counts)) {
      if (typeof counts[k] === 'string' && counts[k].length > 8) return counts[k];
    }
  }
  return bits.join('; ');
}

/** Parse `a → b` style comparison summary for prior build id. */
function parsePreviousBuild(summary) {
  if (!summary || typeof summary !== 'string') return null;
  const m = summary.match(/([0-9]+\.[0-9]+\.[0-9]+-\d+-[a-f0-9]+)\s*→/i);
  return m ? m[1] : null;
}
