/**
 * Discord/Fluxer timestamp helpers for alert footers.
 * Prefer Discord relative/local tags so clients show viewer-local time.
 */

/**
 * Parse capture id / ISO / Date into epoch seconds (UTC).
 * Capture ids look like `2026-10-26T03-01-16-836Z`.
 * @param {string|Date|number|null|undefined} value
 * @returns {number|null} unix seconds
 */
export function toUnixSeconds(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 1e12 ? Math.floor(value / 1000) : Math.floor(value);
  }
  if (value instanceof Date) {
    const ms = value.getTime();
    return Number.isFinite(ms) ? Math.floor(ms / 1000) : null;
  }
  const s = String(value).trim();
  if (!s) return null;

  // ISO-ish already
  let ms = Date.parse(s);
  if (Number.isFinite(ms)) return Math.floor(ms / 1000);

  // Capture id: 2026-10-26T03-01-16-836Z → 2026-10-26T03:01:16.836Z
  const m = s.match(
    /^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})(?:-(\d{1,3}))?Z$/i,
  );
  if (m) {
    const frac = (m[5] || '0').padEnd(3, '0').slice(0, 3);
    ms = Date.parse(`${m[1]}T${m[2]}:${m[3]}:${m[4]}.${frac}Z`);
    if (Number.isFinite(ms)) return Math.floor(ms / 1000);
  }
  return null;
}

/**
 * Discord markdown timestamps for footer/description.
 * Example: `<t:1698289260:R> · <t:1698289260:f>`
 * @param {string|Date|number|null|undefined} value
 * @returns {string}
 */
export function formatDiscordTimestampFooter(value) {
  const unix = toUnixSeconds(value);
  if (unix == null) return '';
  return `<t:${unix}:R> · <t:${unix}:f>`;
}

/**
 * ISO timestamp for embed.timestamp (Discord native relative clock).
 * @param {string|Date|number|null|undefined} value
 * @returns {string}
 */
export function toEmbedTimestampIso(value) {
  const unix = toUnixSeconds(value);
  if (unix == null) return new Date().toISOString();
  return new Date(unix * 1000).toISOString();
}
