/**
 * Pack embed fields into Discord-safe embed(s) / follow-up payloads.
 * Never silently drops or ellipsizes field JSON — overflow becomes extra
 * embeds or continuation webhook messages with an explicit note.
 */

import {
  COLOR_SHAPE_DRIFT,
  DEFAULT_USERNAME,
  MAX_EMBED_FIELDS,
  MAX_EMBED_TOTAL_CHARS,
  MAX_EMBEDS_PER_MESSAGE,
} from './constants.mjs';
import { truncDescription, truncTitle } from './truncate.mjs';

/**
 * Estimate Discord embed character usage (title + description + fields + footer).
 * @param {object} embed
 */
export function estimateEmbedChars(embed) {
  let n = 0;
  n += (embed.title || '').length;
  n += (embed.description || '').length;
  n += (embed.footer?.text || '').length;
  for (const f of embed.fields || []) {
    n += (f.name || '').length + (f.value || '').length;
  }
  return n;
}

/**
 * Pack a list of fields into one or more embeds under Discord limits.
 * @param {{
 *   title: string,
 *   description: string,
 *   color?: number,
 *   fields: { name: string, value: string, inline?: boolean }[],
 *   footer?: { text: string },
 *   timestamp?: string,
 *   url?: string|null,
 *   username?: string,
 * }} input
 * @returns {{ payloads: object[] }}
 */
export function packShapePayloads(input) {
  const username = input.username || DEFAULT_USERNAME;
  const baseMeta = {
    color: input.color ?? COLOR_SHAPE_DRIFT,
    timestamp: input.timestamp || new Date().toISOString(),
  };
  if (input.url) baseMeta.url = input.url;

  /** @type {{ name: string, value: string, inline?: boolean }[][]} */
  const fieldGroups = [];
  /** @type {{ name: string, value: string, inline?: boolean }[]} */
  let current = [];
  let currentChars =
    (input.title || '').length +
    (input.description || '').length +
    (input.footer?.text || '').length;

  const pushGroup = () => {
    if (current.length) {
      fieldGroups.push(current);
      current = [];
    }
  };

  for (const field of input.fields || []) {
    const add = (field.name || '').length + (field.value || '').length;
    const wouldExceedFields = current.length >= MAX_EMBED_FIELDS;
    const wouldExceedChars = currentChars + add > MAX_EMBED_TOTAL_CHARS;
    if (current.length && (wouldExceedFields || wouldExceedChars)) {
      pushGroup();
      // Continuation embeds only count field chars (+ small continued title).
      currentChars = 40;
    }
    current.push(field);
    currentChars += add;
  }
  pushGroup();

  if (!fieldGroups.length) {
    fieldGroups.push([]);
  }

  /** @type {object[]} */
  const embeds = [];
  for (let i = 0; i < fieldGroups.length; i++) {
    const isFirst = i === 0;
    const isLast = i === fieldGroups.length - 1;
    /** @type {object} */
    const embed = {
      ...baseMeta,
      title: isFirst
        ? truncTitle(input.title)
        : truncTitle(`${input.title} (continued ${i + 1}/${fieldGroups.length})`),
      fields: fieldGroups[i],
    };
    if (isFirst) {
      embed.description = truncDescription(input.description);
    } else {
      embed.description = truncDescription('_Continued — full sanitized sample (not truncated)._');
    }
    if (isLast && input.footer) {
      embed.footer = input.footer;
    }
    embeds.push(embed);
  }

  // Split embeds across webhook messages if > MAX_EMBEDS_PER_MESSAGE.
  /** @type {object[]} */
  const payloads = [];
  for (let i = 0; i < embeds.length; i += MAX_EMBEDS_PER_MESSAGE) {
    const slice = embeds.slice(i, i + MAX_EMBEDS_PER_MESSAGE);
    /** @type {object} */
    const payload = { username, embeds: slice };
    if (i > 0) {
      payload.content = truncDescription(
        `_FloatplaneAPI Watch — continued sanitized sample (${i / MAX_EMBEDS_PER_MESSAGE + 1})_`,
      );
    }
    payloads.push(payload);
  }

  return { payloads };
}
