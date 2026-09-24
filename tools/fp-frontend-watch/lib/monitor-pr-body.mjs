/**
 * Factual Phase 1 PR body for frontend observation PRs.
 * Never claims API / OpenAPI / AsyncAPI / Hydravion changes.
 */

import { PR_BODY_MARKERS } from './monitor-constants.mjs';

/**
 * @param {object} input
 * @param {object} input.checkSummary from decideMonitorAction
 * @param {string} [input.watcherResult] human status line
 * @param {object|null} [input.testStatus]
 * @param {object|null} [input.supersede]
 * @param {string[]} [input.extraNotes]
 */
export function formatObservationPrBody({
  checkSummary,
  watcherResult = 'CHANGE DETECTED (exit 2)',
  testStatus = null,
  supersede = null,
  extraNotes = [],
}) {
  const s = checkSummary || {};
  const tests = testStatus || s.testStatus || null;
  const lines = [];

  lines.push('## Floatplane frontend observation (Phase 1 only)');
  lines.push('');
  lines.push(PR_BODY_MARKERS.phase);
  lines.push(`${PR_BODY_MARKERS.buildId} ${s.buildId ?? '(unknown)'}`);
  lines.push(`${PR_BODY_MARKERS.observationId} ${s.observationId ?? '(unknown)'}`);
  lines.push(
    `${PR_BODY_MARKERS.previousObservationId} ${
      s.previousObservationId == null ? '(none)' : s.previousObservationId
    }`,
  );
  lines.push(`observedAt: ${s.observedAt ?? '(unknown)'}`);
  lines.push(`layout: ${s.layout ?? '(unknown)'}`);
  lines.push(`artifactDir: ${s.artifactDir ?? '(unknown)'}`);
  lines.push(`statePath: ${s.statePath ?? 'state/last-known-frontend.json'}`);
  lines.push('');
  lines.push('### Watcher result');
  lines.push('');
  lines.push(`- ${watcherResult}`);
  if (s.comparison?.status) {
    lines.push(`- comparison.status: \`${s.comparison.status}\``);
  }
  if (s.comparison?.summary) {
    lines.push(`- comparison.summary: ${s.comparison.summary}`);
  }
  lines.push('');
  lines.push('### Artifacts (hashes)');
  lines.push('');
  if (Array.isArray(s.artifacts) && s.artifacts.length) {
    for (const a of s.artifacts) {
      lines.push(
        `- \`${a.sha256}\`  ${a.bytes ?? '?'} B  \`${a.path}\`${a.url ? `  (${a.url})` : ''}`,
      );
    }
  } else {
    lines.push('- (none listed in watcher JSON)');
  }
  lines.push('');
  lines.push('### Tests / checks');
  lines.push('');
  if (tests) {
    lines.push(`- frontend-watch-test: ${tests.frontendWatchTest ?? tests.status ?? 'see agent run'}`);
    if (tests.detail) lines.push(`- detail: ${tests.detail}`);
  } else {
    lines.push('- frontend-watch-test: run by automation agent before opening/updating this PR');
  }
  lines.push('');
  lines.push('### Scope boundaries');
  lines.push('');
  lines.push('- Phase 1 frontend observation only.');
  lines.push('- This PR does **not** claim that the Floatplane HTTP/WebSocket API changed.');
  lines.push('- No OpenAPI, AsyncAPI, or Hydravion changes are included or implied.');
  lines.push('- Do not auto-merge; human review required.');
  lines.push(
    '- Unmerged observations are not last-known-good on the default branch until this PR merges.',
  );

  if (supersede?.previousOpenObservationId) {
    lines.push('');
    lines.push('### Superseded unmerged observation');
    lines.push('');
    lines.push(
      `- Prior open observationId: \`${supersede.previousOpenObservationId}\`` +
        (supersede.previousOpenBuildId ? ` (buildId \`${supersede.previousOpenBuildId}\`)` : ''),
    );
    if (supersede.previousHeadSha) {
      lines.push(`- Prior monitoring tip SHA (recovery): \`${supersede.previousHeadSha}\``);
    }
    lines.push(
      '- A newer live deployment was observed before the prior observation PR merged.',
    );
    lines.push(
      '- Monitoring strategy: reuse/update this same PR/branch tip from current default + latest watcher output.',
    );
    lines.push(
      '- Prior unmerged observation was never default LKG; recoverable from prior tip SHA / carried artifact dirs when present, or from Floatplane CDN if still published.',
    );
    lines.push(
      '- `previousObservationId` in committed state is exactly what the watcher produced against default LKG (not rewritten to the unmerged prior).',
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
