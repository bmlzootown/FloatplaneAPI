/**
 * Timestamp helpers for Fluxer alert footers.
 * Fluxer does not render Discord `<t:…>` tokens — use plain absolute ISO UTC.
 */

/**
 * Parse capture id / ISO / Date into epoch milliseconds (UTC).
 * Capture ids look like `2026-10-26T03-01-16-836Z`.
 * @param {string|Date|number|null|undefined} value
 * @returns {number|null}
 */
export function toUnixMs(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value < 1e12 ? Math.floor(value * 1000) : Math.floor(value);
  }
  if (value instanceof Date) {
    const ms = value.getTime();
    return Number.isFinite(ms) ? ms : null;
  }
  const s = String(value).trim();
  if (!s) return null;

  let ms = Date.parse(s);
  if (Number.isFinite(ms)) return ms;

  // Capture id: 2026-10-26T03-01-16-836Z → 2026-10-26T03:01:16.836Z
  const m = s.match(
    /^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})(?:-(\d{1,3}))?Z$/i,
  );
  if (m) {
    const frac = (m[5] || '0').padEnd(3, '0').slice(0, 3);
    ms = Date.parse(`${m[1]}T${m[2]}:${m[3]}:${m[4]}.${frac}Z`);
    if (Number.isFinite(ms)) return ms;
  }
  return null;
}

/**
 * @param {string|Date|number|null|undefined} value
 * @returns {number|null} unix seconds
 */
export function toUnixSeconds(value) {
  const ms = toUnixMs(value);
  return ms == null ? null : Math.floor(ms / 1000);
}

/**
 * Plain absolute UTC timestamp for Fluxer footers (no Discord `<t:>` tags).
 * Example: `2026-10-26 03:01:16 UTC`
 * @param {string|Date|number|null|undefined} value
 * @returns {string}
 */
export function formatAbsoluteTimestampFooter(value) {
  const ms = toUnixMs(value);
  if (ms == null) return '';
  const iso = new Date(ms).toISOString(); // 2026-10-26T03:01:16.836Z
  const m = iso.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})/);
  if (!m) return iso;
  return `${m[1]} ${m[2]} UTC`;
}

/** @deprecated use formatAbsoluteTimestampFooter — Fluxer does not render Discord tags */
export function formatDiscordTimestampFooter(value) {
  return formatAbsoluteTimestampFooter(value);
}

/**
 * ISO timestamp for embed.timestamp.
 * @param {string|Date|number|null|undefined} value
 * @returns {string}
 */
export function toEmbedTimestampIso(value) {
  const ms = toUnixMs(value);
  if (ms == null) return new Date().toISOString();
  return new Date(ms).toISOString();
}
