/**
 * Extra sanitization for **public Discord** webhook payloads only.
 * Fluxer (private) keeps the normal sanitizeSample / canary redaction unless
 * `--test` / `publicSanitize` previews this same pass on Fluxer.
 *
 * Never log webhook URLs or raw account values beyond redacted markers.
 */

import { WEBHOOK_TARGET_DISCORD } from './constants.mjs';

/** Marker for redacted scalars in Discord-facing JSON. */
export const DISCORD_REDACTED = '[redacted]';
export const DISCORD_REDACTED_ID = '[redacted-id]';

/**
 * Always censored on Discord (and on Fluxer when publicSanitize / --test).
 * Includes identifiers and media paths that can fingerprint accounts or CDN objects.
 */
const DISCORD_ALWAYS_REDACT_KEYS = new Set([
  // Account / billing
  'username',
  'displayname',
  'profileimage',
  'email',
  'badges',
  'ismoderator',
  'isglobalmoderator',
  'moderatorcreators',
  'creators',
  'startdate',
  'enddate',
  'paymentid',
  'paymentcancelled',
  'price',
  'priceyearly',
  'phone',
  'ssn',
  'ip',
  // Identifiers + asset paths (public Discord)
  'id',
  'guid',
  'path',
  'owner',
]);

/** Sibling keys that mark a subscription (or plan) object. */
const SUBSCRIPTION_HINT_KEYS = new Set([
  'startdate',
  'enddate',
  'plan',
  'interval',
  'paymentid',
  'paymentcancelled',
  'price',
  'priceyearly',
  'currency',
]);

const OBJECT_ID_RE = /^[a-f0-9]{24}$/i;
/** Short Floatplane content ids (alphanumeric, typically 10 chars) still fingerprint posts. */
const CONTENT_ID_RE = /^[A-Za-z0-9_-]{6,32}$/;

/**
 * @param {string} key
 */
export function isDiscordPublicSensitiveKey(key) {
  const k = String(key).toLowerCase();
  if (DISCORD_ALWAYS_REDACT_KEYS.has(k)) return true;
  if (
    k.includes('token') ||
    k.includes('secret') ||
    k.includes('password') ||
    k.includes('authorization') ||
    k.includes('cookie') ||
    k.includes('refresh') ||
    k.includes('dpop') ||
    k.endsWith('email')
  ) {
    return true;
  }
  return false;
}

function objectHasHint(keys, hintSet) {
  return keys.some((k) => hintSet.has(String(k).toLowerCase()));
}

function redactIdLike(v) {
  if (v == null) return DISCORD_REDACTED_ID;
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
    return DISCORD_REDACTED_ID;
  }
  if (Array.isArray(v)) return [DISCORD_REDACTED_ID];
  return { redacted: true };
}

function redactDiscordShape(v) {
  if (v == null) return DISCORD_REDACTED;
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
    return DISCORD_REDACTED;
  }
  if (Array.isArray(v)) return [DISCORD_REDACTED];
  return { redacted: true };
}

/**
 * Deep-sanitize a JSON value for public Discord.
 * Keeps human titles/types; censors ids, guids, paths, owners, account + billing fields.
 *
 * @param {unknown} value
 * @returns {unknown}
 */
export function sanitizeValueForDiscordPublic(value) {
  if (value == null) return null;
  if (Array.isArray(value)) {
    return value.map((v) => sanitizeValueForDiscordPublic(v));
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value);
    const looksLikeSubscription = objectHasHint(keys, SUBSCRIPTION_HINT_KEYS);
    /** @type {Record<string, unknown>} */
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      const kl = String(k).toLowerCase();
      if (kl === 'id' || kl === 'guid' || kl === 'owner') {
        out[k] = redactIdLike(v);
        continue;
      }
      if (kl === 'path') {
        out[k] = redactDiscordShape(v);
        continue;
      }
      if (isDiscordPublicSensitiveKey(k)) {
        out[k] = redactDiscordShape(v);
        continue;
      }
      // Bare creator ObjectId (subscription row or channel.creator string)
      if (
        kl === 'creator' &&
        typeof v === 'string' &&
        (OBJECT_ID_RE.test(v) || CONTENT_ID_RE.test(v))
      ) {
        out[k] = DISCORD_REDACTED_ID;
        continue;
      }
      // Subscription plan.creator already covered; keep nested creator objects
      // but their id/owner/path children are redacted recursively.
      if (looksLikeSubscription && kl === 'creator' && typeof v === 'string') {
        out[k] = DISCORD_REDACTED_ID;
        continue;
      }
      out[k] = sanitizeValueForDiscordPublic(v);
    }
    return out;
  }
  if (typeof value === 'string') {
    if (looksLikeEmail(value)) return DISCORD_REDACTED;
    if (looksLikeToken(value)) return DISCORD_REDACTED;
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  return String(value);
}

function looksLikeToken(s) {
  if (s.startsWith('eyJ')) return true;
  if (/^[A-Za-z0-9_-]{40,}$/.test(s)) return true;
  return false;
}

function looksLikeEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

/**
 * Rewrite ```json … ``` fenced blocks in Discord message text with
 * Discord-public-sanitized JSON. Leaves non-JSON fences alone.
 *
 * @param {string} text
 * @returns {string}
 */
export function sanitizeDiscordMarkdownJson(text) {
  if (!text || typeof text !== 'string') return text;
  return text.replace(/```json\n([\s\S]*?)```/g, (full, body) => {
    const raw = String(body);
    const trimmed = raw.trim();
    try {
      const parsed = JSON.parse(trimmed);
      const cleaned = sanitizeValueForDiscordPublic(parsed);
      const pretty = raw.includes('\n');
      const json = pretty
        ? JSON.stringify(cleaned, null, 2)
        : JSON.stringify(cleaned);
      return `\`\`\`json\n${json}\n\`\`\``;
    } catch {
      return full;
    }
  });
}

/**
 * Clone a webhook payload and apply public Discord sanitization
 * to embed descriptions + field values (JSON fences).
 *
 * @param {object} payload
 * @returns {object}
 */
export function sanitizePayloadForDiscordPublic(payload) {
  if (!payload || typeof payload !== 'object') return payload;
  const out = structuredClone(payload);
  if (typeof out.content === 'string') {
    out.content = sanitizeDiscordMarkdownJson(out.content);
  }
  if (Array.isArray(out.embeds)) {
    for (const embed of out.embeds) {
      if (!embed || typeof embed !== 'object') continue;
      if (typeof embed.description === 'string') {
        embed.description = sanitizeDiscordMarkdownJson(embed.description);
      }
      if (Array.isArray(embed.fields)) {
        for (const field of embed.fields) {
          if (!field || typeof field !== 'object') continue;
          if (typeof field.value === 'string') {
            field.value = sanitizeDiscordMarkdownJson(field.value);
          }
        }
      }
    }
  }
  return out;
}

/**
 * @param {string} targetId
 * @param {object} payload
 * @param {{ publicSanitize?: boolean }} [opts]
 * @returns {object}
 */
export function payloadForWebhookTarget(targetId, payload, opts = {}) {
  if (targetId === WEBHOOK_TARGET_DISCORD || opts.publicSanitize) {
    return sanitizePayloadForDiscordPublic(payload);
  }
  return payload;
}
