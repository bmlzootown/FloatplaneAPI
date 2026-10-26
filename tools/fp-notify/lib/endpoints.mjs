/**
 * Map allowlisted shape-canary endpoint ids → REST paths for human alerts.
 * Kept in sync with tools/fp-api-shape-canary/lib/constants.mjs ALLOWLIST.
 */

export const ENDPOINT_PATHS = Object.freeze({
  'user-self': '/api/v3/user/self',
  'user-subscriptions': '/api/v3/user/subscriptions',
  'content-creator': '/api/v3/content/creator',
  'content-creator-unauth': '/api/v3/content/creator',
  'content-post': '/api/v3/content/post',
  'content-video': '/api/v3/content/video',
});

/**
 * @param {string} endpointId
 * @returns {string}
 */
export function endpointPath(endpointId) {
  return ENDPOINT_PATHS[endpointId] || `/api/v3/${String(endpointId || '').replace(/-/g, '/')}`;
}

/**
 * @param {string[]} endpointIds
 * @returns {string} e.g. Observed on: `/api/v3/content/post`
 */
export function formatObservedOn(endpointIds) {
  const paths = [...new Set((endpointIds || []).map(endpointPath).filter(Boolean))];
  if (!paths.length) return 'Observed on: (unknown endpoint)';
  if (paths.length === 1) return `Observed on: \`${paths[0]}\``;
  return `Observed on: ${paths.map((p) => `\`${p}\``).join(', ')}`;
}
