/**
 * Phase 1.2 — Cursor Automation monitoring constants.
 *
 * main = authoritative/merged observation history
 * cursor/frontend-observation = pending durable observation ledger (A→B→C→…)
 */

/** Fixed branch reused as the pending observation ledger + single open PR. */
export const MONITOR_BRANCH = 'cursor/frontend-observation';

/** Default branch name (authoritative when merged). */
export const DEFAULT_BRANCH = 'main';

/** PR title: `Floatplane frontend observation: <latestBuildId>` */
export const PR_TITLE_PREFIX = 'Floatplane frontend observation:';

/** Per-observation commit subject prefix. */
export const OBSERVE_COMMIT_PREFIX = 'Observe Floatplane frontend';

/** Marker lines embedded in PR bodies for machine detection. */
export const PR_BODY_MARKERS = Object.freeze({
  observationId: 'observationId:',
  previousObservationId: 'previousObservationId:',
  buildId: 'buildId:',
  phase: 'phase: 1-frontend-observation',
  pendingCount: 'pendingObservationCount:',
});

/** Paths whose merge conflicts abort the run (no watcher on ambiguous state). */
export const MONITORING_CONFLICT_PATH_PREFIXES = Object.freeze([
  'state/',
  'artifacts/frontend/',
]);

/** Label optionally applied to observation PRs (informational). */
export const MONITOR_PR_LABEL = 'frontend-observation';
