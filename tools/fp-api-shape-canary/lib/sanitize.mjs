/**
 * Sanitize live API JSON for committed OpenAPI examples.
 *
 * Evidence-only: preserves observed structure/keys/types; redacts PII and
 * content strings. Never invents fields that were not present in the input.
 */

/** Keys whose string values are always redacted (case-sensitive leaf names). */
const SENSITIVE_STRING_KEYS = new Set([
  'email',
  'username',
  'displayName',
  'title',
  'text',
  'textMarkdown',
  'description',
  'about',
  'paymentID',
  'paymentId',
  'name',
  'label',
]);

/** Keys that look like opaque identifiers — stub to stable placeholders. */
const ID_KEYS = new Set([
  'id',
  'guid',
  'creator',
  'creatorId',
  'channel',
  'user',
  'userId',
  'blogPost',
  'blogPostId',
  'primaryBlogPost',
  'paymentID',
  'paymentId',
  'owner',
]);

const PLACEHOLDERS = Object.freeze({
  email: 'user@example.invalid',
  username: 'example_user',
  displayName: 'Example User',
  title: 'Example title (redacted)',
  text: 'Example post body (redacted).',
  textMarkdown: 'Example post body (**redacted**).',
  description: 'Example description (redacted).',
  about: 'Example about text (redacted).',
  paymentID: 'pay_example_redacted',
  paymentId: 'pay_example_redacted',
  name: 'example',
  label: 'example',
  path: 'https://cdn.example.invalid/redacted.jpg',
  string: 'redacted',
  id: 'example-id-redacted',
});

/**
 * @param {string} key
 * @param {string} value
 * @param {string[]} pathParts
 */
function redactString(key, value, pathParts) {
  if (key === 'path' || key === 'src' || /url$/i.test(key) || key === 'href') {
    if (/^https?:\/\//i.test(value) || value.startsWith('/')) {
      return PLACEHOLDERS.path;
    }
  }
  if (SENSITIVE_STRING_KEYS.has(key)) {
    return PLACEHOLDERS[key] || PLACEHOLDERS.string;
  }
  // creator/channel title-like nested strings already covered; catch id-ish values
  if (ID_KEYS.has(key) || /Id$/.test(key) || key === 'guid') {
    if (/^[a-f0-9]{24}$/i.test(value)) return '000000000000000000000000';
    if (/^[0-9a-f-]{36}$/i.test(value)) return '00000000-0000-4000-8000-000000000000';
    if (value.length >= 8) return PLACEHOLDERS.id;
  }
  // Array of blog post ids, badge ids, moderator creator ids, attachment order, etc.
  if (
    pathParts.some((p) =>
      ['blogPosts', 'attachmentOrder', 'creators', 'badges', 'moderatorCreators'].includes(p),
    )
  ) {
    if (/^[a-f0-9]{24}$/i.test(value)) return '000000000000000000000000';
    if (value.length >= 8) return PLACEHOLDERS.id;
  }
  // Default: keep short enums / type tags; redact longer free text
  if (value.length > 48) return PLACEHOLDERS.string;
  return value;
}

/**
 * Deep-sanitize a JSON value. Returns a new structure; does not mutate input.
 * @param {unknown} value
 * @param {{ key?: string, path?: string[] }} [ctx]
 * @returns {unknown}
 */
export function sanitizeExampleValue(value, ctx = {}) {
  const key = ctx.key || '';
  const pathParts = ctx.path || [];

  if (value === null) return null;
  if (typeof value === 'boolean' || typeof value === 'number') return value;
  if (typeof value === 'string') return redactString(key, value, pathParts);

  if (Array.isArray(value)) {
    return value.map((item, i) =>
      sanitizeExampleValue(item, {
        key: Array.isArray(item) || (item && typeof item === 'object') ? key : key,
        path: [...pathParts, String(i)],
      }),
    );
  }

  if (typeof value === 'object') {
    /** @type {Record<string, unknown>} */
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      // creator on subscriptions is often a bare string id
      if (
        (k === 'creator' || k === 'channel' || k === 'primaryBlogPost') &&
        typeof v === 'string'
      ) {
        out[k] = redactString(k, v, [...pathParts, k]);
        continue;
      }
      out[k] = sanitizeExampleValue(v, { key: k, path: [...pathParts, k] });
    }
    return out;
  }

  // Drop unexpected types rather than inventing
  return null;
}

/**
 * Sanitize a full response body for one endpoint.
 * For list responses, keep at most `maxItems` elements.
 * @param {string} endpointId
 * @param {unknown} body
 * @param {{ maxItems?: number }} [opts]
 */
export function sanitizeEndpointExample(endpointId, body, opts = {}) {
  const maxItems = opts.maxItems ?? 1;
  let value = body;
  if (Array.isArray(value) && value.length > maxItems) {
    value = value.slice(0, maxItems);
  }
  return {
    endpointId,
    sanitizedAt: new Date().toISOString(),
    redaction: 'titles/text/markdown/email/username/displayName/paymentIds/cdn-paths/ids',
    value: sanitizeExampleValue(value),
  };
}

/**
 * Map endpoint id → OpenAPI path + whether response is a list example.
 */
export const EXAMPLE_OPENAPI_TARGETS = Object.freeze({
  'user-self': { path: '/api/v3/user/self', method: 'get', list: false },
  'user-subscriptions': { path: '/api/v3/user/subscriptions', method: 'get', list: true },
  'content-creator': { path: '/api/v3/content/creator', method: 'get', list: true },
  'content-post': { path: '/api/v3/content/post', method: 'get', list: false },
  'content-video': { path: '/api/v3/content/video', method: 'get', list: false },
});
