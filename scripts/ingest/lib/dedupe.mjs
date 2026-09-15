// The idempotency key for the ingest pipeline.
//
// One property gets one listing row, no matter how many times it is harvested,
// from how many portals, across how many auction rounds. `dedupeHash` is what
// makes that true, and `4-load.mjs` upserts on it.

import { createHash } from "node:crypto"

/**
 * Tokens that carry no identifying information but are written inconsistently
 * enough to break a naive hash.
 *
 * "Flat No. 402" and "Flat 402" are the same property and must produce the same
 * hash. Everything else is kept — in particular **digits and single letters are
 * never stripped**, because they are exactly what distinguishes A-402 from
 * B-402, and merging two different flats in one building is the worst failure
 * this function can have.
 */
const NOISE = new Set(["no", "nos", "number", "num", "the", "at", "near", "opp", "opposite"])

/**
 * Lowercase, split on anything non-alphanumeric, drop noise tokens, rejoin.
 *
 * Deliberately *not* aggressive. Every extra rule here trades a missed
 * duplicate for a risked false merge, and a false merge silently destroys a
 * real listing.
 */
export function normalizeForHash(text) {
  if (text === null || text === undefined) return ""
  return String(text)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 0 && !NOISE.has(t))
    .join("")
}

/**
 * sha256( lender | addressLine | pincode ).
 *
 * ---------------------------------------------------------------------------
 * Two deliberate exclusions, both load-bearing:
 * ---------------------------------------------------------------------------
 *
 * **Auction date is excluded.** A re-auction of the same property MUST collide
 * with the row already in the table, so `4-load.mjs` can bump "auctionRoundNo"
 * and carry the old reserve into "previousReservePrice" instead of inserting a
 * near-duplicate. That collision is the feature — it is what produces "4th
 * round, 13% below the first", which is the badge the competitor paywalls.
 * Including the date would turn every re-auction into a new listing and destroy
 * the price history that makes the product worth paying for.
 *
 * **Area is excluded**, which differs from the original plan. Area is the least
 * reliably extracted field on a sale notice — it appears as carpet, built-up or
 * super built-up, in sq.ft or sq.m, sometimes only inside a schedule paragraph,
 * and is frequently absent. A field that is null in one harvest and 720 in the
 * next would give the same property two different hashes, splitting a
 * re-auction into a duplicate listing. Address already carries the unit number,
 * so area was adding instability without adding discrimination.
 *
 * ---------------------------------------------------------------------------
 * Known limitation
 * ---------------------------------------------------------------------------
 * Two portals that write the same address materially differently ("Sunrise
 * Residency" vs "Sunrise Res.") will not collide, so the same property can
 * appear twice. This is the safe direction to fail — a visible duplicate can be
 * merged by hand, whereas a false merge deletes a listing nobody knows is gone.
 * A fuzzy near-duplicate report belongs in `qc.mjs`, not in this hash.
 */
export function dedupeHash({ lenderName, addressLine, pincode }) {
  const parts = [normalizeForHash(lenderName), normalizeForHash(addressLine), normalizeForHash(pincode)]

  // An empty address would let every row from one lender collapse into a single
  // hash — the false-merge failure this whole file is written to avoid. The
  // required-field gate in 3-normalize.mjs rejects these before they get here;
  // this is the belt to that braces.
  if (parts[1] === "") throw new Error("dedupeHash: addressLine is empty after normalisation")

  return createHash("sha256").update(parts.join("|")).digest("hex")
}
