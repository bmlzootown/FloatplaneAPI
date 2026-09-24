/**
 * Deterministic semantic comparison of two Phase 2.1.1 evidence inventories.
 *
 * Completeness gating (§1), structured ops (§2), request/auth/response (§3–5),
 * realtime (§6), weak evidence (§7), frontend-churn suppression (§8).
 */

import { changeId, normalizeMethodSet } from './change-id.mjs';
import {
  CHANGE_CATEGORY,
  COMPARATOR_ID,
  COMPARATOR_VERSION,
  COMPARISON_STATUS,
  DIFF_SCHEMA_VERSION,
  WEAK_EVIDENCE_CATEGORIES,
} from './constants.mjs';

/**
 * @param {{
 *   from: import('./load.mjs').LoadedInventory,
 *   to: import('./load.mjs').LoadedInventory,
 *   now?: Date,
 *   labelAsReal?: boolean,
 * }} input
 */
export function compareEvidenceInventories(input) {
  const now = input.now || new Date();
  const from = input.from;
  const to = input.to;
  /** @type {string[]} */
  const warnings = [];

  const removalSuppressed =
    !from.completeEnough ||
    !to.completeEnough ||
    from.refuseRemoval ||
    to.refuseRemoval;

  const comparisonStatus =
    from.completeEnough && to.completeEnough
      ? COMPARISON_STATUS.COMPLETE
      : COMPARISON_STATUS.INCOMPLETE;

  if (removalSuppressed) {
    warnings.push(
      'Removal conclusions suppressed: one or both inventories are incomplete or refuseRemoval=true. ' +
        'Additions may still be reported; disappeared structured operations are not authoritative.',
    );
  }

  const fromById = indexById(from.evidence.items);
  const toById = indexById(to.evidence.items);

  /** @type {object[]} */
  const changes = [];
  /** @type {Set<string>} */
  const seenChangeIds = new Set();

  function pushChange(chg) {
    if (seenChangeIds.has(chg.id)) return;
    seenChangeIds.add(chg.id);
    changes.push(chg);
  }

  // --- Structured operations (primary) ---
  const fromStructured = [...fromById.values()].filter(
    (i) => i.category === 'structured_operation',
  );
  const toStructured = [...toById.values()].filter(
    (i) => i.category === 'structured_operation',
  );
  const fromStructIds = new Set(fromStructured.map((i) => i.id));
  const toStructIds = new Set(toStructured.map((i) => i.id));

  for (const id of toStructIds) {
    if (fromStructIds.has(id)) continue;
    const item = toById.get(id);
    pushChange({
      id: changeId({
        category: CHANGE_CATEGORY.STRUCTURED_OPERATION_ADDED,
        evidenceCategory: 'structured_operation',
        path: item.pathNormalized || item.path,
        method: item.method,
        evidenceId: id,
      }),
      category: CHANGE_CATEGORY.STRUCTURED_OPERATION_ADDED,
      evidenceCategory: 'structured_operation',
      summary:
        'The frontend now contains structured evidence for this operation. ' +
        'This does not automatically mean the server introduced this endpoint.',
      path: item.pathNormalized || item.path || null,
      method: item.method || null,
      fromEvidenceId: null,
      toEvidenceId: id,
      fromProvenance: null,
      toProvenance: sanitizeProvenance(item.provenance),
      details: {},
      apiChangeClaim: false,
    });
  }

  for (const id of fromStructIds) {
    if (toStructIds.has(id)) continue;
    const item = fromById.get(id);
    if (removalSuppressed) {
      // Do not emit structured_operation_disappeared when suppressed.
      continue;
    }
    pushChange({
      id: changeId({
        category: CHANGE_CATEGORY.STRUCTURED_OPERATION_DISAPPEARED,
        evidenceCategory: 'structured_operation',
        path: item.pathNormalized || item.path,
        method: item.method,
        evidenceId: id,
      }),
      category: CHANGE_CATEGORY.STRUCTURED_OPERATION_DISAPPEARED,
      evidenceCategory: 'structured_operation',
      summary:
        'Structured frontend evidence for this operation disappeared. ' +
        'This is not an API removal unless verified in a later phase.',
      path: item.pathNormalized || item.path || null,
      method: item.method || null,
      fromEvidenceId: id,
      toEvidenceId: null,
      fromProvenance: sanitizeProvenance(item.provenance),
      toProvenance: null,
      details: {},
      apiChangeClaim: false,
    });
  }

  // Method-set changes by normalized path (higher-level; may coexist with add/disappear)
  const fromMethodsByPath = methodsByPath(fromStructured);
  const toMethodsByPath = methodsByPath(toStructured);
  const allPaths = new Set([
    ...fromMethodsByPath.keys(),
    ...toMethodsByPath.keys(),
  ]);
  for (const p of allPaths) {
    const before = fromMethodsByPath.get(p) || [];
    const after = toMethodsByPath.get(p) || [];
    const beforeKey = normalizeMethodSet(before);
    const afterKey = normalizeMethodSet(after);
    if (beforeKey === afterKey) continue;
    // Only emit method_set_changed when both sides have at least one method for the path,
    // or when a path gained/lost methods among remaining ops. Skip pure add-only new paths
    // (those are covered by structured_operation_added alone) unless methods differ on shared path.
    if (before.length === 0 || after.length === 0) {
      // Pure path appear/disappear: still useful as method_set when not removal-suppressed
      // for disappear, or always for appear — but avoid noisy double-count: emit only when
      // both sides non-empty OR when methods differ beyond empty↔singleton for shared semantics.
      if (before.length === 0 && after.length > 0) continue; // covered by added
      if (after.length === 0 && before.length > 0) {
        if (removalSuppressed) continue;
        // covered by disappeared — skip separate method_set for pure removal
        continue;
      }
    }
    pushChange({
      id: changeId({
        category: CHANGE_CATEGORY.METHOD_SET_CHANGED,
        path: p,
        methodsBefore: before,
        methodsAfter: after,
      }),
      category: CHANGE_CATEGORY.METHOD_SET_CHANGED,
      evidenceCategory: 'structured_operation',
      summary: `Structured HTTP method set for path changed: {${beforeKey}} → {${afterKey}}.`,
      path: p,
      method: null,
      fromEvidenceId: null,
      toEvidenceId: null,
      fromProvenance: null,
      toProvenance: null,
      details: {
        methodsBefore: [...before].sort(),
        methodsAfter: [...after].sort(),
      },
      apiChangeClaim: false,
    });
  }

  // Shared structured ops: request / response mapper / provenance
  for (const id of fromStructIds) {
    if (!toStructIds.has(id)) continue;
    const a = fromById.get(id);
    const b = toById.get(id);

    compareRequestMeta(a, b, pushChange);
    compareResponseMapper(a, b, pushChange);
    compareProvenanceMovement(a, b, pushChange);
  }

  // --- Realtime (separate from REST totals) ---
  compareIdSetCategory({
    categoryName: 'realtime_operation',
    fromById,
    toById,
    removalSuppressed,
    addedCategory: CHANGE_CATEGORY.REALTIME_EVIDENCE_CHANGED,
    disappearedCategory: CHANGE_CATEGORY.REALTIME_EVIDENCE_CHANGED,
    addedVerb: 'added',
    disappearedVerb: 'disappeared',
    pushChange,
    isWeak: false,
  });

  // Shared realtime: provenance move only
  for (const [id, a] of fromById) {
    if (a.category !== 'realtime_operation') continue;
    const b = toById.get(id);
    if (!b) continue;
    compareProvenanceMovement(a, b, pushChange);
  }

  // --- Weak evidence ---
  for (const weakCat of WEAK_EVIDENCE_CATEGORIES) {
    compareIdSetCategory({
      categoryName: weakCat,
      fromById,
      toById,
      removalSuppressed,
      addedCategory: CHANGE_CATEGORY.WEAK_REFERENCE_ADDED,
      disappearedCategory: CHANGE_CATEGORY.WEAK_REFERENCE_DISAPPEARED,
      addedVerb: 'added',
      disappearedVerb: 'disappeared',
      pushChange,
      isWeak: true,
    });
    for (const [id, a] of fromById) {
      if (a.category !== weakCat) continue;
      const b = toById.get(id);
      if (!b) continue;
      compareProvenanceMovement(a, b, pushChange);
    }
  }

  // Auth-oriented: host:auth network_reference and auth-ish paths already covered by
  // weak/structured sets. Additionally flag contentType / auth path request changes.
  // Dedicated auth_evidence_changed when structuralKind or path is auth-related and
  // the item itself was added/removed (re-tag from weak if applicable) — keep simple:
  // emit auth_evidence_changed for network_reference host:auth id changes and for
  // structured ops under auth-ish paths when request contentType/hasHeaders flip.
  emitAuthSpecificChanges({
    fromById,
    toById,
    removalSuppressed,
    pushChange,
    existingIds: seenChangeIds,
  });

  changes.sort((x, y) => {
    const c = x.category.localeCompare(y.category);
    if (c !== 0) return c;
    return x.id.localeCompare(y.id);
  });

  const counts = countByCategory(changes);

  return {
    schemaVersion: DIFF_SCHEMA_VERSION,
    comparatorId: COMPARATOR_ID,
    comparatorVersion: COMPARATOR_VERSION,
    comparedAt: now.toISOString(),
    labelAsReal: Boolean(input.labelAsReal),
    fromObservationId: from.observationId,
    toObservationId: to.observationId,
    fromBuildId: from.buildId,
    toBuildId: to.buildId,
    comparisonStatus,
    completeness: {
      from: {
        status: from.closureStatus,
        refuseRemoval: from.refuseRemoval,
        completeEnough: from.completeEnough,
      },
      to: {
        status: to.closureStatus,
        refuseRemoval: to.refuseRemoval,
        completeEnough: to.completeEnough,
      },
    },
    removalSuppressed,
    refuseRemoval: removalSuppressed,
    counts,
    changes,
    warnings,
    disclaimer:
      'Frontend-evidence change report only. Not an authoritative server API changelog. ' +
      'Do not treat structured_operation_disappeared as API removal without a later verification phase.',
  };
}

/**
 * @param {object[]} items
 * @returns {Map<string, object>}
 */
function indexById(items) {
  /** @type {Map<string, object>} */
  const map = new Map();
  for (const item of items || []) {
    if (!item?.id) continue;
    if (map.has(item.id)) {
      // Should not happen after 2.1.1 dedupe; keep first, ignore dup id
      continue;
    }
    map.set(item.id, item);
  }
  return map;
}

/**
 * @param {object[]} structured
 * @returns {Map<string, string[]>}
 */
function methodsByPath(structured) {
  /** @type {Map<string, string[]>} */
  const map = new Map();
  for (const item of structured) {
    const p = item.pathNormalized || item.path;
    if (!p || !item.method) continue;
    if (!map.has(p)) map.set(p, []);
    const arr = map.get(p);
    if (!arr.includes(item.method)) arr.push(item.method);
  }
  return map;
}

/**
 * @param {object} a
 * @param {object} b
 * @param {(c: object) => void} pushChange
 */
function compareRequestMeta(a, b, pushChange) {
  const ra = a.request || {};
  const rb = b.request || {};
  /** @type {Array<[string, unknown, unknown]>} */
  const fields = [
    ['hasQuery', ra.hasQuery ?? null, rb.hasQuery ?? null],
    ['hasBody', ra.hasBody ?? null, rb.hasBody ?? null],
    ['hasHeaders', ra.hasHeaders ?? null, rb.hasHeaders ?? null],
    ['contentType', ra.contentType ?? null, rb.contentType ?? null],
    ['bodySerializer', ra.bodySerializer ?? null, rb.bodySerializer ?? null],
  ];

  for (const [prop, before, after] of fields) {
    if (stableJson(before) === stableJson(after)) continue;
    const isAuthish =
      prop === 'contentType' && isAuthRelatedItem(a);
    const category = isAuthish
      ? CHANGE_CATEGORY.AUTH_EVIDENCE_CHANGED
      : CHANGE_CATEGORY.REQUEST_CONSTRUCTION_CHANGED;
    pushChange({
      id: changeId({
        category,
        evidenceCategory: 'structured_operation',
        path: a.pathNormalized || a.path,
        method: a.method,
        property: prop,
      }),
      category,
      evidenceCategory: 'structured_operation',
      summary: isAuthish
        ? `Frontend auth/header-related request field "${prop}" changed for structured operation.`
        : `Request-construction field "${prop}" changed for structured operation (frontend evidence).`,
      path: a.pathNormalized || a.path || null,
      method: a.method || null,
      fromEvidenceId: a.id,
      toEvidenceId: b.id,
      fromProvenance: sanitizeProvenance(a.provenance),
      toProvenance: sanitizeProvenance(b.provenance),
      details: { property: prop, before, after },
      apiChangeClaim: false,
    });
  }
}

/**
 * Response mapper name is structurally associated in Phase 2.1 — strong enough to compare.
 * Field-level response usage is NOT available; skip response_field_reference_*.
 * @param {object} a
 * @param {object} b
 * @param {(c: object) => void} pushChange
 */
function compareResponseMapper(a, b, pushChange) {
  const before = a.request?.responseMapper ?? null;
  const after = b.request?.responseMapper ?? null;
  if (before === after) return;
  // Only report when at least one side has a mapper (avoid null↔null noise)
  if (before == null && after == null) return;
  pushChange({
    id: changeId({
      category: CHANGE_CATEGORY.RESPONSE_MAPPER_CHANGED,
      evidenceCategory: 'structured_operation',
      path: a.pathNormalized || a.path,
      method: a.method,
      property: 'responseMapper',
    }),
    category: CHANGE_CATEGORY.RESPONSE_MAPPER_CHANGED,
    evidenceCategory: 'structured_operation',
    summary:
      'Frontend response mapper reference changed. ' +
      'This is frontend schema-usage evidence, not proof the API added/removed a field.',
    path: a.pathNormalized || a.path || null,
    method: a.method || null,
    fromEvidenceId: a.id,
    toEvidenceId: b.id,
    fromProvenance: sanitizeProvenance(a.provenance),
    toProvenance: sanitizeProvenance(b.provenance),
    details: { property: 'responseMapper', before, after },
    apiChangeClaim: false,
  });
}

/**
 * Provenance movement vs suppressed frontend-only churn (§8).
 * @param {object} a
 * @param {object} b
 * @param {(c: object) => void} pushChange
 */
function compareProvenanceMovement(a, b, pushChange) {
  const pathsA = provenancePathSet(a.provenance);
  const pathsB = provenancePathSet(b.provenance);

  // Same source path set → offset/sha/snippet/minify/dup-count churn → suppress
  if (stableJson([...pathsA].sort()) === stableJson([...pathsB].sort())) {
    return;
  }

  // Content-hashed rename heuristic: basename changed but same role count and
  // semantic id identical — still record as provenance_moved (informational).
  pushChange({
    id: changeId({
      category: CHANGE_CATEGORY.PROVENANCE_MOVED,
      evidenceCategory: a.category,
      path: a.pathNormalized || a.path,
      method: a.method,
      evidenceId: a.id,
    }),
    category: CHANGE_CATEGORY.PROVENANCE_MOVED,
    evidenceCategory: a.category,
    summary:
      'Semantic evidence identity unchanged; source artifact/provenance moved. ' +
      'Informational / frontend-only — not an API change.',
    path: a.pathNormalized || a.path || null,
    method: a.method || null,
    fromEvidenceId: a.id,
    toEvidenceId: b.id,
    fromProvenance: sanitizeProvenance(a.provenance),
    toProvenance: sanitizeProvenance(b.provenance),
    details: {
      sourcePathsBefore: [...pathsA].sort(),
      sourcePathsAfter: [...pathsB].sort(),
    },
    apiChangeClaim: false,
    frontendOnly: true,
  });
}

/**
 * @param {{
 *   categoryName: string,
 *   fromById: Map<string, object>,
 *   toById: Map<string, object>,
 *   removalSuppressed: boolean,
 *   addedCategory: string,
 *   disappearedCategory: string,
 *   addedVerb: string,
 *   disappearedVerb: string,
 *   pushChange: (c: object) => void,
 *   isWeak: boolean,
 * }} opts
 */
function compareIdSetCategory(opts) {
  const fromIds = [...opts.fromById.values()]
    .filter((i) => i.category === opts.categoryName)
    .map((i) => i.id);
  const toIds = [...opts.toById.values()]
    .filter((i) => i.category === opts.categoryName)
    .map((i) => i.id);
  const fromSet = new Set(fromIds);
  const toSet = new Set(toIds);

  for (const id of toSet) {
    if (fromSet.has(id)) continue;
    const item = opts.toById.get(id);
    opts.pushChange({
      id: changeId({
        category: opts.addedCategory,
        evidenceCategory: opts.categoryName,
        path: item.pathNormalized || item.path,
        method: item.method,
        evidenceId: id,
        property: opts.addedVerb,
      }),
      category: opts.addedCategory,
      evidenceCategory: opts.categoryName,
      summary: opts.isWeak
        ? `Weaker ${opts.categoryName} evidence appeared in the frontend. Not a structured operation addition.`
        : `Realtime evidence ${opts.addedVerb} in the frontend inventory.`,
      path: item.pathNormalized || item.path || null,
      method: item.method || null,
      fromEvidenceId: null,
      toEvidenceId: id,
      fromProvenance: null,
      toProvenance: sanitizeProvenance(item.provenance),
      details: { verb: opts.addedVerb, structuralKind: item.structuralKind || null },
      apiChangeClaim: false,
      weak: opts.isWeak,
    });
  }

  for (const id of fromSet) {
    if (toSet.has(id)) continue;
    if (opts.removalSuppressed) continue;
    const item = opts.fromById.get(id);
    opts.pushChange({
      id: changeId({
        category: opts.disappearedCategory,
        evidenceCategory: opts.categoryName,
        path: item.pathNormalized || item.path,
        method: item.method,
        evidenceId: id,
        property: opts.disappearedVerb,
      }),
      category: opts.disappearedCategory,
      evidenceCategory: opts.categoryName,
      summary: opts.isWeak
        ? `Weaker ${opts.categoryName} evidence disappeared from the frontend. Not a structured operation disappearance.`
        : `Realtime evidence ${opts.disappearedVerb} from the frontend inventory.`,
      path: item.pathNormalized || item.path || null,
      method: item.method || null,
      fromEvidenceId: id,
      toEvidenceId: null,
      fromProvenance: sanitizeProvenance(item.provenance),
      toProvenance: null,
      details: { verb: opts.disappearedVerb, structuralKind: item.structuralKind || null },
      apiChangeClaim: false,
      weak: opts.isWeak,
    });
  }
}

/**
 * Extra auth-oriented classifications for host:auth and auth-ish structured paths.
 * @param {{
 *   fromById: Map<string, object>,
 *   toById: Map<string, object>,
 *   removalSuppressed: boolean,
 *   pushChange: (c: object) => void,
 *   existingIds: Set<string>,
 * }} opts
 */
function emitAuthSpecificChanges(opts) {
  const authItems = (map) =>
    [...map.values()].filter(
      (i) =>
        isAuthRelatedItem(i) &&
        (i.category === 'network_reference' ||
          i.category === 'url_template' ||
          i.category === 'structured_operation'),
    );

  const fromAuth = new Map(authItems(opts.fromById).map((i) => [i.id, i]));
  const toAuth = new Map(authItems(opts.toById).map((i) => [i.id, i]));

  for (const [id, item] of toAuth) {
    if (fromAuth.has(id)) continue;
    // Prefer dedicated auth category; still ok if weak_reference_added also exists
    const chgId = changeId({
      category: CHANGE_CATEGORY.AUTH_EVIDENCE_CHANGED,
      evidenceCategory: item.category,
      path: item.pathNormalized || item.path,
      method: item.method,
      evidenceId: id,
      property: 'added',
    });
    if (opts.existingIds.has(chgId)) continue;
    opts.pushChange({
      id: chgId,
      category: CHANGE_CATEGORY.AUTH_EVIDENCE_CHANGED,
      evidenceCategory: item.category,
      summary:
        'Frontend authentication/header-related evidence appeared. ' +
        'Phrase as frontend behavior, not a server auth requirement.',
      path: item.pathNormalized || item.path || null,
      method: item.method || null,
      fromEvidenceId: null,
      toEvidenceId: id,
      fromProvenance: null,
      toProvenance: sanitizeProvenance(item.provenance),
      details: { verb: 'added', structuralKind: item.structuralKind || null },
      apiChangeClaim: false,
    });
  }

  for (const [id, item] of fromAuth) {
    if (toAuth.has(id)) continue;
    if (opts.removalSuppressed) continue;
    const chgId = changeId({
      category: CHANGE_CATEGORY.AUTH_EVIDENCE_CHANGED,
      evidenceCategory: item.category,
      path: item.pathNormalized || item.path,
      method: item.method,
      evidenceId: id,
      property: 'disappeared',
    });
    if (opts.existingIds.has(chgId)) continue;
    opts.pushChange({
      id: chgId,
      category: CHANGE_CATEGORY.AUTH_EVIDENCE_CHANGED,
      evidenceCategory: item.category,
      summary:
        'Frontend authentication/header-related evidence disappeared. ' +
        'Not proof the server dropped an auth requirement.',
      path: item.pathNormalized || item.path || null,
      method: item.method || null,
      fromEvidenceId: id,
      toEvidenceId: null,
      fromProvenance: sanitizeProvenance(item.provenance),
      toProvenance: null,
      details: { verb: 'disappeared', structuralKind: item.structuralKind || null },
      apiChangeClaim: false,
    });
  }
}

/** @param {object} item */
function isAuthRelatedItem(item) {
  const kind = String(item.structuralKind || '');
  if (kind === 'host:auth' || kind.includes('auth') || kind.includes('oauth') || kind.includes('dpop')) {
    return true;
  }
  const p = String(item.pathNormalized || item.path || '').toLowerCase();
  if (
    p.includes('/auth') ||
    p.includes('/oauth') ||
    p.includes('/connect') ||
    p.includes('dpop')
  ) {
    return true;
  }
  return false;
}

/** @param {object[] | null | undefined} provenance */
function provenancePathSet(provenance) {
  /** @type {Set<string>} */
  const set = new Set();
  for (const p of provenance || []) {
    if (p?.sourcePath) set.add(normalizeChunkPathForCompare(p.sourcePath));
  }
  return set;
}

/**
 * Normalize hashed chunk filenames for rename detection helpers.
 * We still treat path-set inequality as provenance_moved; this helper
 * strips nothing semantic — kept for future rename equivalence if needed.
 * @param {string} sourcePath
 */
function normalizeChunkPathForCompare(sourcePath) {
  return String(sourcePath);
}

/** @param {object[] | null | undefined} provenance */
function sanitizeProvenance(provenance) {
  if (!provenance) return null;
  return provenance.map((p) => ({
    sourcePath: p.sourcePath,
    sourceSha256: p.sourceSha256,
    role: p.role,
    // offsets/snippets kept as citation metadata only — not identity
    byteOffset: p.byteOffset,
    endOffset: p.endOffset,
    snippet: p.snippet,
  }));
}

/** @param {object[]} changes */
function countByCategory(changes) {
  /** @type {Record<string, number>} */
  const counts = {};
  for (const cat of Object.values(CHANGE_CATEGORY)) {
    counts[cat] = 0;
  }
  for (const c of changes) {
    counts[c.category] = (counts[c.category] || 0) + 1;
  }
  counts.total = changes.length;
  return counts;
}

/** @param {unknown} v */
function stableJson(v) {
  return JSON.stringify(v);
}
