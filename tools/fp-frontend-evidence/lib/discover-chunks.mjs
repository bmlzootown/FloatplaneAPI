/**
 * Deterministic Vite chunk dependency discovery from JS source text.
 * Pure / offline — no network.
 */

/**
 * @typedef {{
 *   relativePath: string,
 *   kind: 'mapDeps' | 'dynamic_import' | 'static_import',
 *   specifier: string,
 *   byteOffset: number,
 * }} ChunkDepRef
 */

/**
 * @typedef {{
 *   mapDepsTables: string[][],
 *   deps: ChunkDepRef[],
 *   jsDeps: ChunkDepRef[],
 *   cssPaths: string[],
 * }} ChunkScanResult
 */

/**
 * Resolve a Vite import specifier relative to the importing module path.
 * `./Foo.js` from `js/index-….js` → `js/Foo.js`
 * `js/Foo.js` (already rooted under build) → `js/Foo.js`
 *
 * @param {string} importerRelPath  e.g. js/index-BZVDPgzb.js
 * @param {string} specifier        e.g. ./G4q5a1Mx.js or js/G4q5a1Mx.js
 * @returns {string | null} posix relative path under build root, or null if unsafe
 */
export function resolveChunkSpecifier(importerRelPath, specifier) {
  const spec = String(specifier).trim();
  if (!spec || spec.startsWith('http:') || spec.startsWith('https:') || spec.startsWith('//')) {
    return null;
  }
  if (spec.startsWith('/')) {
    // Absolute path on same origin — treat as build-relative without leading slash
    return normalizeRel(spec.slice(1));
  }

  const importerDir = importerRelPath.includes('/')
    ? importerRelPath.slice(0, importerRelPath.lastIndexOf('/'))
    : '';

  let joined;
  if (spec.startsWith('./') || spec.startsWith('../')) {
    joined = joinPosix(importerDir, spec);
  } else if (spec.startsWith('js/') || spec.startsWith('css/') || spec.startsWith('assets/')) {
    joined = spec;
  } else {
    // Bare relative without ./ — treat like ./spec relative to importer dir
    joined = joinPosix(importerDir, spec);
  }

  return normalizeRel(joined);
}

/**
 * Scan one JS module for Vite mapDeps tables and import("./….js") edges.
 * @param {string} sourceText
 * @param {string} importerRelPath
 * @returns {ChunkScanResult}
 */
export function scanChunkDependencies(sourceText, importerRelPath) {
  const text = sourceText;
  /** @type {string[][]} */
  const mapDepsTables = [];
  /** @type {ChunkDepRef[]} */
  const deps = [];
  /** @type {string[]} */
  const cssPaths = [];
  const seenKey = new Set();

  function addDep(relativePath, kind, specifier, byteOffset) {
    if (!relativePath) return;
    const key = `${kind}|${relativePath}|${specifier}`;
    if (seenKey.has(key)) return;
    seenKey.add(key);
    const ref = { relativePath, kind, specifier, byteOffset };
    deps.push(ref);
    if (relativePath.endsWith('.css')) {
      if (!cssPaths.includes(relativePath)) cssPaths.push(relativePath);
    }
  }

  // __vite__mapDeps file tables: m.f||(m.f=["js/…","css/…",…])
  const tableRe = /m\.f\s*\|\|\s*\(\s*m\.f\s*=\s*(\[[\s\S]*?\])\s*\)/g;
  let tm;
  while ((tm = tableRe.exec(text)) !== null) {
    const raw = tm[1];
    let arr;
    try {
      arr = JSON.parse(raw.replace(/'/g, '"'));
    } catch {
      // Fallback: extract quoted strings
      arr = [...raw.matchAll(/"([^"]+)"|'([^']+)'/g)].map((m) => m[1] || m[2]);
    }
    if (!Array.isArray(arr)) continue;
    const paths = arr.map(String);
    mapDepsTables.push(paths);
    for (const p of paths) {
      const resolved = resolveChunkSpecifier(importerRelPath, p);
      if (!resolved) continue;
      addDep(resolved, 'mapDeps', p, tm.index);
    }
  }

  // Dynamic import("./hashed.js") / import('./hashed.js')
  const dynRe = /\bimport\s*\(\s*(["'])(\.\/[^"']+\.js)\1\s*\)/g;
  let dm;
  while ((dm = dynRe.exec(text)) !== null) {
    const spec = dm[2];
    const resolved = resolveChunkSpecifier(importerRelPath, spec);
    if (!resolved) continue;
    addDep(resolved, 'dynamic_import', spec, dm.index);
  }

  // Static import … from "./….js" (uncommon in Vite production but allowed)
  const staticRe = /\bfrom\s*(["'])(\.\/[^"']+\.js)\1/g;
  let sm;
  while ((sm = staticRe.exec(text)) !== null) {
    const spec = sm[2];
    const resolved = resolveChunkSpecifier(importerRelPath, spec);
    if (!resolved) continue;
    addDep(resolved, 'static_import', spec, sm.index);
  }

  // import "./….js" side-effect form
  const sideRe = /\bimport\s*(["'])(\.\/[^"']+\.js)\1/g;
  let xm;
  while ((xm = sideRe.exec(text)) !== null) {
    // Skip if this is import( — already handled
    const before = text.slice(Math.max(0, xm.index - 1), xm.index + 7);
    if (before.includes('import(')) continue;
    const spec = xm[2];
    const resolved = resolveChunkSpecifier(importerRelPath, spec);
    if (!resolved) continue;
    addDep(resolved, 'static_import', spec, xm.index);
  }

  const jsDeps = deps.filter((d) => d.relativePath.endsWith('.js'));

  return { mapDepsTables, deps, jsDeps, cssPaths };
}

/**
 * @param {string} a
 * @param {string} b
 */
function joinPosix(a, b) {
  if (!a) return b.replace(/^\.\//, '');
  const base = a.endsWith('/') ? a : `${a}/`;
  return `${base}${b}`;
}

/**
 * Normalize posix relative path; reject traversal / absolute.
 * @param {string} p
 * @returns {string | null}
 */
export function normalizeRel(p) {
  const parts = [];
  for (const seg of String(p).replace(/\\/g, '/').split('/')) {
    if (!seg || seg === '.') continue;
    if (seg === '..') {
      if (parts.length === 0) return null;
      parts.pop();
      continue;
    }
    if (seg.includes('\0')) return null;
    parts.push(seg);
  }
  return parts.join('/');
}

/**
 * Build absolute URL for a chunk under the observation baseUrl.
 * Rejects URLs that escape the build root (different origin or path prefix).
 *
 * @param {string} baseUrl   e.g. https://frontend.floatplane.com/user/BUILD/
 * @param {string} relPath   e.g. js/Foo.js
 * @returns {{ ok: true, url: string } | { ok: false, reason: string, url?: string }}
 */
export function chunkUrlFor(baseUrl, relPath) {
  let base;
  try {
    base = new URL(baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
  } catch {
    return { ok: false, reason: 'invalid_base_url' };
  }
  let url;
  try {
    url = new URL(relPath, base);
  } catch {
    return { ok: false, reason: 'invalid_relative_path' };
  }
  if (url.origin !== base.origin) {
    return { ok: false, reason: 'cross_origin', url: url.href };
  }
  if (!url.pathname.startsWith(base.pathname)) {
    return { ok: false, reason: 'outside_build_root', url: url.href };
  }
  return { ok: true, url: url.href };
}
