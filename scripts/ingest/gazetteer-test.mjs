import { resolveLocation } from "./lib/gazetteer.mjs"
const cases = [
  [{ addressLine: "Flat 402, Sunrise Residency, Sector 20, Kharghar, Navi Mumbai" }, "Raigad", "Navi Mumbai"],
  [{ addressLine: "Shop 3, Sector 17, Vashi, Navi Mumbai 400703" }, "Thane", "Navi Mumbai"],
  [{ addressLine: "Plot 7, MIDC Phase II, Chakan", city: "Pune" }, "Pune", null],
  [{ addressLine: "House at Village Kasarvadavli, Tal. Thane, Dist. Thane" }, "Thane", null],
  [{ addressLine: "Flat, Aurangabad", city: "Aurangabad" }, "Chhatrapati Sambhajinagar", null],
  [{ addressLine: "Row house, Vasai West", city: "Vasai" }, "Palghar", null],
  [{ addressLine: "Flat 12, New Panvel East" }, "Raigad", "Navi Mumbai"],
  [{ addressLine: "Office, Nariman Point, Mumbai" }, "Mumbai City", null],
  [{ addressLine: "Bungalow, Navi Mumbai" }, null, null],
  [{ addressLine: "Some unmapped village, Gondiya district" }, "Gondia", null],
]
let pass = 0, fail = 0
for (const [input, wantD, wantCity] of cases) {
  const r = resolveLocation({ city: null, locality: null, district: null, ...input })
  const okD = r.district === wantD
  const okC = wantCity === null || r.city === wantCity
  if (okD && okC) { pass++; console.log(`PASS  ${String(r.district)} | ${String(r.city)}  <- ${input.addressLine.slice(0,45)}`) }
  else { fail++; console.log(`FAIL  got ${String(r.district)}/${String(r.city)}  want ${wantD}/${wantCity}  <- ${input.addressLine.slice(0,45)}`) }
}
console.log(`\n${pass} passed, ${fail} failed`)
