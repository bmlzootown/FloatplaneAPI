/**
 * Phase 2.2 evidence-diff offline tests (§14).
 * Controlled fixture mutations only — never presented as real Floatplane changes.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { changeId } from '../../tools/fp-frontend-evidence/lib/diff/change-id.mjs';
import { compareEvidenceInventories } from '../../tools/fp-frontend-evidence/lib/diff/compare.mjs';
import {
  CHANGE_CATEGORY,
  COMPARATOR_VERSION,
  COMPARISON_STATUS,
} from '../../tools/fp-frontend-evidence/lib/diff/constants.mjs';
import {
  loadEvidenceInventory,
  validateEvidenceShape,
} from '../../tools/fp-frontend-evidence/lib/diff/load.mjs';
import {
  runEvidenceDiff,
  runEvidenceDiffLatest,
} from '../../tools/fp-frontend-evidence/lib/diff/run-diff.mjs';
import { renderEvidenceDiffMarkdown } from '../../tools/fp-frontend-evidence/lib/diff/report.mjs';
import {
  baselineItems,
  makeEvidenceDoc,
  otherItem,
  structuredOp,
  writeObservationInventory,
} from './helpers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TMP = path.join(__dirname, '.tmp-diff');

before(async () => {
  await rm(TMP, { recursive: true, force: true });
  await mkdir(TMP, { recursive: true });
});

after(async () => {
  await rm(TMP, { recursive: true, force: true });
});

function loadedFromDoc(evidence, extras = {}) {
  const closureStatus = evidence.closureSummary?.status || 'complete';
  const refuseRemoval = Boolean(evidence.closureSummary?.refuseRemoval);
  return {
    observationId: evidence.observationId,
    buildId: evidence.buildId,
    observationDir: '/dev/null',
    phase2Dir: '/dev/null',
    evidence,
    status: { status: closureStatus, refuseRemoval },
    chunkGraph: null,
    closureStatus,
    refuseRemoval,
    completeEnough:
      (closureStatus === 'complete' ||
        closureStatus === 'complete_with_external_rejects') &&
      !refuseRemoval,
    ...extras,
  };
}

function categories(diff) {
  return diff.changes.map((c) => c.category).sort();
}

describe('change identity (§9)', () => {
  it('stable ids ignore build/time/chunk/offset', () => {
    const a = changeId({
      category: CHANGE_CATEGORY.STRUCTURED_OPERATION_ADDED,
      evidenceCategory: 'structured_operation',
      path: '/api/v3/user/',
      method: 'get',
      evidenceId: 'structured_operation:GET:/api/v3/user',
    });
    const b = changeId({
      category: CHANGE_CATEGORY.STRUCTURED_OPERATION_ADDED,
      evidenceCategory: 'structured_operation',
      path: '/api/v3/user',
      method: 'GET',
      evidenceId: 'structured_operation:GET:/api/v3/user',
    });
    assert.equal(a, b);
    assert.match(a, /^chg:structured_operation_added:/);
    assert.doesNotMatch(a, /fixture-build|2026|index-|offset/i);
  });
});

describe('identical inventories → no semantic changes', () => {
  it('reports zero changes', () => {
    const items = baselineItems();
    const a = makeEvidenceDoc({ observationId: 'obs-a', items });
    const b = makeEvidenceDoc({
      observationId: 'obs-b',
      items: structuredClone(items),
      extractedAt: '2026-09-24T13:00:00.000Z',
    });
    const diff = compareEvidenceInventories({
      from: loadedFromDoc(a),
      to: loadedFromDoc(b),
      labelAsReal: false,
    });
    assert.equal(diff.counts.total, 0);
    assert.equal(diff.comparisonStatus, COMPARISON_STATUS.COMPLETE);
    assert.equal(diff.removalSuppressed, false);
  });
});

describe('structured operation added / disappeared', () => {
  it('operation added', () => {
    const fromItems = baselineItems();
    const toItems = [
      ...baselineItems(),
      structuredOp({ method: 'GET', path: '/api/v3/user/new-endpoint' }),
    ];
    const diff = compareEvidenceInventories({
      from: loadedFromDoc(makeEvidenceDoc({ observationId: 'a', items: fromItems })),
      to: loadedFromDoc(makeEvidenceDoc({ observationId: 'b', items: toItems })),
      labelAsReal: false,
    });
    assert.equal(diff.counts.structured_operation_added, 1);
    assert.equal(diff.counts.structured_operation_disappeared, 0);
    const ch = diff.changes.find(
      (c) => c.category === CHANGE_CATEGORY.STRUCTURED_OPERATION_ADDED,
    );
    assert.match(ch.summary, /frontend now contains structured evidence/i);
    assert.equal(ch.apiChangeClaim, false);
  });

  it('operation disappeared (complete inventories)', () => {
    const fromItems = baselineItems();
    const toItems = baselineItems().filter(
      (i) => i.pathNormalized !== '/api/v3/content/post',
    );
    const diff = compareEvidenceInventories({
      from: loadedFromDoc(makeEvidenceDoc({ observationId: 'a', items: fromItems })),
      to: loadedFromDoc(makeEvidenceDoc({ observationId: 'b', items: toItems })),
      labelAsReal: false,
    });
    assert.equal(diff.counts.structured_operation_disappeared, 1);
    assert.match(
      diff.changes.find(
        (c) => c.category === CHANGE_CATEGORY.STRUCTURED_OPERATION_DISAPPEARED,
      ).summary,
      /disappeared/i,
    );
  });
});

describe('directional completeness gating 2.2.1 (matrix)', () => {
  const pathGone = '/api/v3/content/post';
  const pathNew = '/api/v3/user/extra';

  function inventory(obsId, items, closureStatus) {
    return loadedFromDoc(
      makeEvidenceDoc({
        observationId: obsId,
        items,
        closureStatus,
        refuseRemoval: closureStatus === 'incomplete',
      }),
    );
  }

  function baseWithOptionalExtra(includeGone, includeNew) {
    let items = baselineItems();
    if (!includeGone) {
      items = items.filter((i) => i.pathNormalized !== pathGone);
    }
    if (includeNew) {
      items = [...items, structuredOp({ method: 'GET', path: pathNew })];
    }
    return items;
  }

  // --- Additions 1–4 ---
  it('1. A complete, B complete → addition allowed', () => {
    const diff = compareEvidenceInventories({
      from: inventory('a', baseWithOptionalExtra(true, false), 'complete'),
      to: inventory('b', baseWithOptionalExtra(true, true), 'complete'),
      labelAsReal: false,
    });
    assert.equal(diff.additionConclusionsAllowed, true);
    assert.equal(diff.counts.structured_operation_added, 1);
    assert.equal(diff.counts.suppressedTotal, 0);
  });

  it('2. A complete, B incomplete → addition allowed when positively present in B', () => {
    const diff = compareEvidenceInventories({
      from: inventory('a', baseWithOptionalExtra(true, false), 'complete'),
      to: inventory('b', baseWithOptionalExtra(true, true), 'incomplete'),
      labelAsReal: false,
    });
    assert.equal(diff.additionConclusionsAllowed, true);
    assert.equal(diff.disappearanceConclusionsAllowed, false);
    assert.equal(diff.counts.structured_operation_added, 1);
    assert.ok(
      !diff.suppressedChanges.some(
        (s) => s.proposedCategory === CHANGE_CATEGORY.STRUCTURED_OPERATION_ADDED,
      ),
    );
  });

  it('3. A incomplete, B complete → addition suppressed', () => {
    const diff = compareEvidenceInventories({
      from: inventory('a', baseWithOptionalExtra(true, false), 'incomplete'),
      to: inventory('b', baseWithOptionalExtra(true, true), 'complete'),
      labelAsReal: false,
    });
    assert.equal(diff.additionConclusionsAllowed, false);
    assert.equal(diff.counts.structured_operation_added, 0);
    assert.ok(
      diff.suppressedChanges.some(
        (s) =>
          s.proposedCategory === CHANGE_CATEGORY.STRUCTURED_OPERATION_ADDED &&
          (s.incompleteObservation === 'from' || s.incompleteObservation === 'both'),
      ),
    );
    assert.ok(!diff.changes.some((c) => c.category === CHANGE_CATEGORY.STRUCTURED_OPERATION_ADDED));
  });

  it('4. A incomplete, B incomplete → addition suppressed', () => {
    const diff = compareEvidenceInventories({
      from: inventory('a', baseWithOptionalExtra(true, false), 'incomplete'),
      to: inventory('b', baseWithOptionalExtra(true, true), 'incomplete'),
      labelAsReal: false,
    });
    assert.equal(diff.additionConclusionsAllowed, false);
    assert.equal(diff.counts.structured_operation_added, 0);
    assert.ok(
      diff.suppressedChanges.some(
        (s) => s.proposedCategory === CHANGE_CATEGORY.STRUCTURED_OPERATION_ADDED,
      ),
    );
  });

  // --- Disappearances 5–8 ---
  it('5. A complete, B complete → disappearance allowed', () => {
    const diff = compareEvidenceInventories({
      from: inventory('a', baseWithOptionalExtra(true, false), 'complete'),
      to: inventory('b', baseWithOptionalExtra(false, false), 'complete'),
      labelAsReal: false,
    });
    assert.equal(diff.disappearanceConclusionsAllowed, true);
    assert.equal(diff.counts.structured_operation_disappeared, 1);
  });

  it('6. A incomplete, B complete → disappearance allowed when positively observed in A', () => {
    const diff = compareEvidenceInventories({
      from: inventory('a', baseWithOptionalExtra(true, false), 'incomplete'),
      to: inventory('b', baseWithOptionalExtra(false, false), 'complete'),
      labelAsReal: false,
    });
    assert.equal(diff.disappearanceConclusionsAllowed, true);
    assert.equal(diff.additionConclusionsAllowed, false);
    assert.equal(diff.counts.structured_operation_disappeared, 1);
    assert.ok(
      !diff.suppressedChanges.some(
        (s) => s.proposedCategory === CHANGE_CATEGORY.STRUCTURED_OPERATION_DISAPPEARED,
      ),
    );
  });

  it('7. A complete, B incomplete → disappearance suppressed', () => {
    const diff = compareEvidenceInventories({
      from: inventory('a', baseWithOptionalExtra(true, false), 'complete'),
      to: inventory('b', baseWithOptionalExtra(false, true), 'incomplete'),
      labelAsReal: false,
    });
    assert.equal(diff.disappearanceConclusionsAllowed, false);
    assert.equal(diff.additionConclusionsAllowed, true);
    assert.equal(diff.counts.structured_operation_disappeared, 0);
    assert.equal(diff.counts.structured_operation_added, 1); // addition still ok
    assert.ok(
      diff.suppressedChanges.some(
        (s) =>
          s.proposedCategory === CHANGE_CATEGORY.STRUCTURED_OPERATION_DISAPPEARED &&
          (s.incompleteObservation === 'to' || s.incompleteObservation === 'both'),
      ),
    );
    assert.match(
      renderEvidenceDiffMarkdown(diff),
      /TO incomplete/i,
    );
    assert.doesNotMatch(
      renderEvidenceDiffMarkdown(diff),
      /Removal conclusions suppressed/i,
    );
  });

  it('8. A incomplete, B incomplete → disappearance suppressed', () => {
    const diff = compareEvidenceInventories({
      from: inventory('a', baseWithOptionalExtra(true, false), 'incomplete'),
      to: inventory('b', baseWithOptionalExtra(false, false), 'incomplete'),
      labelAsReal: false,
    });
    assert.equal(diff.disappearanceConclusionsAllowed, false);
    assert.equal(diff.counts.structured_operation_disappeared, 0);
    assert.ok(
      diff.suppressedChanges.some(
        (s) => s.proposedCategory === CHANGE_CATEGORY.STRUCTURED_OPERATION_DISAPPEARED,
      ),
    );
  });

  // --- Method sets 9–11 ---
  it('9. both complete → method_set_changed emitted as derived alongside atomic facts', () => {
    const diff = compareEvidenceInventories({
      from: inventory(
        'a',
        [structuredOp({ method: 'GET', path: '/api/v3/foo' })],
        'complete',
      ),
      to: inventory(
        'b',
        [structuredOp({ method: 'POST', path: '/api/v3/foo' })],
        'complete',
      ),
      labelAsReal: false,
    });
    assert.equal(diff.methodSetConclusionsAllowed, true);
    assert.equal(diff.counts.structured_operation_added, 1);
    assert.equal(diff.counts.structured_operation_disappeared, 1);
    assert.equal(diff.counts.method_set_changed, 1);
    assert.equal(diff.counts.totalAtomic, 2);
    assert.equal(diff.counts.totalDerived, 1);
    const msc = diff.changes.find(
      (c) => c.category === CHANGE_CATEGORY.METHOD_SET_CHANGED,
    );
    assert.equal(msc.kind, 'derived');
  });

  it('10. incomplete A → method_set suppressed; positive disappearance retained', () => {
    const diff = compareEvidenceInventories({
      from: inventory(
        'a',
        [structuredOp({ method: 'GET', path: '/api/v3/foo' })],
        'incomplete',
      ),
      to: inventory(
        'b',
        [structuredOp({ method: 'POST', path: '/api/v3/foo' })],
        'complete',
      ),
      labelAsReal: false,
    });
    assert.equal(diff.methodSetConclusionsAllowed, false);
    assert.equal(diff.counts.method_set_changed, 0);
    assert.equal(diff.counts.structured_operation_disappeared, 1); // B complete
    assert.equal(diff.counts.structured_operation_added, 0); // A incomplete
    assert.ok(
      diff.suppressedChanges.some(
        (s) => s.proposedCategory === CHANGE_CATEGORY.METHOD_SET_CHANGED,
      ),
    );
    assert.ok(
      diff.suppressedChanges.some(
        (s) => s.proposedCategory === CHANGE_CATEGORY.STRUCTURED_OPERATION_ADDED,
      ),
    );
  });

  it('11. incomplete B → method_set suppressed; positive addition retained', () => {
    const diff = compareEvidenceInventories({
      from: inventory(
        'a',
        [structuredOp({ method: 'GET', path: '/api/v3/foo' })],
        'complete',
      ),
      to: inventory(
        'b',
        [structuredOp({ method: 'POST', path: '/api/v3/foo' })],
        'incomplete',
      ),
      labelAsReal: false,
    });
    assert.equal(diff.methodSetConclusionsAllowed, false);
    assert.equal(diff.counts.method_set_changed, 0);
    assert.equal(diff.counts.structured_operation_added, 1);
    assert.equal(diff.counts.structured_operation_disappeared, 0);
    assert.ok(
      diff.suppressedChanges.some(
        (s) => s.proposedCategory === CHANGE_CATEGORY.METHOD_SET_CHANGED,
      ),
    );
  });

  // --- Presence-to-presence 12 ---
  it('12. positive-to-positive request change reportable even if unrelated side incomplete', () => {
    const fromItems = [
      structuredOp({
        method: 'GET',
        path: '/api/v3/user/subscriptions',
        request: { hasQuery: false, hasBody: false, hasHeaders: true },
      }),
    ];
    const toItems = [
      structuredOp({
        method: 'GET',
        path: '/api/v3/user/subscriptions',
        request: { hasQuery: true, hasBody: false, hasHeaders: true },
      }),
    ];
    // FROM incomplete, TO complete — addition/disappearance gated, but matched-id field change OK
    const diff = compareEvidenceInventories({
      from: inventory('a', fromItems, 'incomplete'),
      to: inventory('b', toItems, 'complete'),
      labelAsReal: false,
    });
    assert.equal(diff.counts.request_construction_changed, 1);
    assert.equal(diff.changes[0].details.presenceToPresence, true);
    assert.equal(diff.counts.suppressedTotal, 0);
  });

  it('complete_with_external_rejects counts as complete enough (both directions)', () => {
    const items = baselineItems();
    const diff = compareEvidenceInventories({
      from: inventory('a', items, 'complete_with_external_rejects'),
      to: inventory(
        'b',
        [...items, structuredOp({ method: 'POST', path: '/api/v3/user/extra' })],
        'complete_with_external_rejects',
      ),
      labelAsReal: false,
    });
    assert.equal(diff.comparisonStatus, COMPARISON_STATUS.COMPLETE);
    assert.equal(diff.additionConclusionsAllowed, true);
    assert.equal(diff.disappearanceConclusionsAllowed, true);
    assert.equal(diff.counts.structured_operation_added, 1);
  });
});

describe('frontend-only churn suppression (§8)', () => {
  it('same operation moved to another chunk → provenance_moved only', () => {
    const fromItems = [
      structuredOp({
        method: 'GET',
        path: '/api/v3/user/subscriptions',
        sourcePath: 'js/index-AAAA.js',
      }),
    ];
    const toItems = [
      structuredOp({
        method: 'GET',
        path: '/api/v3/user/subscriptions',
        sourcePath: 'js/lazy-ZZZZ.js',
        sourceSha256: 'c'.repeat(64),
        byteOffset: 999,
      }),
    ];
    const diff = compareEvidenceInventories({
      from: loadedFromDoc(makeEvidenceDoc({ observationId: 'a', items: fromItems })),
      to: loadedFromDoc(makeEvidenceDoc({ observationId: 'b', items: toItems })),
      labelAsReal: false,
    });
    assert.equal(diff.counts.structured_operation_added, 0);
    assert.equal(diff.counts.structured_operation_disappeared, 0);
    assert.equal(diff.counts.provenance_moved, 1);
    assert.equal(diff.changes[0].frontendOnly, true);
  });

  it('offset/minify-only provenance churn is suppressed', () => {
    const fromItems = [
      structuredOp({
        method: 'GET',
        path: '/api/v3/user/subscriptions',
        sourcePath: 'js/index-AAAA.js',
        byteOffset: 100,
      }),
    ];
    const toItems = [
      structuredOp({
        method: 'GET',
        path: '/api/v3/user/subscriptions',
        sourcePath: 'js/index-AAAA.js',
        byteOffset: 2500,
        sourceSha256: 'a'.repeat(64),
      }),
    ];
    // tweak snippet via clone
    toItems[0].provenance[0].snippet = 'this.request({path:"/api/v3/user/subscriptions",method:"GET"})';
    const diff = compareEvidenceInventories({
      from: loadedFromDoc(makeEvidenceDoc({ observationId: 'a', items: fromItems })),
      to: loadedFromDoc(makeEvidenceDoc({ observationId: 'b', items: toItems })),
      labelAsReal: false,
    });
    assert.equal(diff.counts.total, 0);
  });

  it('duplicate provenance count change with same paths is suppressed', () => {
    const fromItems = [
      structuredOp({
        method: 'GET',
        path: '/api/v3/user/subscriptions',
        sourcePath: 'js/index-AAAA.js',
      }),
    ];
    const toItems = [
      structuredOp({
        method: 'GET',
        path: '/api/v3/user/subscriptions',
        sourcePath: 'js/index-AAAA.js',
        extraProvenance: [
          {
            sourcePath: 'js/index-AAAA.js',
            sourceSha256: 'a'.repeat(64),
            role: 'entry',
            byteOffset: 200,
            endOffset: 250,
            snippet: 'dup',
          },
        ],
      }),
    ];
    const diff = compareEvidenceInventories({
      from: loadedFromDoc(makeEvidenceDoc({ observationId: 'a', items: fromItems })),
      to: loadedFromDoc(makeEvidenceDoc({ observationId: 'b', items: toItems })),
      labelAsReal: false,
    });
    assert.equal(diff.counts.total, 0);
  });
});

describe('method set changes', () => {
  it('HTTP method changed on same path', () => {
    const fromItems = [structuredOp({ method: 'GET', path: '/api/v3/foo' })];
    const toItems = [structuredOp({ method: 'POST', path: '/api/v3/foo' })];
    const diff = compareEvidenceInventories({
      from: loadedFromDoc(makeEvidenceDoc({ observationId: 'a', items: fromItems })),
      to: loadedFromDoc(makeEvidenceDoc({ observationId: 'b', items: toItems })),
      labelAsReal: false,
    });
    assert.equal(diff.counts.structured_operation_added, 1);
    assert.equal(diff.counts.structured_operation_disappeared, 1);
    assert.equal(diff.counts.method_set_changed, 1);
  });

  it('same path gains an additional method', () => {
    const fromItems = [structuredOp({ method: 'GET', path: '/api/v3/foo' })];
    const toItems = [
      structuredOp({ method: 'GET', path: '/api/v3/foo' }),
      structuredOp({ method: 'POST', path: '/api/v3/foo' }),
    ];
    const diff = compareEvidenceInventories({
      from: loadedFromDoc(makeEvidenceDoc({ observationId: 'a', items: fromItems })),
      to: loadedFromDoc(makeEvidenceDoc({ observationId: 'b', items: toItems })),
      labelAsReal: false,
    });
    assert.equal(diff.counts.structured_operation_added, 1);
    assert.equal(diff.counts.method_set_changed, 1);
    assert.deepEqual(
      diff.changes.find((c) => c.category === CHANGE_CATEGORY.METHOD_SET_CHANGED)
        .details.methodsAfter.sort(),
      ['GET', 'POST'],
    );
  });
});

describe('request / auth / response / realtime / weak', () => {
  it('request query construction changed', () => {
    const fromItems = [
      structuredOp({
        method: 'GET',
        path: '/api/v3/user/subscriptions',
        request: { hasQuery: false, hasBody: false, hasHeaders: true },
      }),
    ];
    const toItems = [
      structuredOp({
        method: 'GET',
        path: '/api/v3/user/subscriptions',
        request: { hasQuery: true, hasBody: false, hasHeaders: true },
      }),
    ];
    const diff = compareEvidenceInventories({
      from: loadedFromDoc(makeEvidenceDoc({ observationId: 'a', items: fromItems })),
      to: loadedFromDoc(makeEvidenceDoc({ observationId: 'b', items: toItems })),
      labelAsReal: false,
    });
    assert.equal(diff.counts.request_construction_changed, 1);
    assert.equal(diff.changes[0].details.property, 'hasQuery');
  });

  it('request-body construction changed', () => {
    const fromItems = [
      structuredOp({
        method: 'POST',
        path: '/api/v3/user/login',
        request: {
          hasBody: true,
          bodySerializer: 'LoginRequestToJSON',
          contentType: 'application/json',
        },
      }),
    ];
    const toItems = [
      structuredOp({
        method: 'POST',
        path: '/api/v3/user/login',
        request: {
          hasBody: true,
          bodySerializer: 'LoginRequestV2ToJSON',
          contentType: 'application/json',
        },
      }),
    ];
    const diff = compareEvidenceInventories({
      from: loadedFromDoc(makeEvidenceDoc({ observationId: 'a', items: fromItems })),
      to: loadedFromDoc(makeEvidenceDoc({ observationId: 'b', items: toItems })),
      labelAsReal: false,
    });
    assert.equal(diff.counts.request_construction_changed, 1);
    assert.equal(diff.changes[0].details.property, 'bodySerializer');
  });

  it('auth/header evidence changed (contentType on auth path)', () => {
    const fromItems = [
      structuredOp({
        method: 'POST',
        path: '/api/v3/auth/login',
        request: { contentType: null, hasHeaders: true, hasBody: true },
      }),
    ];
    const toItems = [
      structuredOp({
        method: 'POST',
        path: '/api/v3/auth/login',
        request: {
          contentType: 'application/json',
          hasHeaders: true,
          hasBody: true,
        },
      }),
    ];
    const diff = compareEvidenceInventories({
      from: loadedFromDoc(makeEvidenceDoc({ observationId: 'a', items: fromItems })),
      to: loadedFromDoc(makeEvidenceDoc({ observationId: 'b', items: toItems })),
      labelAsReal: false,
    });
    assert.ok(diff.counts.auth_evidence_changed >= 1);
  });

  it('response mapper changed when evidenced', () => {
    const fromItems = [
      structuredOp({
        method: 'GET',
        path: '/api/v3/content/post',
        request: { responseMapper: 'ContentPostFromJSON' },
      }),
    ];
    const toItems = [
      structuredOp({
        method: 'GET',
        path: '/api/v3/content/post',
        request: { responseMapper: 'ContentPostV2FromJSON' },
      }),
    ];
    const diff = compareEvidenceInventories({
      from: loadedFromDoc(makeEvidenceDoc({ observationId: 'a', items: fromItems })),
      to: loadedFromDoc(makeEvidenceDoc({ observationId: 'b', items: toItems })),
      labelAsReal: false,
    });
    assert.equal(diff.counts.response_mapper_changed, 1);
    assert.match(diff.changes[0].summary, /mapper/i);
    assert.doesNotMatch(diff.changes[0].summary, /API added field/i);
  });

  it('realtime operation changed', () => {
    const fromItems = [
      otherItem({
        category: 'realtime_operation',
        method: 'POST',
        path: '/api/v3/socket/connect',
        discriminator: 'sails_socket_post',
        structuralKind: 'sails_socket_post',
      }),
    ];
    const toItems = [
      otherItem({
        category: 'realtime_operation',
        method: 'POST',
        path: '/api/v3/socket/tk/connect',
        discriminator: 'sails_socket_post',
        structuralKind: 'sails_socket_post',
      }),
    ];
    const diff = compareEvidenceInventories({
      from: loadedFromDoc(makeEvidenceDoc({ observationId: 'a', items: fromItems })),
      to: loadedFromDoc(makeEvidenceDoc({ observationId: 'b', items: toItems })),
      labelAsReal: false,
    });
    assert.equal(diff.counts.realtime_evidence_changed, 2);
    assert.equal(diff.counts.structured_operation_added, 0);
  });

  it('URL-template-only addition remains weak evidence', () => {
    const fromItems = baselineItems().filter((i) => i.category !== 'url_template');
    const toItems = [
      ...fromItems,
      otherItem({
        category: 'url_template',
        path: '/api/connect/discord',
        discriminator: 'template_literal',
      }),
    ];
    const diff = compareEvidenceInventories({
      from: loadedFromDoc(makeEvidenceDoc({ observationId: 'a', items: fromItems })),
      to: loadedFromDoc(makeEvidenceDoc({ observationId: 'b', items: toItems })),
      labelAsReal: false,
    });
    assert.equal(diff.counts.structured_operation_added, 0);
    assert.ok(diff.counts.weak_reference_added >= 1);
    // also auth-ish connect path may emit auth_evidence_changed
    assert.ok(!categories(diff).includes(CHANGE_CATEGORY.STRUCTURED_OPERATION_ADDED));
  });

  it('ambiguous endpoint-looking string added stays weak', () => {
    const fromItems = [];
    const toItems = [
      otherItem({
        category: 'ambiguous_reference',
        path: '/api/badges/foo',
        discriminator: 'absolute_api_url_unknown_host',
        structuralKind: 'absolute_api_url_unknown_host',
      }),
    ];
    const diff = compareEvidenceInventories({
      from: loadedFromDoc(makeEvidenceDoc({ observationId: 'a', items: fromItems })),
      to: loadedFromDoc(makeEvidenceDoc({ observationId: 'b', items: toItems })),
      labelAsReal: false,
    });
    assert.equal(diff.counts.weak_reference_added, 1);
    assert.equal(diff.counts.structured_operation_added, 0);
  });
});

describe('TV vs web provenance', () => {
  it('web-root operation unchanged but TV provenance changes → provenance_moved', () => {
    const fromItems = [
      structuredOp({
        method: 'GET',
        path: '/api/v3/user/subscriptions',
        sourcePath: 'js/CIQTQEz9.js',
      }),
    ];
    const toItems = [
      structuredOp({
        method: 'GET',
        path: '/api/v3/user/subscriptions',
        sourcePath: 'js/G4q5a1Mx.js',
      }),
    ];
    const diff = compareEvidenceInventories({
      from: loadedFromDoc(makeEvidenceDoc({ observationId: 'a', items: fromItems })),
      to: loadedFromDoc(makeEvidenceDoc({ observationId: 'b', items: toItems })),
      labelAsReal: false,
    });
    assert.equal(diff.counts.provenance_moved, 1);
    assert.equal(diff.counts.structured_operation_added, 0);
    assert.equal(diff.counts.structured_operation_disappeared, 0);
  });
});

describe('markdown report structure (§11)', () => {
  it('includes required sections and careful wording', () => {
    const fromItems = baselineItems();
    const toItems = [
      ...baselineItems(),
      structuredOp({ method: 'GET', path: '/api/v3/user/new' }),
    ];
    const diff = compareEvidenceInventories({
      from: loadedFromDoc(makeEvidenceDoc({ observationId: 'a', items: fromItems })),
      to: loadedFromDoc(makeEvidenceDoc({ observationId: 'b', items: toItems })),
      labelAsReal: false,
    });
    const md = renderEvidenceDiffMarkdown(diff);
    for (const heading of [
      '# Floatplane Frontend API Evidence Changes',
      '## Extraction status',
      '### Directional gating (2.2.1)',
      '## Summary',
      '### Atomic (primary facts)',
      '### Derived (grouped — do not triple-count with atomic)',
      '## Structured operation changes (atomic + derived)',
      '## Request behavior changes',
      '## Authentication/header changes',
      '## Realtime changes',
      '## Weaker/ambiguous evidence',
      '## Frontend-only movement',
      '## Suppressed / indeterminate',
      '## Warnings / limitations',
    ]) {
      assert.ok(md.includes(heading), `missing ${heading}`);
    }
    assert.match(md, /not.*authoritative server API changelog/i);
    assert.doesNotMatch(md, /breaking change/i);
  });
});

describe('invalid / mismatched evidence schema', () => {
  it('rejects schemaVersion !== 2', () => {
    assert.throws(
      () => validateEvidenceShape({ schemaVersion: 1, items: [] }, 'x'),
      /schemaVersion/,
    );
  });

  it('rejects missing items', () => {
    assert.throws(
      () => validateEvidenceShape({ schemaVersion: 2 }, 'x'),
      /items/,
    );
  });
});

describe('runEvidenceDiff promotion + idempotency (§13)', () => {
  it('writes transactional artifacts and is idempotent; never mutates source inventory', async () => {
    const root = path.join(TMP, 'promote');
    await mkdir(root, { recursive: true });
    const fromItems = baselineItems();
    const toItems = [
      ...baselineItems(),
      structuredOp({ method: 'GET', path: '/api/v3/user/new' }),
    ];
    const fromEv = makeEvidenceDoc({
      observationId: 'fixture-from-obs',
      buildId: 'fixture-build-a',
      items: fromItems,
    });
    const toEv = makeEvidenceDoc({
      observationId: 'fixture-to-obs',
      buildId: 'fixture-build-b',
      items: toItems,
      extractedAt: '2026-09-24T14:00:00.000Z',
    });
    await writeObservationInventory({
      artifactsRoot: root,
      observationId: 'fixture-from-obs',
      buildId: 'fixture-build-a',
      evidence: fromEv,
    });
    const { phase2Dir: toPhase2 } = await writeObservationInventory({
      artifactsRoot: root,
      observationId: 'fixture-to-obs',
      buildId: 'fixture-build-b',
      evidence: toEv,
    });

    const beforeEvidence = await readFile(
      path.join(toPhase2, 'api-evidence.json'),
      'utf8',
    );

    const r1 = await runEvidenceDiff({
      repoRoot: TMP,
      artifactsRoot: root,
      fromObservationId: 'fixture-from-obs',
      toObservationId: 'fixture-to-obs',
      labelAsReal: false,
    });
    assert.equal(r1.idempotent, false);
    assert.equal(r1.diff.counts.structured_operation_added, 1);
    assert.equal(r1.diff.labelAsReal, false);

    const afterEvidence = await readFile(
      path.join(toPhase2, 'api-evidence.json'),
      'utf8',
    );
    assert.equal(afterEvidence, beforeEvidence);

    const r2 = await runEvidenceDiff({
      repoRoot: TMP,
      artifactsRoot: root,
      fromObservationId: 'fixture-from-obs',
      toObservationId: 'fixture-to-obs',
      labelAsReal: false,
    });
    assert.equal(r2.idempotent, true);
    assert.equal(r2.diff.counts.structured_operation_added, 1);

    const status = JSON.parse(
      await readFile(path.join(r1.outDir, 'status.json'), 'utf8'),
    );
    assert.equal(status.comparatorVersion, COMPARATOR_VERSION);
  });
});

describe('diff-latest convenience', () => {
  it('errors clearly when fewer than two complete inventories', async () => {
    const root = path.join(TMP, 'latest-one');
    await mkdir(root, { recursive: true });
    await writeObservationInventory({
      artifactsRoot: root,
      observationId: 'only-one',
      buildId: 'fixture-build',
      evidence: makeEvidenceDoc({
        observationId: 'only-one',
        buildId: 'fixture-build',
        items: baselineItems(),
      }),
    });
    await assert.rejects(
      () =>
        runEvidenceDiffLatest({
          repoRoot: TMP,
          artifactsRoot: root,
        }),
      /≥2 complete/,
    );
  });
});

describe('load real baseline inventory (read-only)', () => {
  it('loads the archived Phase 2.1.1 inventory without mutation', async () => {
    const repoRoot = path.resolve(__dirname, '..', '..');
    const artifactsRoot = path.join(repoRoot, 'artifacts/frontend');
    const obs =
      'f71e83fd15643cf82c9cb6a0cf17089067a7d8a689022ae3b4a261a649f5bf8b';
    const loaded = await loadEvidenceInventory({
      artifactsRoot,
      observationId: obs,
    });
    assert.equal(loaded.completeEnough, true);
    assert.equal(loaded.closureStatus, 'complete_with_external_rejects');
    assert.ok(loaded.evidence.stats.structuredOperationCount >= 350);

    // Self-compare: no semantic changes
    const diff = compareEvidenceInventories({
      from: loaded,
      to: loaded,
      labelAsReal: true,
    });
    assert.equal(diff.counts.total, 0);
    assert.equal(diff.labelAsReal, true);
  });
});
