/**
 * Factual Phase 1 (+ optional Phase 2.3 analysis) PR body for the cumulative
 * pending observation ledger. Summarizes ALL pending observations.
 * Never claims API / OpenAPI / AsyncAPI / Hydravion changes.
 */

import { PR_BODY_MARKERS } from './monitor-constants.mjs';
import { formatAnalysisPrSection } from '../../fp-frontend-evidence/lib/orchestrate/pr-analysis.mjs';

/**
 * @param {object} input
 * @param {import('./monitor-decision.mjs').PendingObservation[]} input.pendingObservations
 * @param {object} [input.latestCheckSummary]
 * @param {string} [input.watcherResult]
 * @param {object|null} [input.testStatus]
 * @param {string[]} [input.extraNotes]
 * @param {string|null} [input.mainObservationId]
 * @param {object[]} [input.phase2Analyses]
 * @param {boolean} [input.includePhase2]
 */
export function formatObservationPrBody({
  pendingObservations = [],
  latestCheckSummary = null,
  watcherResult = 'CHANGE DETECTED (exit 2) — pending ledger updated',
  testStatus = null,
  extraNotes = [],
  mainObservationId = null,
  phase2Analyses = null,
  includePhase2 = false,
}) {
  const pending = pendingObservations.length
    ? pendingObservations
    : latestCheckSummary?.observationId
      ? [
          {
            observationId: latestCheckSummary.observationId,
            previousObservationId: latestCheckSummary.previousObservationId,
            buildId: latestCheckSummary.buildId,
            observedAt: latestCheckSummary.observedAt,
            artifactDir: latestCheckSummary.artifactDir,
            artifacts: latestCheckSummary.artifacts,
            layout: latestCheckSummary.layout,
          },
        ]
      : [];

  const latest = pending[pending.length - 1] || latestCheckSummary || {};
  const tests = testStatus || latestCheckSummary?.testStatus || null;
  const withPhase2 =
    includePhase2 ||
    (Array.isArray(phase2Analyses) && phase2Analyses.length > 0);
  const lines = [];

  lines.push(
    withPhase2
      ? '## Floatplane frontend observation (Phase 1 + Phase 2 evidence analysis)'
      : '## Floatplane frontend observation (Phase 1 only)',
  );
  lines.push('');
  lines.push(
    withPhase2 ? PR_BODY_MARKERS.phaseWithEvidence : PR_BODY_MARKERS.phase,
  );
  lines.push(`${PR_BODY_MARKERS.pendingCount} ${pending.length}`);
  lines.push(`${PR_BODY_MARKERS.buildId} ${latest.buildId ?? '(unknown)'}`);
  lines.push(`${PR_BODY_MARKERS.observationId} ${latest.observationId ?? '(unknown)'}`);
  lines.push(
    `${PR_BODY_MARKERS.previousObservationId} ${
      latest.previousObservationId == null ? '(none)' : latest.previousObservationId
    }`,
  );
  lines.push(`observedAt: ${latest.observedAt ?? '(unknown)'}`);
  lines.push(`layout: ${latest.layout ?? '(unknown)'}`);
  lines.push(`artifactDir: ${latest.artifactDir ?? '(unknown)'}`);
  lines.push(`statePath: state/last-known-frontend.json`);
  if (mainObservationId) {
    lines.push(`mainObservationIdAtOpen: ${mainObservationId}`);
  }
  lines.push('');
  lines.push('### Pending observation ledger');
  lines.push('');
  lines.push(
    'Branch `cursor/frontend-observation` is a durable pending ledger. `main` remains authoritative until this PR merges.',
  );
  lines.push('');
  if (!pending.length) {
    lines.push('_No pending observations listed._');
  } else {
    pending.forEach((obs, i) => {
      lines.push(`#### ${i + 1}. buildId \`${obs.buildId ?? '?'}\``);
      lines.push('');
      lines.push(`- observationId: \`${obs.observationId ?? '?'}\``);
      lines.push(
        `- previousObservationId: \`${obs.previousObservationId == null ? '(none)' : obs.previousObservationId}\``,
      );
      if (obs.observedAt) lines.push(`- observedAt: ${obs.observedAt}`);
      if (obs.artifactDir) lines.push(`- artifactDir: \`${obs.artifactDir}\``);
      if (Array.isArray(obs.artifacts) && obs.artifacts.length) {
        lines.push('- artifacts:');
        for (const a of obs.artifacts) {
          lines.push(
            `  - \`${a.sha256}\`  ${a.bytes ?? '?'} B  \`${a.path}\``,
          );
        }
      }
      lines.push('');
    });
  }

  if (withPhase2) {
    lines.push(formatAnalysisPrSection(phase2Analyses || []));
  }

  lines.push('### Latest watcher result');
  lines.push('');
  lines.push(`- ${watcherResult}`);
  if (latestCheckSummary?.comparison?.status) {
    lines.push(`- comparison.status: \`${latestCheckSummary.comparison.status}\``);
  }
  if (latestCheckSummary?.comparison?.summary) {
    lines.push(`- comparison.summary: ${latestCheckSummary.comparison.summary}`);
  }
  lines.push('');
  lines.push('### Tests / checks');
  lines.push('');
  if (tests) {
    lines.push(
      `- frontend-watch-test: ${tests.frontendWatchTest ?? tests.status ?? 'see agent run'}`,
    );
    if (tests.detail) lines.push(`- detail: ${tests.detail}`);
  } else {
    lines.push(
      '- Scheduled runs do **not** execute the full unit suite every cycle; offline suites are local/CI only.',
    );
  }
  lines.push('');
  lines.push('### Scope boundaries');
  lines.push('');
  lines.push(
    withPhase2
      ? '- Phase 1 observation + Phase 2 frontend-evidence extract/compare analysis.'
      : '- Phase 1 frontend observation only.',
  );
  lines.push('- This PR does **not** claim that the Floatplane HTTP/WebSocket API changed.');
  lines.push('- No OpenAPI, AsyncAPI, or Hydravion changes are included or implied.');
  lines.push('- Do not auto-merge; human review required.');
  lines.push(
    '- Pending observations are not authoritative on `main` until this PR merges.',
  );
  lines.push(
    '- While open, new deployments append to this same branch/PR (A→B→C). No force-reset from main.',
  );
  if (withPhase2) {
    lines.push(
      '- Phase 1 Observe commits are durable: Phase 2 failure never rolls back an Observe commit.',
    );
    lines.push(
      '- Phase 2 missing on main is backfilled via this monitoring/analysis branch — main history is never rewritten.',
    );
  }

  if (extraNotes.length) {
    lines.push('');
    lines.push('### Notes');
    lines.push('');
    for (const n of extraNotes) lines.push(`- ${n}`);
  }

  lines.push('');
  return lines.join('\n');
}
