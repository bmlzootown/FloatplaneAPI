import {
  FRONTEND_CDN_ORIGIN,
  LEGACY_ANGULAR_BUNDLES,
} from './constants.mjs';

/**
 * Parse observable Floatplane homepage HTML for the currently deployed frontend.
 *
 * Vite-era strategy (preferred):
 * 1. Collect frontend.floatplane.com/user/{buildId}/… refs
 * 2. Require exactly one plausible buildId
 * 3. Use the actual JS module/script entry path from the page (any asset dir/filename)
 * 4. Optionally include manifest under the same build root
 *
 * Falls back to Angular-era `/{version}/main.js` if no /user/ layout is present.
 *
 * @param {string} html
 * @param {{ homepageUrl?: string }} [opts]
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
  /** @type {Set<string>} */
  const buildIds = new Set();

  // Any CDN ref under /user/{buildId}/…
  const anyRefRe =
    /https:\/\/frontend\.floatplane\.com\/user\/([^/"'\s]+)\/([^"'\s>]+)/gi;
  for (const match of html.matchAll(anyRefRe)) {
    buildIds.add(match[1]);
    evidence.push({ kind: 'cdn-ref', value: match[0] });
  }

  if (buildIds.size === 0) {
    return null;
  }

  if (buildIds.size > 1) {
    throw new DiscoveryError(
      `Homepage references contradictory frontend build ids: ${[...buildIds].join(', ')}`,
    );
  }

  const buildId = [...buildIds][0];
  if (!isPlausibleBuildId(buildId)) {
    throw new DiscoveryError(`Implausible frontend build id: ${buildId}`);
  }

  const baseUrl = `${FRONTEND_CDN_ORIGIN}/user/${buildId}/`;
  const entry = selectViteEntry(html, buildId, evidence);
  if (!entry) {
    throw new DiscoveryError(
      `Found build id ${buildId} but no plausible JS module/script entry under ${baseUrl}`,
    );
  }

  const manifestPath = findManifestPath(html, buildId, evidence);

  const artifactPaths = [entry.path];
  if (manifestPath) {
    artifactPaths.push(manifestPath);
  }

  return {
    buildId,
    layout: 'vite-user',
    baseUrl,
    entryPath: entry.path,
    manifestPath,
    artifactPaths,
    evidence,
  };
}

/**
 * Prefer <script type="module" src="…">, then other script src under the build root.
 * Never silently pick among ambiguous entries.
 *
 * @param {string} html
 * @param {string} buildId
 * @param {{ kind: string, value: string }[]} evidence
 * @returns {{ path: string, module: boolean } | null}
 */
function selectViteEntry(html, buildId, evidence) {
  const escapedId = escapeRegExp(buildId);
  const prefix = `https://frontend.floatplane.com/user/${buildId}/`;

  /** @type {{ path: string, module: boolean, raw: string }[]} */
  const candidates = [];

  // Script tags with src (order-independent attributes).
  const scriptRe = /<script\b([^>]*)>/gi;
  for (const match of html.matchAll(scriptRe)) {
    const attrs = match[1];
    const srcMatch = attrs.match(/\bsrc\s*=\s*(["'])(.*?)\1/i);
    if (!srcMatch) continue;
    const src = srcMatch[2];
    if (!src.startsWith(prefix) || !/\.js(\?|#|$)/i.test(src)) continue;
    const path = src.slice(prefix.length).split(/[?#]/)[0];
    if (!path || path.includes('..')) continue;
    const isModule = /\btype\s*=\s*(["'])module\1/i.test(attrs);
    candidates.push({ path, module: isModule, raw: src });
    evidence.push({ kind: isModule ? 'module-script-src' : 'script-src', value: src });
  }

  // Also catch bare URL refs that look like entry modules if no script tags matched
  // (defensive — some hosts may rewrite markup).
  if (candidates.length === 0) {
    const bareRe = new RegExp(
      `https://frontend\\.floatplane\\.com/user/${escapedId}/([^"'\\s>]+\\.js)`,
      'gi',
    );
    for (const match of html.matchAll(bareRe)) {
      const path = match[1].split(/[?#]/)[0];
      if (!path || path.includes('..')) continue;
      candidates.push({ path, module: false, raw: match[0] });
      evidence.push({ kind: 'bare-js-ref', value: match[0] });
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  const modules = candidates.filter((c) => c.module);
  const pool = modules.length > 0 ? modules : candidates;
  const uniquePaths = [...new Set(pool.map((c) => c.path))];

  if (uniquePaths.length > 1) {
    throw new DiscoveryError(
      `Ambiguous JS entry under build ${buildId}: ${uniquePaths.join(', ')}`,
    );
  }

  return { path: uniquePaths[0], module: modules.length > 0 };
}

/**
 * @param {string} html
 * @param {string} buildId
 * @param {{ kind: string, value: string }[]} evidence
 * @returns {string | null}
 */
function findManifestPath(html, buildId, evidence) {
  const prefix = `https://frontend.floatplane.com/user/${buildId}/`;
  const manifestRe = new RegExp(
    `https://frontend\\.floatplane\\.com/user/${escapeRegExp(buildId)}/([^"'\\s>]*manifest[^"'\\s>]*\\.webmanifest)`,
    'gi',
  );
  /** @type {Set<string>} */
  const paths = new Set();
  for (const match of html.matchAll(manifestRe)) {
    const path = match[1].split(/[?#]/)[0];
    if (path && !path.includes('..')) {
      paths.add(path);
      evidence.push({ kind: 'manifest-href', value: match[0] });
    }
  }
  // Also accept link rel=manifest pointing at same prefix with .webmanifest
  const linkRe = /<link\b([^>]*)>/gi;
  for (const match of html.matchAll(linkRe)) {
    const attrs = match[1];
    if (!/\brel\s*=\s*(["'])manifest\1/i.test(attrs)) continue;
    const hrefMatch = attrs.match(/\bhref\s*=\s*(["'])(.*?)\1/i);
    if (!hrefMatch) continue;
    const href = hrefMatch[2];
    if (!href.startsWith(prefix) || !href.includes('.webmanifest')) continue;
    const path = href.slice(prefix.length).split(/[?#]/)[0];
    if (path && !path.includes('..')) {
      paths.add(path);
      evidence.push({ kind: 'manifest-href', value: href });
    }
  }

  if (paths.size === 0) return null;
  if (paths.size > 1) {
    throw new DiscoveryError(
      `Ambiguous manifest under build ${buildId}: ${[...paths].join(', ')}`,
    );
  }
  return [...paths][0];
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
    // Skip vite-user paths accidentally matching (user/... would be buildId "user")
    if (match[1] === 'user') continue;
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
  if (!isPlausibleBuildId(buildId)) {
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

/** @param {string} s */
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export class DiscoveryError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message);
    this.name = 'DiscoveryError';
  }
}
