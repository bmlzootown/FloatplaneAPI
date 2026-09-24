/** Phase 2.1 frontend evidence extraction — shared constants. */

export const EXTRACTOR_ID = 'phase2.1-frontend-evidence';
export const EXTRACTOR_VERSION = '2.1.0';
export const EVIDENCE_SCHEMA_VERSION = 1;
export const CHUNK_GRAPH_SCHEMA_VERSION = 1;

/** Relative directory under an observation for Phase 2 outputs. */
export const PHASE2_DIR = 'phase2';

/** Subpaths under phase2/. */
export const CHUNK_GRAPH_FILE = 'chunk-graph.json';
export const EVIDENCE_FILE = 'api-evidence.json';
export const INVENTORY_FILE = 'api-evidence.inventory.md';
export const STATUS_FILE = 'status.json';
export const CHUNKS_SUBDIR = 'chunks';

/**
 * Evidence categories (strongest → weakest).
 * Weaker categories are NEVER auto-promoted to structured_operation.
 */
export const EVIDENCE_CATEGORY = Object.freeze({
  STRUCTURED_OPERATION: 'structured_operation',
  REQUEST_CONSTRUCTION: 'request_construction',
  REALTIME_OPERATION: 'realtime_operation',
  URL_TEMPLATE: 'url_template',
  NETWORK_REFERENCE: 'network_reference',
  AMBIGUOUS_REFERENCE: 'ambiguous_reference',
});

/** Floatplane-related host suffixes / exact hosts for allowlisting. */
export const FLOATPLANE_HOST_SUFFIXES = Object.freeze([
  'floatplane.com',
  'floatplane.tv',
]);

/** Known non-Floatplane /api/ hosts to reject as vendor noise. */
export const REJECTED_API_HOST_PATTERNS = Object.freeze([
  /keyos\.com$/i,
  /twitch\.tv$/i,
  /fairplay\./i,
]);

export const USER_AGENT =
  'FloatplaneAPIWatch/0.2 (+phase2-frontend-evidence; https://github.com/bmlzootown/FloatplaneAPI)';

export const EXIT = Object.freeze({
  SUCCESS: 0,
  FAILURE: 1,
  INCOMPLETE: 3,
});
