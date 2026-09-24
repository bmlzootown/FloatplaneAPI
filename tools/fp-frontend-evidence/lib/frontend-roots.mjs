/**
 * Discover TV/web (route) roots from the Phase 1 entry module.
 *
 * Both roots are literal `import("./….js")` targets in the same entry under the
 * same build `baseUrl`, so they belong to the same Phase 1 observation.
 * Relative paths are never merged across different deployment roots — there is
 * only one build root per observation.
 */

/**
 * @param {string} entryText
 * @param {string} entryPath
 * @param {(importer: string, specifier: string) => string | null} resolveSpec
 * @returns {{
 *   entryPath: string,
 *   routeRoots: {
 *     path: string,
 *     specifier: string,
 *     branchHint: 'then' | 'else' | 'unconditional' | null,
 *     label: 'tv' | 'web' | 'route_root',
 *     byteOffset: number,
 *   }[],
 *   sameObservationNote: string,
 * }}
 */
export function discoverFrontendRoots(entryText, entryPath, resolveSpec) {
  /** @type {{ path: string, specifier: string, branchHint: 'then' | 'else' | 'unconditional' | null, label: 'tv' | 'web' | 'route_root', byteOffset: number }[]} */
  const routeRoots = [];
  const dynRe = /\bimport\s*\(\s*(["'])(\.\/[^"']+\.js)\1\s*\)/g;
  let m;
  /** @type {{ path: string, specifier: string, byteOffset: number, behind: string, ahead: string }[]} */
  const found = [];
  while ((m = dynRe.exec(entryText)) !== null) {
    const specifier = m[2];
    const resolved = resolveSpec(entryPath, specifier);
    if (!resolved) continue;
    found.push({
      path: resolved,
      specifier,
      byteOffset: m.index,
      behind: entryText.slice(Math.max(0, m.index - 120), m.index),
      ahead: entryText.slice(m.index, Math.min(entryText.length, m.index + 80)),
    });
  }

  // Detect ternary pair: cond ? () => import("./tv") : () => import("./web")
  // when two dynamic imports appear within a short window.
  for (let i = 0; i < found.length; i++) {
    const cur = found[i];
    if (routeRoots.some((r) => r.path === cur.path)) continue;

    let branchHint = /** @type {'then' | 'else' | 'unconditional' | null} */ ('unconditional');
    let label = /** @type {'tv' | 'web' | 'route_root'} */ ('route_root');

    const next = found[i + 1];
    const prev = found[i - 1];
    const nearNext = next && next.byteOffset - cur.byteOffset < 200;
    const nearPrev = prev && cur.byteOffset - prev.byteOffset < 200;

    if (/\?/.test(cur.behind) && nearNext && /:/.test(cur.ahead + next.behind)) {
      branchHint = 'then';
      label = 'tv';
    } else if (nearPrev && /:/.test(prev.ahead + cur.behind)) {
      branchHint = 'else';
      label = 'web';
    } else if (/\belse\b/.test(cur.behind)) {
      branchHint = 'else';
      label = 'web';
    } else if (/\bif\b/.test(cur.behind) || /\bTV\b|isTv|isTV/.test(cur.behind)) {
      branchHint = 'then';
      label = 'tv';
    }

    routeRoots.push({
      path: cur.path,
      specifier: cur.specifier,
      branchHint,
      label,
      byteOffset: cur.byteOffset,
    });
  }

  return {
    entryPath,
    routeRoots,
    sameObservationNote:
      'Route roots are literal dynamic import() targets in the Phase 1 entry JS. ' +
      'Both TV and web shells share the same build baseUrl and observationId; ' +
      'relative paths are keyed only under that single build root (never merged across deployments). ' +
      'For the Floatplane Vite shell, the ternary then-branch is TV and the else-branch is web.',
  };
}
