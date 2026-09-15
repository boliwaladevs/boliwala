// Maharashtra geography normalisation.
//
// Sale notices describe a property by village and taluka, or by a builder's
// estate name, or by a Navi Mumbai node — almost never by the (city, locality,
// district) triple the listings table wants. This file is the mapping.

/** All 36 districts, canonical spelling. `district` is written from this list only. */
export const DISTRICTS = [
  "Ahilyanagar", "Akola", "Amravati", "Beed", "Bhandara", "Buldhana",
  "Chandrapur", "Chhatrapati Sambhajinagar", "Dharashiv", "Dhule", "Gadchiroli",
  "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City",
  "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar", "Nashik", "Palghar",
  "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg",
  "Solapur", "Thane", "Wardha", "Washim", "Yavatmal",
]

/**
 * Old and alternate names → canonical.
 *
 * The renamed districts matter more than they look: notices are written by bank
 * officers using whichever name they learned, and a 2019 mortgage file says
 * Aurangabad while a 2026 notice for the same property says Chhatrapati
 * Sambhajinagar. Without this the two land in different districts and the facet
 * splits in half.
 */
export const DISTRICT_ALIASES = {
  aurangabad: "Chhatrapati Sambhajinagar",
  sambhajinagar: "Chhatrapati Sambhajinagar",
  osmanabad: "Dharashiv",
  ahmednagar: "Ahilyanagar",
  ahmadnagar: "Ahilyanagar",
  bombay: "Mumbai City",
  mumbai: "Mumbai City",
  "greater mumbai": "Mumbai City",
  "mumbai city district": "Mumbai City",
  "mumbai suburban district": "Mumbai Suburban",
  bid: "Beed",
  gondiya: "Gondia",
  buldana: "Buldhana",
  raigarh: "Raigad",
  colaba: "Raigad",
  sholapur: "Solapur",
  "new bombay": "Thane",
}

/**
 * Navi Mumbai nodes → the district they actually sit in.
 *
 * **This is the single most valuable entry in this file.** Navi Mumbai is not a
 * district and not a revenue city — it straddles two districts, and the
 * competitor gets this wrong: findauction.in files Raigad as a city with ~301
 * listings and folds Thane into "Mumbai", so there is no Navi Mumbai page and no
 * node-level filter anywhere on the site.
 *
 * Encoding the split means "Flats in Kharghar" becomes answerable, which is a
 * search nobody currently serves.
 */
export const NAVI_MUMBAI_NODES = {
  // Thane district — Thane and Belapur talukas
  airoli: "Thane", ghansoli: "Thane", koparkhairane: "Thane", "kopar khairane": "Thane",
  vashi: "Thane", turbhe: "Thane", sanpada: "Thane", nerul: "Thane",
  seawoods: "Thane", "sea woods": "Thane", "cbd belapur": "Thane", belapur: "Thane",
  juinagar: "Thane", "jui nagar": "Thane", rabale: "Thane", mahape: "Thane", digha: "Thane",
  // Raigad district — Panvel and Uran talukas
  kharghar: "Raigad", kamothe: "Raigad", kalamboli: "Raigad", taloja: "Raigad",
  panvel: "Raigad", "new panvel": "Raigad", "old panvel": "Raigad", ulwe: "Raigad",
  dronagiri: "Raigad", "dronagiri node": "Raigad", uran: "Raigad",
  "khanda colony": "Raigad", kharkopar: "Raigad", targhar: "Raigad",
}

/**
 * Taluka → district, for the priority districts only.
 *
 * Deliberately partial. A fabricated all-Maharashtra taluka table would be
 * worse than none: it would resolve confidently and wrongly, and nobody would
 * check. Districts outside this list fall back to matching the district name
 * directly in the notice text, which is what most notices actually print.
 * Extend this as each district is harvested and its real talukas are seen.
 */
export const TALUKA_TO_DISTRICT = {
  // Thane
  thane: "Thane", kalyan: "Thane", bhiwandi: "Thane", murbad: "Thane",
  shahapur: "Thane", ulhasnagar: "Thane", ambernath: "Thane", badlapur: "Thane",
  dombivli: "Thane", mira: "Thane", bhayandar: "Thane", "mira bhayandar": "Thane",
  // Raigad
  panvel: "Raigad", uran: "Raigad", karjat: "Raigad", khalapur: "Raigad",
  pen: "Raigad", alibag: "Raigad", murud: "Raigad", roha: "Raigad",
  mahad: "Raigad", mangaon: "Raigad", shrivardhan: "Raigad",
  // Pune
  haveli: "Pune", mulshi: "Pune", maval: "Pune", khed: "Pune", junnar: "Pune",
  ambegaon: "Pune", shirur: "Pune", daund: "Pune", baramati: "Pune",
  indapur: "Pune", purandar: "Pune", bhor: "Pune", velhe: "Pune",
  pimpri: "Pune", chinchwad: "Pune", "pimpri chinchwad": "Pune",
  // Palghar — split out of Thane in 2014, so old notices say Thane
  vasai: "Palghar", virar: "Palghar", palghar: "Palghar", dahanu: "Palghar",
  talasari: "Palghar", jawhar: "Palghar", mokhada: "Palghar", vikramgad: "Palghar",
  wada: "Palghar",
}

const norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim()

/** Longest match first, so "new panvel" beats "panvel" and "mira bhayandar" beats "mira". */
function longestKeyMatch(haystack, table) {
  const keys = Object.keys(table).sort((a, b) => b.length - a.length)
  for (const key of keys) {
    if (new RegExp(`\\b${key.replace(/\s+/g, "\\s+")}\\b`).test(haystack)) return table[key]
  }
  return null
}

/**
 * Resolve `{ city, locality, district }` from whatever the notice gave us.
 *
 * Search order is by reliability, not convenience:
 *   1. An explicit district name in the text — what most notices actually print.
 *   2. A Navi Mumbai node — rewrites city to "Navi Mumbai" and sets the district.
 *   3. A known taluka.
 *
 * Returns `district: null` rather than guessing when nothing matches. A null
 * district drops the row out of one facet; a wrong district puts a Pune flat in
 * Nagpur's results, which is worse and much harder to notice.
 */
export function resolveLocation({ city, locality, district, addressLine }) {
  const haystack = norm([district, city, locality, addressLine].filter(Boolean).join(" "))

  // 1. Explicit district, canonical or aliased.
  let resolved = null
  for (const d of DISTRICTS) {
    if (new RegExp(`\\b${norm(d).replace(/\s+/g, "\\s+")}\\b`).test(haystack)) { resolved = d; break }
  }
  if (!resolved) resolved = longestKeyMatch(haystack, DISTRICT_ALIASES)

  // 2. Navi Mumbai. Checked even when a district already matched, because the
  //    node is the more specific fact: a notice reading "Kharghar, Navi Mumbai,
  //    Dist. Thane" is a common and wrong way to write a Raigad address.
  const node = longestKeyMatch(haystack, NAVI_MUMBAI_NODES)
  if (node) {
    return {
      city: "Navi Mumbai",
      locality: titleCaseNode(haystack) ?? locality ?? null,
      district: node,
    }
  }

  // 2b. "Navi Mumbai" with no node named. The city is known but the district is
  //     genuinely ambiguous — it could be Thane or Raigad. Critically, it is
  //     NEVER Mumbai City, which is where step 1 lands it via the "mumbai"
  //     alias. Returning null sends the row to QC; returning Mumbai City would
  //     file a Kharghar flat under south Mumbai and nobody would catch it.
  if (/\bnavi\s+mumbai\b/.test(haystack)) {
    return { city: "Navi Mumbai", locality: locality ?? null, district: null }
  }

  // 3. Taluka.
  if (!resolved) resolved = longestKeyMatch(haystack, TALUKA_TO_DISTRICT)

  return { city: city ?? null, locality: locality ?? null, district: resolved }
}

/** The matched node, spelled the way the site should display it. */
function titleCaseNode(haystack) {
  const keys = Object.keys(NAVI_MUMBAI_NODES).sort((a, b) => b.length - a.length)
  for (const key of keys) {
    if (new RegExp(`\\b${key.replace(/\s+/g, "\\s+")}\\b`).test(haystack)) {
      return key.split(/\s+/).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ")
    }
  }
  return null
}

/** True when `name` is a canonical district. Used by the loader to refuse junk. */
export function isKnownDistrict(name) {
  return DISTRICTS.includes(name)
}
