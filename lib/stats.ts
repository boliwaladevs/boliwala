/**
 * Client-safe half of the site statistics.
 *
 * The shape and the formatter live here rather than in lib/data/stats.ts
 * because hero.tsx, auth-view.tsx and about-view.tsx are all client
 * components: importing anything from the server-only module — even a pure
 * function or a type — pulls `server-only` into the browser bundle and fails
 * the build. lib/data/stats.ts does the fetching and re-exports these.
 */

export interface SiteStats {
  liveAuctions: number
  cities: number
  banks: number
  /**
   * Mean discount of reserve price against estimated market value, across live
   * listings that carry both figures. Null when too few listings have an
   * estimate for the mean to mean anything.
   *
   * Read it precisely: this is how far below market the *reserve prices we
   * list* sit. It is NOT "what our buyers saved", which would need sale prices
   * we do not hold. The two must not be conflated in copy.
   */
  avgDiscountPct: number | null
}

/**
 * Rounds up to a "N+" style figure once there is enough inventory for it to
 * read as a claim rather than a count.
 */
export function displayCount(value: number): string {
  if (value >= 1000) return `${(Math.floor(value / 1000) * 1000).toLocaleString("en-IN")}+`
  if (value >= 100) return `${Math.floor(value / 100) * 100}+`
  // Below a hundred the exact figure is both more credible and more
  // informative — "12" beats "10+" when there really are twelve.
  return String(value)
}
