/**
 * Build minimal Phase 2.1.1-shaped evidence inventories for offline Phase 2.2 tests.
 * Mutations are controlled fixtures — never presented as real Floatplane changes.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { evidenceId } from '../../tools/fp-frontend-evidence/lib/normalize.mjs';

/**
 * @param {{
 *   observationId: string,
 *   buildId?: string,
 *   closureStatus?: string,
 *   refuseRemoval?: boolean,
 *   items?: object[],
 *   extractedAt?: string,
 * }} opts
 */
export function makeEvidenceDoc(opts) {
  const items = opts.items || [];
  const closureStatus = opts.closureStatus || 'complete';
  const refuseRemoval =
    opts.refuseRemoval != null
      ? opts.refuseRemoval
      : closureStatus === 'incomplete';

  return {
    schemaVersion: 2,
    observationId: opts.observationId,
    buildId: opts.buildId || 'fixture-build',
    extractedAt: opts.extractedAt || '2026-09-24T12:00:00.000Z',
    extractorId: 'phase2.1-frontend-evidence',
    extractorVersion: '2.1.1',
    provenance: {
      observationId: opts.observationId,
      buildId: opts.buildId || 'fixture-build',
      extractorId: 'phase2.1-frontend-evidence',
      extractorVersion: '2.1.1',
      evidenceSchemaVersion: 2,
      sourceCount: 1,
    },
    identityRules: { version: 2 },
    closureSummary: {
      status: closureStatus,
      refuseRemoval,
      reachedDeterministicClosure: closureStatus !== 'incomplete',
      rejectedExternalCount: closureStatus === 'complete_with_external_rejects' ? 1 : 0,
    },
    sources: [
      {
        path: 'js/index-AAAA.js',
        sha256: 'a'.repeat(64),
        role: 'entry',
        retainedBytes: true,
        bytes: 100,
      },
    ],
    stats: {
      structuredOperationCount: items.filter((i) => i.category === 'structured_operation')
        .length,
      itemCount: items.length,
      rejectedSignalCount: 0,
      warningCount: 0,
      structuredByMethod: {},
      provenanceLocationCount: items.reduce((n, i) => n + (i.provenance?.length || 0), 0),
    },
    items,
    rejectedSignals: [],
    warnings: [],
  };
}

/**
 * @param {{
 *   method: string,
 *   path: string,
 *   sourcePath?: string,
 *   sourceSha256?: string,
 *   byteOffset?: number,
 *   request?: object,
 *   extraProvenance?: object[],
 * }} opts
 */
export function structuredOp(opts) {
  const pathNormalized = opts.path.replace(/\/$/, '') || '/';
  const id = evidenceId({
    category: 'structured_operation',
    method: opts.method,
    path: pathNormalized,
    discriminator: 'openapi_client_request',
  });
  const provenance = [
    {
      sourcePath: opts.sourcePath || 'js/index-AAAA.js',
      sourceSha256: opts.sourceSha256 || 'a'.repeat(64),
      role: opts.sourcePath?.includes('TV') || opts.sourcePath?.includes('G4')
        ? 'lazy'
        : 'entry',
      byteOffset: opts.byteOffset ?? 100,
      endOffset: (opts.byteOffset ?? 100) + 50,
      snippet: `this.request({path:"${opts.path}",method:"${opts.method}"})`,
    },
    ...(opts.extraProvenance || []),
  ];
  return {
    id,
    category: 'structured_operation',
    path: opts.path,
    pathNormalized,
    method: opts.method.toUpperCase(),
    apiFamily: 'v3',
    provenance,
    request: {
      hasQuery: false,
      hasBody: false,
      hasHeaders: true,
      contentType: null,
      bodySerializer: null,
      responseMapper: null,
      ...(opts.request || {}),
    },
    structuralKind: 'openapi_client_request',
  };
}

/**
 * @param {Partial<{
 *   category: string,
 *   method: string | null,
 *   path: string | null,
 *   discriminator: string,
 *   sourcePath: string,
 *   structuralKind: string,
 * }>} opts
 */
export function otherItem(opts) {
  const category = opts.category || 'url_template';
  const method = opts.method ?? null;
  const pathRaw = opts.path ?? null;
  const discriminator = opts.discriminator || opts.structuralKind || 'template_literal';
  const id = evidenceId({
    category,
    method,
    path: pathRaw,
    discriminator,
  });
  return {
    id,
    category,
    path: pathRaw,
    pathNormalized: pathRaw && pathRaw.startsWith('/') ? pathRaw.replace(/\/$/, '') : pathRaw,
    method: method ? String(method).toUpperCase() : null,
    apiFamily: null,
    provenance: [
      {
        sourcePath: opts.sourcePath || 'js/chunk-BBBB.js',
        sourceSha256: 'b'.repeat(64),
        role: 'lazy',
        byteOffset: 10,
        endOffset: 40,
        snippet: String(pathRaw || discriminator).slice(0, 40),
      },
    ],
    structuralKind: opts.structuralKind || discriminator,
  };
}

/**
 * Write a fake observation dir with phase2 inventory under artifactsRoot.
 * @param {{
 *   artifactsRoot: string,
 *   observationId: string,
 *   buildId: string,
 *   evidence: object,
 *   closureStatus?: string,
 *   refuseRemoval?: boolean,
 * }} opts
 */
export async function writeObservationInventory(opts) {
  const obsDir = path.join(opts.artifactsRoot, opts.buildId, opts.observationId);
  const phase2Dir = path.join(obsDir, 'phase2');
  await mkdir(phase2Dir, { recursive: true });
  await mkdir(path.join(obsDir, 'js'), { recursive: true });

  const observation = {
    schemaVersion: 2,
    observationId: opts.observationId,
    buildId: opts.buildId,
    observedAt: opts.evidence.extractedAt || '2026-09-24T12:00:00.000Z',
    baseUrl: `https://frontend.floatplane.com/user/${opts.buildId}/`,
    artifacts: [
      {
        path: 'js/index-AAAA.js',
        sha256: 'a'.repeat(64),
        bytes: 100,
      },
    ],
  };
  await writeFile(
    path.join(obsDir, 'observation.json'),
    `${JSON.stringify(observation, null, 2)}\n`,
  );
  await writeFile(path.join(obsDir, 'js/index-AAAA.js'), '/* fixture entry */\n');

  const closureStatus =
    opts.closureStatus || opts.evidence.closureSummary?.status || 'complete';
  const refuseRemoval =
    opts.refuseRemoval != null
      ? opts.refuseRemoval
      : opts.evidence.closureSummary?.refuseRemoval ?? closureStatus === 'incomplete';

  // Keep evidence closureSummary in sync
  opts.evidence.closureSummary = {
    ...(opts.evidence.closureSummary || {}),
    status: closureStatus,
    refuseRemoval,
  };
  opts.evidence.observationId = opts.observationId;
  opts.evidence.buildId = opts.buildId;

  await writeFile(
    path.join(phase2Dir, 'api-evidence.json'),
    `${JSON.stringify(opts.evidence, null, 2)}\n`,
  );
  await writeFile(
    path.join(phase2Dir, 'status.json'),
    `${JSON.stringify(
      {
        status: closureStatus,
        refuseRemoval,
        observationId: opts.observationId,
        buildId: opts.buildId,
        extractorId: 'phase2.1-frontend-evidence',
        extractorVersion: '2.1.1',
      },
      null,
      2,
    )}\n`,
  );
  await writeFile(
    path.join(phase2Dir, 'chunk-graph.json'),
    `${JSON.stringify(
      {
        schemaVersion: 2,
        closure: {
          status: closureStatus,
          refuseRemoval,
          reachedDeterministicClosure: closureStatus !== 'incomplete',
        },
      },
      null,
      2,
    )}\n`,
  );

  return { obsDir, phase2Dir };
}

/** Baseline ops used across many fixtures (controlled, not real FP changelog). */
export function baselineItems() {
  return [
    structuredOp({
      method: 'GET',
      path: '/api/v3/user/subscriptions',
      request: {
        hasQuery: true,
        hasBody: false,
        hasHeaders: true,
        contentType: null,
        bodySerializer: null,
        responseMapper: 'UserSubscriptionInfoFromJSON',
      },
    }),
    structuredOp({
      method: 'POST',
      path: '/api/v3/user/login',
      request: {
        hasQuery: false,
        hasBody: true,
        hasHeaders: true,
        contentType: 'application/json',
        bodySerializer: 'LoginRequestToJSON',
        responseMapper: null,
      },
    }),
    structuredOp({
      method: 'GET',
      path: '/api/v3/content/post',
      request: {
        hasQuery: true,
        hasBody: false,
        hasHeaders: true,
        responseMapper: 'ContentPostFromJSON',
      },
    }),
    otherItem({
      category: 'realtime_operation',
      method: 'POST',
      path: '/api/v3/socket/connect',
      discriminator: 'sails_socket_post',
      structuralKind: 'sails_socket_post',
      sourcePath: 'js/index-AAAA.js',
    }),
    otherItem({
      category: 'url_template',
      method: null,
      path: '/api/cms/v3/subscribers/download',
      discriminator: 'template_literal',
      structuralKind: 'template_literal',
    }),
    otherItem({
      category: 'network_reference',
      method: null,
      path: null,
      discriminator: 'host:auth',
      structuralKind: 'host:auth',
      sourcePath: 'js/index-AAAA.js',
    }),
  ];
}
