import { sha256 } from './hash.mjs';

/**
 * Deterministic observation id = SHA-256 over the complete compared artifact set.
 * Canonical form: sorted `path\\nsha256\\n` lines (path ascending).
 *
 * @param {{ path: string, sha256: string }[]} artifacts
 * @returns {string} 64-char hex
 */
export function observationIdFromArtifacts(artifacts) {
  if (!Array.isArray(artifacts) || artifacts.length === 0) {
    throw new Error('Cannot fingerprint empty artifact set');
  }
  const lines = [...artifacts]
    .map((a) => {
      if (typeof a.path !== 'string' || typeof a.sha256 !== 'string') {
        throw new Error('Artifact fingerprint requires path and sha256 strings');
      }
      if (!/^[a-f0-9]{64}$/.test(a.sha256)) {
        throw new Error(`Invalid sha256 for fingerprint: ${a.path}`);
      }
      return { path: a.path, sha256: a.sha256 };
    })
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));

  let canonical = '';
  for (const a of lines) {
    canonical += `${a.path}\n${a.sha256}\n`;
  }
  return sha256(canonical);
}
