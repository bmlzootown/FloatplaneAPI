/**
 * Build a redacted field-tree from a JSON value (keys + JSON types + nullability).
 * Does not retain string/number contents — only structure.
 */

/**
 * @param {unknown} value
 * @returns {'null'|'string'|'number'|'boolean'|'array'|'object'|'unknown'}
 */
export function jsonTypeOf(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  const t = typeof value;
  if (t === 'string' || t === 'number' || t === 'boolean' || t === 'object') return t;
  return 'unknown';
}

/**
 * @param {unknown} value
 * @returns {object}
 */
export function buildFieldTree(value) {
  const type = jsonTypeOf(value);
  if (type === 'null' || type === 'string' || type === 'number' || type === 'boolean') {
    return { type };
  }
  if (type === 'array') {
    const arr = /** @type {unknown[]} */ (value);
    if (arr.length === 0) {
      return { type: 'array', items: { type: 'unknown' }, lengthObserved: 0 };
    }
    let items = buildFieldTree(arr[0]);
    for (let i = 1; i < arr.length; i++) {
      items = mergeFieldTrees(items, buildFieldTree(arr[i]));
    }
    return { type: 'array', items, lengthObserved: arr.length };
  }
  if (type === 'object') {
    const obj = /** @type {Record<string, unknown>} */ (value);
    /** @type {Record<string, object>} */
    const properties = {};
    for (const key of Object.keys(obj).sort()) {
      properties[key] = buildFieldTree(obj[key]);
    }
    return { type: 'object', properties };
  }
  return { type: 'unknown' };
}

/**
 * Merge two field trees (e.g. array items or multi-sample union).
 * @param {object} a
 * @param {object} b
 * @returns {object}
 */
export function mergeFieldTrees(a, b) {
  if (!a) return b;
  if (!b) return a;
  const typesA = normalizeTypes(a.type);
  const typesB = normalizeTypes(b.type);
  const types = unionSorted([...typesA, ...typesB]);

  if (types.includes('object') && (a.properties || b.properties)) {
    const keys = unionSorted([
      ...Object.keys(a.properties || {}),
      ...Object.keys(b.properties || {}),
    ]);
    /** @type {Record<string, object>} */
    const properties = {};
    for (const key of keys) {
      const pa = a.properties?.[key];
      const pb = b.properties?.[key];
      if (pa && pb) properties[key] = mergeFieldTrees(pa, pb);
      else if (pa) properties[key] = { ...pa, optionallyAbsent: true };
      else properties[key] = { ...pb, optionallyAbsent: true };
    }
    const out = { type: types.length === 1 ? types[0] : types, properties };
    if (types.includes('array') || a.items || b.items) {
      out.items = mergeFieldTrees(a.items || { type: 'unknown' }, b.items || { type: 'unknown' });
    }
    return out;
  }

  if (types.includes('array') || a.items || b.items) {
    return {
      type: types.length === 1 ? types[0] : types,
      items: mergeFieldTrees(a.items || { type: 'unknown' }, b.items || { type: 'unknown' }),
    };
  }

  return { type: types.length === 1 ? types[0] : types };
}

/**
 * Flatten field tree to path → type descriptor map.
 * Paths use `.` for objects and `[]` for array items.
 * @param {object} tree
 * @param {string} [prefix]
 * @returns {Record<string, { type: string|string[], optionallyAbsent?: boolean }>}
 */
export function flattenFieldTree(tree, prefix = '') {
  /** @type {Record<string, { type: string|string[], optionallyAbsent?: boolean }>} */
  const out = {};
  const path = prefix || '$';
  out[path] = {
    type: tree.type,
    ...(tree.optionallyAbsent ? { optionallyAbsent: true } : {}),
  };

  if (tree.type === 'object' || (Array.isArray(tree.type) && tree.type.includes('object'))) {
    for (const [key, child] of Object.entries(tree.properties || {})) {
      const childPath = prefix ? `${prefix}.${key}` : key;
      Object.assign(out, flattenFieldTree(child, childPath));
    }
  }
  if (tree.items) {
    const childPath = prefix ? `${prefix}[]` : '$[]';
    Object.assign(out, flattenFieldTree(tree.items, childPath));
  }
  return out;
}

/**
 * @param {string|string[]} type
 * @returns {string[]}
 */
function normalizeTypes(type) {
  if (Array.isArray(type)) return [...type];
  return [type];
}

/**
 * @param {string[]} values
 * @returns {string[]}
 */
function unionSorted(values) {
  return [...new Set(values)].sort();
}

/**
 * Serialize types for stable comparison.
 * @param {string|string[]} type
 */
export function typeKey(type) {
  return Array.isArray(type) ? type.slice().sort().join('|') : String(type);
}
