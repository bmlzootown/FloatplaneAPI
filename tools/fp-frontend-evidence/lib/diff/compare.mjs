/**
 * Deterministic semantic comparison of two Phase 2.1.1 evidence inventories.
 *
 * Phase 2.2.1: directional completeness gating (A→B).
 * - Additions (present B, absent A): require A complete enough
 * - Disappearances (present A, absent B): require B complete enough
 * - method_set_changed: require BOTH complete
 * - Presence-to-presence (same evidence id both sides): allowed without relying on absence
 */

import { changeId, normalizeMethodSet } from './change-id.mjs';
import {
  CHANGE_CATEGORY,
  CHANGE_KIND,
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

  // Directional gating (2.2.1)
  const additionConclusionsAllowed = Boolean(from.completeEnough);
  const disappearanceConclusionsAllowed = Boolean(to.completeEnough);
  const methodSetConclusionsAllowed =
    Boolean(from.completeEnough) && Boolean(to.completeEnough);

  // Legacy alias: true when disappearance conclusions are not allowed
  const removalSuppressed = !disappearanceConclusionsAllowed;

  const comparisonStatus =
    from.completeEnough && to.completeEnough
      ? COMPARISON_STATUS.COMPLETE
      : COMPARISON_STATUS.INCOMPLETE;

  pushDirectionalWarnings(warnings, {
    fromComplete: from.completeEnough,
    toComplete: to.completeEnough,
    additionConclusionsAllowed,
    disappearanceConclusionsAllowed,
    methodSetConclusionsAllowed,
  });

  const fromById = indexById(from.evidence.items);
  const toById = indexById(to.evidence.items);

  /** @type {object[]} */
  const changes = [];
  /** @type {object[]} */
  const suppressedChanges = [];
  /** @type {Set<string>} */
  const seenChangeIds = new Set();
  /** @type {Set<string>} */
  const seenSuppressedIds = new Set();

  function pushChange(chg) {
    if (seenChangeIds.has(chg.id)) return;
    seenChangeIds.add(chg.id);
    changes.push(chg);
  }

  /**
   * @param {{
   *   id: string,
   *   proposedCategory: string,
   *   reason: string,
   *   incompleteObservation: 'from' | 'to' | 'both',
   *   evidenceCategory?: string | null,
   *   path?: string | null,
   *   method?: string | null,
   *   fromEvidenceId?: string | null,
   *   toEvidenceId?: string | null,
   *   details?: object,
   * }} rec
   */
  function suppress(rec) {
    if (seenSuppressedIds.has(rec.id) || seenChangeIds.has(rec.id)) return;
    seenSuppressedIds.add(rec.id);
    suppressedChanges.push({
      id: rec.id,
      proposedCategory: rec.proposedCategory,
      reason: rec.reason,
      incompleteObservation: rec.incompleteObservation,
      evidenceCategory: rec.evidenceCategory || null,
      path: rec.path || null,
      method: rec.method || null,
      fromEvidenceId: rec.fromEvidenceId ?? null,
      toEvidenceId: rec.toEvidenceId ?? null,
      details: rec.details || {},
    });
  }

  function incompleteSideForAddition() {
    if (!from.completeEnough && !to.completeEnough) return 'both';
    if (!from.completeEnough) return 'from';
    return 'both';
  }

  function incompleteSideForDisappearance() {
    if (!from.completeEnough && !to.completeEnough) return 'both';
    if (!to.completeEnough) return 'to';
    return 'both';
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
    const chgId = changeId({
      category: CHANGE_CATEGORY.STRUCTURED_OPERATION_ADDED,
      evidenceCategory: 'structured_operation',
      path: item.pathNormalized || item.path,
      method: item.method,
      evidenceId: id,
    });
    if (!additionConclusionsAllowed) {
      suppress({
        id: chgId,
        proposedCategory: CHANGE_CATEGORY.STRUCTURED_OPERATION_ADDED,
        reason:
          'Addition depends on absence from FROM; FROM inventory is not complete enough for absence to be meaningful',
        incompleteObservation: incompleteSideForAddition(),
        evidenceCategory: 'structured_operation',
        path: item.pathNormalized || item.path,
        method: item.method,
        toEvidenceId: id,
      });
      continue;
    }
    pushChange({
      id: chgId,
      category: CHANGE_CATEGORY.STRUCTURED_OPERATION_ADDED,
      kind: CHANGE_KIND.ATOMIC,
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
    const chgId = changeId({
      category: CHANGE_CATEGORY.STRUCTURED_OPERATION_DISAPPEARED,
      evidenceCategory: 'structured_operation',
      path: item.pathNormalized || item.path,
      method: item.method,
      evidenceId: id,
    });
    if (!disappearanceConclusionsAllowed) {
      suppress({
        id: chgId,
        proposedCategory: CHANGE_CATEGORY.STRUCTURED_OPERATION_DISAPPEARED,
        reason:
          'Disappearance depends on absence from TO; TO inventory is not complete enough for absence to be meaningful',
        incompleteObservation: incompleteSideForDisappearance(),
        evidenceCategory: 'structured_operation',
        path: item.pathNormalized || item.path,
        method: item.method,
        fromEvidenceId: id,
      });
      continue;
    }
    pushChange({
      id: chgId,
      category: CHANGE_CATEGORY.STRUCTURED_OPERATION_DISAPPEARED,
      kind: CHANGE_KIND.ATOMIC,
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

  // Method-set changes: BOTH sides must be complete (derived / grouped)
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
    // Skip pure path appear/disappear — covered by atomic add/disappear only
    if (before.length === 0 || after.length === 0) continue;

    const chgId = changeId({
      category: CHANGE_CATEGORY.METHOD_SET_CHANGED,
      path: p,
      methodsBefore: before,
      methodsAfter: after,
    });
    if (!methodSetConclusionsAllowed) {
      suppress({
        id: chgId,
        proposedCategory: CHANGE_CATEGORY.METHOD_SET_CHANGED,
        reason:
          'Complete method-set change requires both FROM and TO inventories to be complete enough; ' +
          'positive atomic add/disappear facts may still be retained when their direction allows',
        incompleteObservation:
          !from.completeEnough && !to.completeEnough
            ? 'both'
            : !from.completeEnough
              ? 'from'
              : 'to',
        evidenceCategory: 'structured_operation',
        path: p,
        details: {
          methodsBefore: [...before].sort(),
          methodsAfter: [...after].sort(),
        },
      });
      continue;
    }
    pushChange({
      id: chgId,
      category: CHANGE_CATEGORY.METHOD_SET_CHANGED,
      kind: CHANGE_KIND.DERIVED,
      evidenceCategory: 'structured_operation',
      summary: `Structured HTTP method set for path changed: {${beforeKey}} → {${afterKey}} (derived grouping of atomic method+path facts).`,
      path: p,
      method: null,
      fromEvidenceId: null,
      toEvidenceId: null,
      fromProvenance: null,
      toProvenance: null,
      details: {
        methodsBefore: [...before].sort(),
        methodsAfter: [...after].sort(),
        derivedFrom: 'atomic structured_operation add/disappear on same path',
      },
      apiChangeClaim: false,
    });
  }

  // Shared structured ops: presence-to-presence (allowed even if graphs incomplete)
  for (const id of fromStructIds) {
    if (!toStructIds.has(id)) continue;
    const a = fromById.get(id);
    const b = toById.get(id);

    compareRequestMeta(a, b, pushChange);
    compareResponseMapper(a, b, pushChange);
    compareProvenanceMovement(a, b, pushChange);
  }

  // --- Realtime ---
  compareIdSetCategory({
    categoryName: 'realtime_operation',
    fromById,
    toById,
    additionConclusionsAllowed,
    disappearanceConclusionsAllowed,
    incompleteSideForAddition,
    incompleteSideForDisappearance,
    addedCategory: CHANGE_CATEGORY.REALTIME_EVIDENCE_CHANGED,
    disappearedCategory: CHANGE_CATEGORY.REALTIME_EVIDENCE_CHANGED,
    addedVerb: 'added',
    disappearedVerb: 'disappeared',
    pushChange,
    suppress,
    isWeak: false,
  });

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
      additionConclusionsAllowed,
      disappearanceConclusionsAllowed,
      incompleteSideForAddition,
      incompleteSideForDisappearance,
      addedCategory: CHANGE_CATEGORY.WEAK_REFERENCE_ADDED,
      disappearedCategory: CHANGE_CATEGORY.WEAK_REFERENCE_DISAPPEARED,
      addedVerb: 'added',
      disappearedVerb: 'disappeared',
      pushChange,
      suppress,
      isWeak: true,
    });
    for (const [id, a] of fromById) {
      if (a.category !== weakCat) continue;
      const b = toById.get(id);
      if (!b) continue;
      compareProvenanceMovement(a, b, pushChange);
    }
  }

  emitAuthSpecificChanges({
    fromById,
    toById,
    additionConclusionsAllowed,
    disappearanceConclusionsAllowed,
    incompleteSideForAddition,
    incompleteSideForDisappearance,
    pushChange,
    suppress,
    existingIds: seenChangeIds,
  });

  changes.sort((x, y) => {
    const c = x.category.localeCompare(y.category);
    if (c !== 0) return c;
    return x.id.localeCompare(y.id);
  });
  suppressedChanges.sort((x, y) => {
    const c = String(x.proposedCategory).localeCompare(String(y.proposedCategory));
    if (c !== 0) return c;
    return x.id.localeCompare(y.id);
  });

  const counts = buildCounts(changes, suppressedChanges);

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
    gating: {
      additionConclusionsAllowed,
      disappearanceConclusionsAllowed,
      methodSetConclusionsAllowed,
      /** @deprecated use disappearanceConclusionsAllowed; kept for readers of 2.2.0 */
      removalSuppressed,
    },
    additionConclusionsAllowed,
    disappearanceConclusionsAllowed,
    methodSetConclusionsAllowed,
    /** @deprecated use disappearanceConclusionsAllowed */
    removalSuppressed,
    /** @deprecated alias of removalSuppressed */
    refuseRemoval: removalSuppressed,
    counts,
    changes,
    suppressedChanges,
    warnings,
    disclaimer:
      'Frontend-evidence change report only. Not an authoritative server API changelog. ' +
      'Do not treat structured_operation_disappeared as API removal without a later verification phase. ' +
      'method_set_changed is a derived grouping of atomic method+path facts — do not triple-count with add/disappear.',
  };
}

/**
 * @param {string[]} warnings
 * @param {{
 *   fromComplete: boolean,
 *   toComplete: boolean,
 *   additionConclusionsAllowed: boolean,
 *   disappearanceConclusionsAllowed: boolean,
 *   methodSetConclusionsAllowed: boolean,
 * }} g
 */
function pushDirectionalWarnings(warnings, g) {
  if (g.fromComplete && g.toComplete) return;

  if (!g.additionConclusionsAllowed && !g.disappearanceConclusionsAllowed) {
    warnings.push(
      'FROM and TO inventories are not both complete enough. ' +
        'Additions that depend on absence from FROM are suppressed; ' +
        'disappearances that depend on absence from TO are suppressed; ' +
        'method-set changes are suppressed. ' +
        'Presence-to-presence comparisons of matched evidence may still be reported.',
    );
    return;
  }
  if (!g.additionConclusionsAllowed) {
    warnings.push(
      'FROM inventory is incomplete (or refuseRemoval): additions that depend on absence from FROM are suppressed. ' +
        'Disappearances may still be reported when TO is complete enough. ' +
        'Presence-to-presence comparisons remain allowed.',
    );
  }
  if (!g.disappearanceConclusionsAllowed) {
    warnings.push(
      'TO inventory is incomplete (or refuseRemoval): disappearances that depend on absence from TO are suppressed. ' +
        'Additions may still be reported when FROM is complete enough. ' +
        'Presence-to-presence comparisons remain allowed.',
    );
  }
  if (!g.methodSetConclusionsAllowed) {
    warnings.push(
      'Complete method-set change conclusions require both sides complete; method_set_changed is suppressed.',
    );
  }
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
    if (map.has(item.id)) continue;
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
 * Presence-to-presence request meta compare (does not rely on inventory absence).
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
    const isAuthish = prop === 'contentType' && isAuthRelatedItem(a);
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
      kind: CHANGE_KIND.ATOMIC,
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
      details: { property: prop, before, after, presenceToPresence: true },
      apiChangeClaim: false,
    });
  }
}

/**
 * @param {object} a
 * @param {object} b
 * @param {(c: object) => void} pushChange
 */
function compareResponseMapper(a, b, pushChange) {
  const before = a.request?.responseMapper ?? null;
  const after = b.request?.responseMapper ?? null;
  if (before === after) return;
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
    kind: CHANGE_KIND.ATOMIC,
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
    details: {
      property: 'responseMapper',
      before,
      after,
      presenceToPresence: true,
    },
    apiChangeClaim: false,
  });
}

/**
 * @param {object} a
 * @param {object} b
 * @param {(c: object) => void} pushChange
 */
function compareProvenanceMovement(a, b, pushChange) {
  const pathsA = provenancePathSet(a.provenance);
  const pathsB = provenancePathSet(b.provenance);

  if (stableJson([...pathsA].sort()) === stableJson([...pathsB].sort())) {
    return;
  }

  pushChange({
    id: changeId({
      category: CHANGE_CATEGORY.PROVENANCE_MOVED,
      evidenceCategory: a.category,
      path: a.pathNormalized || a.path,
      method: a.method,
      evidenceId: a.id,
    }),
    category: CHANGE_CATEGORY.PROVENANCE_MOVED,
    kind: CHANGE_KIND.ATOMIC,
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
      presenceToPresence: true,
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
 *   additionConclusionsAllowed: boolean,
 *   disappearanceConclusionsAllowed: boolean,
 *   incompleteSideForAddition: () => 'from' | 'to' | 'both',
 *   incompleteSideForDisappearance: () => 'from' | 'to' | 'both',
 *   addedCategory: string,
 *   disappearedCategory: string,
 *   addedVerb: string,
 *   disappearedVerb: string,
 *   pushChange: (c: object) => void,
 *   suppress: (r: object) => void,
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
    const chgId = changeId({
      category: opts.addedCategory,
      evidenceCategory: opts.categoryName,
      path: item.pathNormalized || item.path,
      method: item.method,
      evidenceId: id,
      property: opts.addedVerb,
    });
    if (!opts.additionConclusionsAllowed) {
      opts.suppress({
        id: chgId,
        proposedCategory: opts.addedCategory,
        reason:
          'Addition depends on absence from FROM; FROM inventory is not complete enough',
        incompleteObservation: opts.incompleteSideForAddition(),
        evidenceCategory: opts.categoryName,
        path: item.pathNormalized || item.path,
        method: item.method,
        toEvidenceId: id,
        details: { verb: opts.addedVerb },
      });
      continue;
    }
    opts.pushChange({
      id: chgId,
      category: opts.addedCategory,
      kind: CHANGE_KIND.ATOMIC,
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
    const item = opts.fromById.get(id);
    const chgId = changeId({
      category: opts.disappearedCategory,
      evidenceCategory: opts.categoryName,
      path: item.pathNormalized || item.path,
      method: item.method,
      evidenceId: id,
      property: opts.disappearedVerb,
    });
    if (!opts.disappearanceConclusionsAllowed) {
      opts.suppress({
        id: chgId,
        proposedCategory: opts.disappearedCategory,
        reason:
          'Disappearance depends on absence from TO; TO inventory is not complete enough',
        incompleteObservation: opts.incompleteSideForDisappearance(),
        evidenceCategory: opts.categoryName,
        path: item.pathNormalized || item.path,
        method: item.method,
        fromEvidenceId: id,
        details: { verb: opts.disappearedVerb },
      });
      continue;
    }
    opts.pushChange({
      id: chgId,
      category: opts.disappearedCategory,
      kind: CHANGE_KIND.ATOMIC,
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
 * @param {{
 *   fromById: Map<string, object>,
 *   toById: Map<string, object>,
 *   additionConclusionsAllowed: boolean,
 *   disappearanceConclusionsAllowed: boolean,
 *   incompleteSideForAddition: () => 'from' | 'to' | 'both',
 *   incompleteSideForDisappearance: () => 'from' | 'to' | 'both',
 *   pushChange: (c: object) => void,
 *   suppress: (r: object) => void,
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
    const chgId = changeId({
      category: CHANGE_CATEGORY.AUTH_EVIDENCE_CHANGED,
      evidenceCategory: item.category,
      path: item.pathNormalized || item.path,
      method: item.method,
      evidenceId: id,
      property: 'added',
    });
    if (opts.existingIds.has(chgId)) continue;
    if (!opts.additionConclusionsAllowed) {
      opts.suppress({
        id: chgId,
        proposedCategory: CHANGE_CATEGORY.AUTH_EVIDENCE_CHANGED,
        reason:
          'Auth evidence addition depends on absence from FROM; FROM is not complete enough',
        incompleteObservation: opts.incompleteSideForAddition(),
        evidenceCategory: item.category,
        path: item.pathNormalized || item.path,
        method: item.method,
        toEvidenceId: id,
        details: { verb: 'added' },
      });
      continue;
    }
    opts.pushChange({
      id: chgId,
      category: CHANGE_CATEGORY.AUTH_EVIDENCE_CHANGED,
      kind: CHANGE_KIND.ATOMIC,
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
    const chgId = changeId({
      category: CHANGE_CATEGORY.AUTH_EVIDENCE_CHANGED,
      evidenceCategory: item.category,
      path: item.pathNormalized || item.path,
      method: item.method,
      evidenceId: id,
      property: 'disappeared',
    });
    if (opts.existingIds.has(chgId)) continue;
    if (!opts.disappearanceConclusionsAllowed) {
      opts.suppress({
        id: chgId,
        proposedCategory: CHANGE_CATEGORY.AUTH_EVIDENCE_CHANGED,
        reason:
          'Auth evidence disappearance depends on absence from TO; TO is not complete enough',
        incompleteObservation: opts.incompleteSideForDisappearance(),
        evidenceCategory: item.category,
        path: item.pathNormalized || item.path,
        method: item.method,
        fromEvidenceId: id,
        details: { verb: 'disappeared' },
      });
      continue;
    }
    opts.pushChange({
      id: chgId,
      category: CHANGE_CATEGORY.AUTH_EVIDENCE_CHANGED,
      kind: CHANGE_KIND.ATOMIC,
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
  if (
    kind === 'host:auth' ||
    kind.includes('auth') ||
    kind.includes('oauth') ||
    kind.includes('dpop')
  ) {
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
    if (p?.sourcePath) set.add(String(p.sourcePath));
  }
  return set;
}

/** @param {object[] | null | undefined} provenance */
function sanitizeProvenance(provenance) {
  if (!provenance) return null;
  return provenance.map((p) => ({
    sourcePath: p.sourcePath,
    sourceSha256: p.sourceSha256,
    role: p.role,
    byteOffset: p.byteOffset,
    endOffset: p.endOffset,
    snippet: p.snippet,
  }));
}

/**
 * @param {object[]} changes
 * @param {object[]} suppressedChanges
 */
function buildCounts(changes, suppressedChanges) {
  /** @type {Record<string, number>} */
  const byCategory = {};
  /** @type {Record<string, number>} */
  const atomic = {};
  /** @type {Record<string, number>} */
  const derived = {};
  for (const cat of Object.values(CHANGE_CATEGORY)) {
    byCategory[cat] = 0;
    atomic[cat] = 0;
    derived[cat] = 0;
  }

  let totalAtomic = 0;
  let totalDerived = 0;
  for (const c of changes) {
    byCategory[c.category] = (byCategory[c.category] || 0) + 1;
    if (c.kind === CHANGE_KIND.DERIVED) {
      derived[c.category] = (derived[c.category] || 0) + 1;
      totalDerived += 1;
    } else {
      atomic[c.category] = (atomic[c.category] || 0) + 1;
      totalAtomic += 1;
    }
  }

  /** @type {Record<string, number>} */
  const suppressedByCategory = {};
  for (const s of suppressedChanges) {
    const k = s.proposedCategory || 'unknown';
    suppressedByCategory[k] = (suppressedByCategory[k] || 0) + 1;
  }

  return {
    // Flat category counts = authoritative emitted changes (backward-compatible keys)
    ...byCategory,
    byCategory,
    atomic,
    derived,
    totalAtomic,
    totalDerived,
    total: changes.length,
    suppressedTotal: suppressedChanges.length,
    suppressedByCategory,
    note:
      'method_set_changed is derived/grouped over atomic structured_operation add/disappear on the same path. ' +
      'Reviewers should not treat derived + atomic as independent API changes. ' +
      'Suppressed conclusions are excluded from totals and listed in suppressedChanges.',
  };
}

/** @param {unknown} v */
function stableJson(v) {
  return JSON.stringify(v);
}
