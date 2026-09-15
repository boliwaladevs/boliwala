// Lender name canonicalisation.
//
// `lenders` currently holds 6 rows, all lenderType='bank'. A Maharashtra
// harvest produces well over a hundred distinct sellers — nationalised banks,
// co-operative banks, NBFCs, housing finance companies and ARCs — and each one
// arrives spelled however the notice's author felt like spelling it.
//
// Two jobs here, and the first matters more:
//
//   1. Map every spelling of an existing lender onto the name already in the
//      table, so we do not end up with "SBI", "S.B.I.", "State Bank of India"
//      and "STATE BANK OF INDIA, PUNE BRANCH" as four separate facet entries
//      splitting one bank's inventory four ways.
//   2. Classify the type, which finally populates the NBFC/ARC/HFC facet that
//      MEMORY.md §D.6 left deliberately empty pending real data.
//
// Deliberately NOT reusing `findLender()` from bulk-upload-panel.tsx:140 — it
// matches on substring in both directions, so "Bank of India" matches "Bank of
// Maharashtra" and vice versa. Harmless across 6 rows; silently destructive
// across 150.

/** Canonical name -> the spellings seen in notices. Exact match after squashing. */
const ALIASES = {
  // The six already in the database. These spellings must not drift.
  "State Bank of India": ["sbi", "statebankofindia", "sbibank", "thestatebankofindia"],
  "Punjab National Bank": ["pnb", "punjabnationalbank"],
  "Bank of Baroda": ["bob", "bankofbaroda", "barodabank"],
  "Canara Bank": ["canara", "canarabank"],
  "IDBI Bank": ["idbi", "idbibank", "idbibanklimited"],
  "Union Bank of India": ["ubi", "unionbank", "unionbankofindia"],
  // Other nationalised banks a Maharashtra harvest will certainly produce.
  "Bank of Maharashtra": ["bom", "bankofmaharashtra", "mahabank"],
  "Bank of India": ["boi", "bankofindia"],
  "Central Bank of India": ["cbi", "centralbankofindia"],
  "Indian Bank": ["indianbank"],
  "Indian Overseas Bank": ["iob", "indianoverseasbank"],
  "UCO Bank": ["uco", "ucobank"],
  "Punjab and Sind Bank": ["punjabsindbank", "punjabandsindbank", "psb"],
  // Private.
  "HDFC Bank": ["hdfc", "hdfcbank"],
  "ICICI Bank": ["icici", "icicibank"],
  "Axis Bank": ["axis", "axisbank"],
  "Kotak Mahindra Bank": ["kotak", "kotakmahindrabank"],
  "IndusInd Bank": ["indusind", "indusindbank"],
  "Yes Bank": ["yesbank"],
  "Federal Bank": ["federalbank"],
  // Co-operative — the Navi Mumbai inventory the aggregators miss.
  "Saraswat Co-operative Bank": ["saraswat", "saraswatbank", "saraswatcooperativebank"],
  "Cosmos Co-operative Bank": ["cosmos", "cosmosbank", "cosmoscooperativebank"],
  "TJSB Sahakari Bank": ["tjsb", "tjsbbank", "tjsbsahakaribank", "thanejanatasahakaribank"],
  "Abhyudaya Co-operative Bank": ["abhyudaya", "abhyudayabank"],
  "NKGSB Co-operative Bank": ["nkgsb", "nkgsbbank"],
  "Bassein Catholic Co-operative Bank": ["basseincatholic", "bccb", "basseincatholicbank"],
  "Janata Sahakari Bank": ["janatasahakaribank", "janatabank"],
}

/** Squashed alias -> canonical, built once. */
const ALIAS_INDEX = new Map()
for (const [canonical, spellings] of Object.entries(ALIASES)) {
  ALIAS_INDEX.set(squash(canonical), canonical)
  for (const s of spellings) ALIAS_INDEX.set(squash(s), canonical)
}

function squash(s) {
  return String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "")
}

/**
 * Trailing noise that turns one lender into many.
 *
 * A notice names the branch because the notice is *from* that branch — but
 * "Bank of Baroda, Kharghar Branch" and "Bank of Baroda, Vashi Branch" are one
 * lender with two branches, not two lenders. The branch belongs on the auction
 * event, not on the seller.
 */
/**
 * A comma-delimited tail naming the branch: ", Kharghar Branch", ", Stressed
 * Assets Recovery Branch", ", Vashi Br.".
 *
 * The whole segment goes, not just the keyword. An earlier version matched only
 * the word "branch" and left "State Bank of India, Kharghar" behind — which
 * then failed every alias lookup and created a separate lender row per branch.
 */
const BRANCH_SEGMENT =
  /,\s*[^,]*\b(branch|br\.|zonal|regional|samb|arb|stressed\s+assets?|asset\s+recovery|recovery\s+cell)\b.*$/i

const LEGAL_SUFFIX = /,?\s*(pvt\.?|private)?\s*(ltd\.?|limited)\.?$/i

/**
 * One lender, one name. Returns null when there is nothing usable to canonicalise.
 */
export function canonicalLenderName(raw) {
  if (!raw) return null

  let name = String(raw)
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(m\/s\.?|the)\s+/i, "")
    .replace(BRANCH_SEGMENT, "")
    .replace(/[.,;:]+$/, "")
    .trim()

  if (!name) return null

  const bare = name.replace(LEGAL_SUFFIX, "").trim()
  const known = ALIAS_INDEX.get(squash(name)) ?? ALIAS_INDEX.get(squash(bare))
  if (known) return known

  // Still unmatched: drop trailing words one at a time and try again. This
  // catches every branch spelling without a regex that has to guess how many
  // words a branch name is — "State Bank of India Kharghar Branch" reduces to
  // "State Bank of India" and hits the alias table, while an unknown lender
  // simply falls through with nothing removed.
  const words = bare.split(" ")
  for (let i = words.length - 1; i >= 2; i--) {
    const hit = ALIAS_INDEX.get(squash(words.slice(0, i).join(" ")))
    if (hit) return hit
  }

  name = bare

  // Unknown lender: keep the notice's own spelling, cleaned up. Title-casing an
  // ALL-CAPS notice name stops "STATE BANK" and "State Bank" being two rows,
  // but an already-mixed-case name is left alone — "IDBI" must not become
  // "Idbi", and a mangled acronym is harder to notice than a shouty one.
  if (name === name.toUpperCase()) {
    name = name
      .toLowerCase()
      .split(" ")
      .map((w) => (w.length <= 3 && !/^(of|and|the|for)$/.test(w) ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
      .join(" ")
  }
  return name
}

/**
 * Which facet this lender belongs in.
 *
 * Order matters: "X Housing Finance Ltd" contains "finance", and an NBFC test
 * running first would swallow every HFC. Most specific wins.
 */
export function inferLenderType(name, hint = null) {
  if (hint && ["bank", "nbfc", "arc", "hfc"].includes(hint)) return hint
  const n = String(name ?? "").toLowerCase()

  if (/asset\s*reconstruction|\barc\b|asset\s*recon/.test(n)) return "arc"
  if (/housing\s*(finance|development)|home\s*finance|\bhfc\b/.test(n)) return "hfc"
  if (/\bbank\b|sahakari|co-?op|cooperative|nagari|urban\s*bank/.test(n)) return "bank"
  if (/finance|financial|capital|fincorp|credit|lending|investments?/.test(n)) return "nbfc"
  return "nbfc"
}

/** Short label for the listing card and the slug. */
export function shortName(canonical) {
  const KNOWN = {
    "State Bank of India": "SBI", "Punjab National Bank": "PNB", "Bank of Baroda": "BoB",
    "Canara Bank": "Canara", "IDBI Bank": "IDBI", "Union Bank of India": "Union",
    "Bank of Maharashtra": "BoM", "Bank of India": "BoI", "Central Bank of India": "CBI",
    "Indian Overseas Bank": "IOB", "HDFC Bank": "HDFC", "ICICI Bank": "ICICI",
    "Axis Bank": "Axis", "Kotak Mahindra Bank": "Kotak", "Saraswat Co-operative Bank": "Saraswat",
    "Cosmos Co-operative Bank": "Cosmos", "TJSB Sahakari Bank": "TJSB",
  }
  if (KNOWN[canonical]) return KNOWN[canonical]

  // Drop the connective words, keep up to three significant ones.
  const words = String(canonical ?? "")
    .split(/\s+/)
    .filter((w) => !/^(of|and|the|co-?operative|sahakari|bank|limited|ltd\.?|pvt\.?|private)$/i.test(w))
  return (words.slice(0, 3).join(" ") || canonical || "").slice(0, 40)
}
