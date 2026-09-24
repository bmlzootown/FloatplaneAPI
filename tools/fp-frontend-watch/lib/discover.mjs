import {
  FRONTEND_CDN_ORIGIN,
  LEGACY_ANGULAR_BUNDLES,
} from './constants.mjs';

/**
 * Parse observable Floatplane homepage HTML for the currently deployed frontend.
 * Prefers Vite-era `/user/{buildId}/…` asset URLs (current as of discovery).
 * Falls back to Angular-era `/{version}/main.js` script refs if present.
 *
 * @param {string} html
 * @param {{ homepageUrl?: string }} [opts]
 * @returns {{
 *   buildId: string,
 *   layout: 'vite-user' | 'angular-version',
 *   baseUrl: string,
 *   entryPath: string | null,
 *   manifestPath: string | null,
 *   artifactPaths: string[],
 *   evidence: { kind: string, value: string }[],
 * }}
 */
export function discoverFromHomepageHtml(html, opts = {}) {
  if (typeof html !== 'string' || html.length === 0) {
    throw new DiscoveryError('Homepage HTML is empty');
  }
  if (!looksLikeHtml(html)) {
    throw new DiscoveryError('Homepage response does not look like HTML');
  }

  const evidence = [];

  const vite = discoverViteUserLayout(html, evidence);
  if (vite) {
    return vite;
  }

  const angular = discoverAngularLayout(html, evidence);
  if (angular) {
    return angular;
  }

  throw new DiscoveryError(
    'Could not find Floatplane frontend build id in homepage HTML ' +
      `(expected ${FRONTEND_CDN_ORIGIN}/user/{buildId}/… or /{version}/main.js)`,
  );
}

/**
 * @param {string} html
 * @param {{ kind: string, value: string }[]} evidence
 */
function discoverViteUserLayout(html, evidence) {
  // script type=module src="https://frontend.floatplane.com/user/{id}/js/index-XXXX.js"
  const scriptRe =
    /https:\/\/frontend\.floatplane\.com\/user\/([^/"'\s]+)\/(js\/index-[A-Za-z0-9_-]+\.js)/gi;
  const manifestRe =
    /https:\/\/frontend\.floatplane\.com\/user\/([^/"'\s]+)\/(manifest\.floatplane\.webmanifest)/gi;

  /** @type {Map<string, { entryPath?: string, manifestPath?: string }>} */
  const byId = new Map();

  for (const match of html.matchAll(scriptRe)) {
    const buildId = match[1];
    const entryPath = match[2];
    evidence.push({ kind: 'script-src', value: match[0] });
    const slot = byId.get(buildId) || {};
    slot.entryPath = entryPath;
    byId.set(buildId, slot);
  }

  for (const match of html.matchAll(manifestRe)) {
    const buildId = match[1];
    const manifestPath = match[2];
    evidence.push({ kind: 'manifest-href', value: match[0] });
    const slot = byId.get(buildId) || {};
    slot.manifestPath = manifestPath;
    byId.set(buildId, slot);
  }

  if (byId.size === 0) {
    return null;
  }

  if (byId.size > 1) {
    throw new DiscoveryError(
      `Homepage references multiple frontend build ids: ${[...byId.keys()].join(', ')}`,
    );
  }

  const [buildId, paths] = [...byId.entries()][0];
  if (!isPlausibleBuildId(buildId)) {
    throw new DiscoveryError(`Implausible frontend build id: ${buildId}`);
  }
  if (!paths.entryPath) {
    throw new DiscoveryError(
      `Found build id ${buildId} but no entry module (js/index-*.js) on homepage`,
    );
  }

  const artifactPaths = [paths.entryPath];
  if (paths.manifestPath) {
    artifactPaths.push(paths.manifestPath);
  }

  return {
    buildId,
    layout: 'vite-user',
    baseUrl: `${FRONTEND_CDN_ORIGIN}/user/${buildId}/`,
    entryPath: paths.entryPath,
    manifestPath: paths.manifestPath || null,
    artifactPaths,
    evidence,
  };
}

/**
 * @param {string} html
 * @param {{ kind: string, value: string }[]} evidence
 */
function discoverAngularLayout(html, evidence) {
  const mainRe =
    /https:\/\/frontend\.floatplane\.com\/([^/"'\s]+)\/main\.js/gi;
  /** @type {Set<string>} */
  const versions = new Set();

  for (const match of html.matchAll(mainRe)) {
    versions.add(match[1]);
    evidence.push({ kind: 'script-src', value: match[0] });
  }

  if (versions.size === 0) {
    return null;
  }
  if (versions.size > 1) {
    throw new DiscoveryError(
      `Homepage references multiple Angular frontend versions: ${[...versions].join(', ')}`,
    );
  }

  const buildId = [...versions][0];
  if (!isPlausibleBuildId(buildId) || buildId === 'user') {
    throw new DiscoveryError(`Implausible Angular frontend version: ${buildId}`);
  }

  return {
    buildId,
    layout: 'angular-version',
    baseUrl: `${FRONTEND_CDN_ORIGIN}/${buildId}/`,
    entryPath: 'main.js',
    manifestPath: null,
    artifactPaths: [...LEGACY_ANGULAR_BUNDLES],
    evidence,
  };
}

/** @param {string} buildId */
function isPlausibleBuildId(buildId) {
  // e.g. 4.5.22-316-d74397b or historic 4.0.13 / 3.10.0-c
  return /^[0-9A-Za-z][0-9A-Za-z._-]{0,128}$/.test(buildId) && !buildId.includes('..');
}

/** @param {string} text */
function looksLikeHtml(text) {
  const sample = text.slice(0, 4096).toLowerCase();
  return (
    sample.includes('<html') ||
    sample.includes('<!doctype') ||
    sample.includes('<head') ||
    sample.includes('<script')
  );
}

export class DiscoveryError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message);
    this.name = 'DiscoveryError';
  }
}
