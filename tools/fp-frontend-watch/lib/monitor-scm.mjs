/**
 * SCM refresh / pending-ledger helpers for Phase 1.2 monitoring.
 *
 * Explicitly refreshes remotes every run. Pending uniqueness is decided from
 * observation state + monitoring-path diffs (not ancestry alone).
 */

import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  DEFAULT_BRANCH,
  MONITOR_BRANCH,
} from './monitor-constants.mjs';

/**
 * @param {string} repoRoot
 * @param {string[]} args
 * @param {object} [opts]
 */
export function git(repoRoot, args, opts = {}) {
  const proc = spawnSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    ...opts,
  });
  return {
    status: proc.status == null ? 1 : proc.status,
    stdout: (proc.stdout || '').trim(),
    stderr: (proc.stderr || '').trim(),
    ok: proc.status === 0,
  };
}

/**
 * Fetch origin/main and the monitoring branch (if advertised).
 * Fail closed on main fetch failure.
 *
 * @param {string} repoRoot
 */
export function refreshMonitoringRefs(repoRoot) {
  const mainFetch = git(repoRoot, ['fetch', 'origin', DEFAULT_BRANCH]);
  if (!mainFetch.ok) {
    return {
      ok: false,
      error: `git fetch origin ${DEFAULT_BRANCH} failed: ${mainFetch.stderr || mainFetch.stdout}`,
      mainSha: null,
      monitorBranchExists: false,
      monitorTipSha: null,
    };
  }

  const mainSha = git(repoRoot, ['rev-parse', `origin/${DEFAULT_BRANCH}`]);
  if (!mainSha.ok) {
    return {
      ok: false,
      error: `rev-parse origin/${DEFAULT_BRANCH} failed: ${mainSha.stderr}`,
      mainSha: null,
      monitorBranchExists: false,
      monitorTipSha: null,
    };
  }

  const monFetch = git(repoRoot, ['fetch', 'origin', MONITOR_BRANCH]);
  let monitorBranchExists = false;
  let monitorTipSha = null;
  if (monFetch.ok) {
    const monSha = git(repoRoot, ['rev-parse', `origin/${MONITOR_BRANCH}`]);
    if (monSha.ok) {
      monitorBranchExists = true;
      monitorTipSha = monSha.stdout;
    }
  } else {
    const ls = git(repoRoot, ['ls-remote', '--heads', 'origin', MONITOR_BRANCH]);
    if (!ls.ok) {
      return {
        ok: false,
        error: `Unable to determine whether ${MONITOR_BRANCH} exists: ${ls.stderr || monFetch.stderr}`,
        mainSha: mainSha.stdout,
        monitorBranchExists: false,
        monitorTipSha: null,
      };
    }
    if (ls.stdout) {
      return {
        ok: false,
        error: `git fetch origin ${MONITOR_BRANCH} failed but branch exists: ${monFetch.stderr || monFetch.stdout}`,
        mainSha: mainSha.stdout,
        monitorBranchExists: true,
        monitorTipSha: null,
      };
    }
  }

  return {
    ok: true,
    error: null,
    mainSha: mainSha.stdout,
    monitorBranchExists,
    monitorTipSha,
  };
}

/**
 * Commits on monitor tip that are not reachable from origin/main (ancestry hint only).
 * @param {string} repoRoot
 */
export function listPendingCommitShas(repoRoot) {
  if (!remoteRefExists(repoRoot, `origin/${MONITOR_BRANCH}`)) {
    return { ok: true, shas: [] };
  }
  const r = git(repoRoot, [
    'rev-list',
    `origin/${DEFAULT_BRANCH}..origin/${MONITOR_BRANCH}`,
  ]);
  if (!r.ok) {
    return { ok: false, error: r.stderr || r.stdout, shas: [] };
  }
  const shas = r.stdout ? r.stdout.split(/\n+/).filter(Boolean) : [];
  return { ok: true, shas };
}

function remoteRefExists(repoRoot, ref) {
  return git(repoRoot, ['rev-parse', '--verify', ref]).ok;
}

/**
 * Diff monitoring paths (state/ + artifacts/frontend/) between main and monitor tips.
 * @param {string} repoRoot
 * @returns {{ ok: boolean, paths: string[], error?: string }}
 */
export function diffMonitoringPaths(repoRoot) {
  if (!remoteRefExists(repoRoot, `origin/${MONITOR_BRANCH}`)) {
    return { ok: true, paths: [] };
  }
  const r = git(repoRoot, [
    'diff',
    '--name-only',
    `origin/${DEFAULT_BRANCH}`,
    `origin/${MONITOR_BRANCH}`,
    '--',
    'state',
    'artifacts/frontend',
  ]);
  if (!r.ok) {
    return { ok: false, paths: [], error: r.stderr || r.stdout };
  }
  const paths = r.stdout ? r.stdout.split(/\n+/).filter(Boolean) : [];
  return { ok: true, paths };
}

/**
 * Read state/last-known-frontend.json from a git treeish.
 * @param {string} repoRoot
 * @param {string} treeish
 */
export async function readStateFromTreeish(repoRoot, treeish) {
  const r = git(repoRoot, ['show', `${treeish}:state/last-known-frontend.json`]);
  if (!r.ok) return null;
  try {
    return JSON.parse(r.stdout);
  } catch {
    return null;
  }
}

/**
 * Collect unique pending observations using observation state as primary authority.
 * Ancestry is only used to list intermediates when the tip truly differs from main.
 *
 * @param {string} repoRoot
 */
export async function collectPendingObservations(repoRoot) {
  const mainState = await readStateFromTreeish(repoRoot, `origin/${DEFAULT_BRANCH}`);
  const mainObservationId = mainState?.observationId ?? null;

  if (!remoteRefExists(repoRoot, `origin/${MONITOR_BRANCH}`)) {
    return {
      ok: true,
      pending: [],
      assessmentInputs: {
        mainObservationId,
        monitorTipObservationId: null,
        monitoringPathDiffs: [],
        commitsAheadOfMain: 0,
      },
    };
  }

  const monitorState = await readStateFromTreeish(
    repoRoot,
    `origin/${MONITOR_BRANCH}`,
  );
  const monitorTipObservationId = monitorState?.observationId ?? null;

  const pathDiff = diffMonitoringPaths(repoRoot);
  if (!pathDiff.ok) {
    return { ok: false, error: pathDiff.error, pending: [], assessmentInputs: null };
  }

  const listed = listPendingCommitShas(repoRoot);
  if (!listed.ok) {
    return { ok: false, error: listed.error, pending: [], assessmentInputs: null };
  }

  const assessmentInputs = {
    mainObservationId,
    monitorTipObservationId,
    monitoringPathDiffs: pathDiff.paths,
    commitsAheadOfMain: listed.shas.length,
  };

  // Same tip observation + no monitoring path diffs ⇒ fully landed (squash/rebase safe).
  if (
    mainObservationId &&
    monitorTipObservationId &&
    mainObservationId === monitorTipObservationId &&
    pathDiff.paths.length === 0
  ) {
    return { ok: true, pending: [], assessmentInputs };
  }

  /** @type {object[]} */
  const pending = [];
  let lastId = mainObservationId;

  if (listed.shas.length) {
    const chronological = [...listed.shas].reverse();
    for (const sha of chronological) {
      const st = await readStateFromTreeish(repoRoot, sha);
      if (!st?.observationId) continue;
      if (st.observationId === lastId) continue;
      if (st.observationId === mainObservationId) {
        lastId = st.observationId;
        continue;
      }
      pending.push({
        observationId: st.observationId,
        previousObservationId: st.previousObservationId ?? null,
        buildId: st.buildId,
        observedAt: st.observedAt,
        artifactDir: st.artifactDir,
        artifacts: st.artifacts,
        layout: st.layout,
        commitSha: sha,
      });
      lastId = st.observationId;
    }
  }

  if (
    monitorTipObservationId &&
    monitorTipObservationId !== mainObservationId &&
    !pending.some((p) => p.observationId === monitorTipObservationId)
  ) {
    pending.push({
      observationId: monitorTipObservationId,
      previousObservationId: monitorState?.previousObservationId ?? null,
      buildId: monitorState?.buildId,
      observedAt: monitorState?.observedAt,
      artifactDir: monitorState?.artifactDir,
      artifacts: monitorState?.artifacts,
      layout: monitorState?.layout,
      commitSha: null,
    });
  }

  return { ok: true, pending, assessmentInputs };
}

/**
 * Merge origin/main into the current branch (monitoring).
 * @param {string} repoRoot
 */
export function mergeOriginMain(repoRoot) {
  const r = git(repoRoot, ['merge', '--no-edit', `origin/${DEFAULT_BRANCH}`]);
  if (r.ok) {
    return { ok: true, conflict: false, conflictPaths: [], error: null };
  }
  const unmerged = git(repoRoot, ['diff', '--name-only', '--diff-filter=U']);
  const conflictPaths = unmerged.ok && unmerged.stdout
    ? unmerged.stdout.split(/\n+/).filter(Boolean)
    : [];
  git(repoRoot, ['merge', '--abort']);
  return {
    ok: false,
    conflict: conflictPaths.length > 0,
    conflictPaths,
    error: r.stderr || r.stdout || 'merge failed',
  };
}

/**
 * Checkout a branch, creating local tracking if needed.
 * @param {string} repoRoot
 * @param {string} branch
 * @param {{ createFrom?: string }} [opts]
 */
export function checkoutBranch(repoRoot, branch, opts = {}) {
  if (opts.createFrom) {
    const r = git(repoRoot, ['checkout', '-B', branch, opts.createFrom]);
    return { ok: r.ok, error: r.ok ? null : r.stderr || r.stdout };
  }
  if (git(repoRoot, ['rev-parse', '--verify', branch]).ok) {
    const r = git(repoRoot, ['checkout', branch]);
    return { ok: r.ok, error: r.ok ? null : r.stderr || r.stdout };
  }
  if (git(repoRoot, ['rev-parse', '--verify', `origin/${branch}`]).ok) {
    const r = git(repoRoot, ['checkout', '-B', branch, `origin/${branch}`]);
    return { ok: r.ok, error: r.ok ? null : r.stderr || r.stdout };
  }
  return { ok: false, error: `Branch ${branch} not found locally or on origin` };
}

/**
 * Fast-forward-only push of the monitoring branch. Never force-pushes observation commits.
 * @param {string} repoRoot
 * @returns {{ ok: boolean, rejected: boolean, error: string|null }}
 */
export function pushMonitorBranchFfOnly(repoRoot) {
  const push = git(repoRoot, ['push', 'origin', `HEAD:${MONITOR_BRANCH}`]);
  if (push.ok) {
    return { ok: true, rejected: false, error: null };
  }
  const err = push.stderr || push.stdout || 'push failed';
  const rejected = /\[rejected\]|non-fast-forward|fetch first|failed to push/i.test(err);
  return { ok: false, rejected, error: err };
}

/**
 * Reset local monitoring branch tip to origin/main after state proof of no unique pending.
 * Uses force update of local ref only; remote update should use --force-with-lease when pushing.
 * @param {string} repoRoot
 */
export function resetLocalMonitorFromMain(repoRoot) {
  return git(repoRoot, ['branch', '-f', MONITOR_BRANCH, `origin/${DEFAULT_BRANCH}`]);
}

/**
 * Read working-tree state file.
 * @param {string} repoRoot
 */
export async function readWorkingState(repoRoot) {
  try {
    const raw = await readFile(path.join(repoRoot, 'state/last-known-frontend.json'), 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
