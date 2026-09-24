/**
 * Compare a fresh observation to last-known-good state.
 *
 * Version id and bundle contents are separate identity axes:
 * either a new buildId or a changed sha256 under the same id is a change.
 *
 * @param {import('./state.mjs').FrontendState | null} previous
 * @param {import('./state.mjs').FrontendState} current
 * @returns {{
 *   status: 'unchanged' | 'new_build' | 'content_changed' | 'first_observation',
 *   changedArtifacts: { path: string, previousSha256: string | null, currentSha256: string }[],
 *   removedArtifacts: string[],
 *   summary: string,
 * }}
 */
export function compareStates(previous, current) {
  if (!previous) {
    return {
      status: 'first_observation',
      changedArtifacts: current.artifacts.map((a) => ({
        path: a.path,
        previousSha256: null,
        currentSha256: a.sha256,
      })),
      removedArtifacts: [],
      summary: `First observation of frontend build ${current.buildId}`,
    };
  }

  if (previous.buildId !== current.buildId) {
    return {
      status: 'new_build',
      changedArtifacts: current.artifacts.map((a) => ({
        path: a.path,
        previousSha256: previous.artifacts.find((p) => p.path === a.path)?.sha256 ?? null,
        currentSha256: a.sha256,
      })),
      removedArtifacts: previous.artifacts
        .map((a) => a.path)
        .filter((p) => !current.artifacts.some((c) => c.path === p)),
      summary: `New frontend build id: ${previous.buildId} → ${current.buildId}`,
    };
  }

  const prevByPath = new Map(previous.artifacts.map((a) => [a.path, a]));
  const changedArtifacts = [];
  for (const art of current.artifacts) {
    const prev = prevByPath.get(art.path);
    if (!prev || prev.sha256 !== art.sha256) {
      changedArtifacts.push({
        path: art.path,
        previousSha256: prev?.sha256 ?? null,
        currentSha256: art.sha256,
      });
    }
  }

  const removedArtifacts = [...prevByPath.keys()].filter(
    (p) => !current.artifacts.some((c) => c.path === p),
  );

  // Same build id but artifact set/hashes differ.
  if (changedArtifacts.length > 0 || removedArtifacts.length > 0) {
    return {
      status: 'content_changed',
      changedArtifacts,
      removedArtifacts,
      summary: `Same build id ${current.buildId} but artifact contents/set changed`,
    };
  }

  return {
    status: 'unchanged',
    changedArtifacts: [],
    removedArtifacts: [],
    summary: `Unchanged frontend build ${current.buildId}`,
  };
}
