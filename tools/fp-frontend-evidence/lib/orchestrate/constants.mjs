/** Phase 2.3 / 2.3.1 — wire extract + compare into cumulative frontend-observation workflow. */

export const ORCHESTRATOR_ID = 'phase2.3-frontend-evidence-orchestrate';
export const ORCHESTRATOR_VERSION = '2.3.1';
export const PROCESSING_SCHEMA_VERSION = 1;
export const INDEX_SCHEMA_VERSION = 1;

/** Per-observation processing status filename under phase2/. */
export const PROCESSING_FILE = 'processing.json';

/** Repo-relative global index (under artifacts/frontend/). Never Phase 1 LKG. */
export const PROCESSING_INDEX_FILE = 'phase2-processing-index.json';

/** Extract processing statuses (machine-readable). */
export const EXTRACT_STATUS = Object.freeze({
  NOT_PROCESSED: 'not_processed',
  COMPLETE: 'complete',
  INCOMPLETE_PROMOTED: 'incomplete_promoted',
  EXTRACT_FAILED: 'extract_failed',
});

/** Comparison processing statuses. */
export const COMPARISON_STATUS = Object.freeze({
  NOT_APPLICABLE: 'not_applicable',
  PENDING: 'pending',
  COMPLETE: 'complete',
  FAILED: 'failed',
});

/** Existence marker — Phase 1 observation archived on disk. */
export const EXISTENCE = Object.freeze({
  EXISTS: 'exists',
  NOT_FOUND: 'not_found',
});

/** Commit message prefixes (Phase 2 never shares a transactional unit with Observe). */
export const EXTRACT_COMMIT_PREFIX = 'Extract Floatplane frontend evidence';
export const COMPARE_COMMIT_PREFIX = 'Compare Floatplane frontend evidence';
export const EXTRACT_COMPARE_COMMIT_PREFIX =
  'Extract+Compare Floatplane frontend evidence';

/**
 * Commit strategy (2.3.1):
 * Prefer combined Extract+Compare when both succeed in one run.
 * Durability boundary after successful extraction: if compare fails, still
 * commit/push extract; next run retries compare only (never re-extract).
 * Never combine with Phase 1 Observe in one commit.
 */
export const COMMIT_STRATEGY = Object.freeze({
  id: 'observe_then_extract_compare_combined',
  observeSeparate: true,
  extractCompareCombinedWhenPossible: true,
  extractDurableIndependentOfCompare: true,
  rationale:
    'Phase 1 Observe commits first and stays durable if Phase 2 fails. ' +
    'Phase 2 prefers one Extract+Compare commit when both succeed in the same run ' +
    '(race-safer than two FF pushes). Successful extract is a durability boundary: ' +
    'if compare fails, commit Extract only (status: extract complete, comparison ' +
    'pending/failed); next run retries compare only — never re-extract.',
});

/** Growth estimate for docs / PR notes (keep all reachable JS; no prune). */
export const GROWTH_ESTIMATE = Object.freeze({
  keepAllReachableJs: true,
  phase1EntryPlusManifestMb: '~1.8',
  phase2ChunksMbPerObservation: '~3.5–4.1',
  totalMbPerObservation: '~5–6',
  note:
    'Phase 2.3 does not prune reachable JS archives. Expect ~5–6 MB git growth ' +
    'per distinct observation once extract completes.',
});

/**
 * Path markers that count as Phase 2-owned monitoring content.
 * Used so analysis-only pending survives Phase 1.2 cleanup when observationIds match.
 */
export const PHASE2_OWNED_PATH_MARKERS = Object.freeze([
  '/phase2/',
  'phase2-processing-index.json',
  'api-evidence.json',
  'api-evidence.inventory.md',
  'chunk-graph.json',
  'processing.json',
  'evidence-diff.json',
  'evidence-diff.md',
]);

export const EXIT = Object.freeze({
  SUCCESS: 0,
  FAILURE: 1,
  INCOMPLETE: 3,
});
