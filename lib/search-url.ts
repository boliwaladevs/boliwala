export type UrlParams = Record<string, string | string[] | undefined>

/**
 * Builds a URL from the current search params plus overrides. `null` in an
 * override deletes that key; anything else replaces it. Keys not mentioned
 * in overrides are carried over unchanged.
 */
export function buildSearchHref(
  base: string,
  current: UrlParams,
  overrides: Record<string, string | string[] | null>,
): string {
  const merged: Record<string, string | string[] | null | undefined> = { ...current, ...overrides }
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(merged)) {
    if (value === null || value === undefined) continue
    if (Array.isArray(value)) {
      for (const v of value) if (v) params.append(key, v)
    } else if (value) {
      params.set(key, value)
    }
  }

  const qs = params.toString()
  return qs ? `${base}?${qs}` : base
}

/** A link that changes a filter always resets pagination back to page 1. */
export function filterHref(
  base: string,
  current: UrlParams,
  overrides: Record<string, string | string[] | null>,
): string {
  return buildSearchHref(base, current, { ...overrides, page: null })
}

export function toggleArrayValue(current: UrlParams, key: string, value: string): string[] {
  const existing = current[key]
  const arr = Array.isArray(existing) ? existing : existing ? [existing] : []
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]
}
