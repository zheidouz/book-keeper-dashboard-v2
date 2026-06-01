/**
 * Parse a numeric route parameter and return null if invalid.
 * Prevents NaN from silently matching nothing in DB queries.
 */
export function parseIdParam(raw: string | string[] | undefined): number | null {
  if (!raw) return null;
  const val = Array.isArray(raw) ? raw[0] : raw;
  const id = parseInt(val, 10);
  if (isNaN(id) || id <= 0) return null;
  return id;
}
