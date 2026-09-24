import { createHash } from 'node:crypto';

/** @param {Buffer|string} data */
export function sha256(data) {
  return createHash('sha256').update(data).digest('hex');
}
