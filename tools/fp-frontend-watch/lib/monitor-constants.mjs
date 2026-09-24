/**
 * Phase 1.2 — Cursor Automation monitoring constants.
 *
 * Single fixed monitoring branch + PR title prefix keep duplicate suppression
 * deterministic without treating unmerged observations as default-branch LKG.
 */

/** Fixed branch reused for all open frontend-observation PRs. */
export const MONITOR_BRANCH = 'cursor/frontend-observation';

/** PR title: `Floatplane frontend observation: <buildId>` */
export const PR_TITLE_PREFIX = 'Floatplane frontend observation:';

/** Marker lines embedded in PR bodies for machine detection. */
export const PR_BODY_MARKERS = Object.freeze({
  observationId: 'observationId:',
  previousObservationId: 'previousObservationId:',
  buildId: 'buildId:',
  phase: 'phase: 1-frontend-observation',
});

/** Label optionally applied to observation PRs (informational; detection prefers markers). */
export const MONITOR_PR_LABEL = 'frontend-observation';
