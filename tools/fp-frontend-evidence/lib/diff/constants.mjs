/** Phase 2.2 frontend evidence semantic diff — constants. */

export const COMPARATOR_ID = 'phase2.2-frontend-evidence-diff';
export const COMPARATOR_VERSION = '2.2.0';
export const DIFF_SCHEMA_VERSION = 1;

/** Subdirectory under phase2/ for A→B comparison artifacts (on the TO observation). */
export const DIFFS_SUBDIR = 'diffs';

export const DIFF_FILE = 'evidence-diff.json';
export const DIFF_REPORT_FILE = 'evidence-diff.md';
export const DIFF_STATUS_FILE = 'status.json';

/** Comparison outcome status. */
export const COMPARISON_STATUS = Object.freeze({
  COMPLETE: 'complete',
  INCOMPLETE: 'incomplete',
  ERROR: 'error',
});

/**
 * Machine-readable change categories (§16 terminology).
 * Prefer these over "API endpoint added/removed" / "breaking change".
 */
export const CHANGE_CATEGORY = Object.freeze({
  STRUCTURED_OPERATION_ADDED: 'structured_operation_added',
  STRUCTURED_OPERATION_DISAPPEARED: 'structured_operation_disappeared',
  METHOD_SET_CHANGED: 'method_set_changed',
  REQUEST_CONSTRUCTION_CHANGED: 'request_construction_changed',
  AUTH_EVIDENCE_CHANGED: 'auth_evidence_changed',
  RESPONSE_MAPPER_CHANGED: 'response_mapper_changed',
  REALTIME_EVIDENCE_CHANGED: 'realtime_evidence_changed',
  WEAK_REFERENCE_ADDED: 'weak_reference_added',
  WEAK_REFERENCE_DISAPPEARED: 'weak_reference_disappeared',
  PROVENANCE_MOVED: 'provenance_moved',
});

/** Evidence categories treated as weak (never promote to structured add/remove). */
export const WEAK_EVIDENCE_CATEGORIES = Object.freeze([
  'url_template',
  'network_reference',
  'ambiguous_reference',
]);

/** Completeness statuses that allow a full semantic compare (including removals). */
export const COMPLETE_ENOUGH = Object.freeze([
  'complete',
  'complete_with_external_rejects',
]);

export const EXIT = Object.freeze({
  SUCCESS: 0,
  FAILURE: 1,
  INCOMPLETE: 3,
});
