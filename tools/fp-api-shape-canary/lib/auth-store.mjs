/**
 * Durable auth seed for fresh weekly VMs.
 *
 * Local working copy: state/api-shape-auth.local.json (gitignored).
 * Cross-run seed: FP_API_SHAPE_AUTH_STORE (Project store secrets path).
 *
 * Never commit either file. Tokens + DPoP private JWKs only.
 */

import { access, copyFile, mkdir, constants } from 'node:fs/promises';
import path from 'node:path';

/**
 * If the local auth file is missing but FP_API_SHAPE_AUTH_STORE exists, copy store → local.
 * @param {{
 *   authFile: string,
 *   storePath?: string|null,
 *   env?: NodeJS.ProcessEnv,
 * }} opts
 */
export async function restoreAuthFromStore(opts) {
  const env = opts.env || process.env;
  const store = opts.storePath || env.FP_API_SHAPE_AUTH_STORE || null;
  const authFile = opts.authFile;
  if (!store || !authFile) {
    return { restored: false, reason: 'no-store' };
  }

  try {
    await access(authFile, constants.R_OK);
    return { restored: false, reason: 'local-exists', authFile, store };
  } catch {
    // missing — try store
  }

  try {
    await access(store, constants.R_OK);
  } catch {
    return { restored: false, reason: 'store-missing', authFile, store };
  }

  await mkdir(path.dirname(authFile), { recursive: true });
  await copyFile(store, authFile);
  return { restored: true, reason: 'copied', authFile, store };
}

/**
 * After device-login / refresh, mirror local auth → FP_API_SHAPE_AUTH_STORE when set.
 * @param {{
 *   authFile: string,
 *   storePath?: string|null,
 *   env?: NodeJS.ProcessEnv,
 * }} opts
 */
export async function persistAuthToStore(opts) {
  const env = opts.env || process.env;
  const store = opts.storePath || env.FP_API_SHAPE_AUTH_STORE || null;
  const authFile = opts.authFile;
  if (!store || !authFile) {
    return { persisted: false, reason: 'no-store' };
  }

  try {
    await access(authFile, constants.R_OK);
  } catch {
    return { persisted: false, reason: 'local-missing', authFile, store };
  }

  await mkdir(path.dirname(store), { recursive: true });
  await copyFile(authFile, store);
  return { persisted: true, reason: 'copied', authFile, store };
}
