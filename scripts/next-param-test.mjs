// Open-redirect guard for the ?next= login parameter.
//   node --experimental-strip-types --import ./scripts/ts-resolve-hook.mjs scripts/next-param-test.mjs
//
// The guard is the only thing standing between "?next=" and an attacker
// bouncing a logged-in user off our login page onto their own domain, so the
// hostile cases below matter more than the friendly ones.

import { safeNextPath, withNext } from "../lib/auth/next-param.ts"

const ACCEPT = [
  ["/profile", "plain path"],
  ["/listing/2bhk-flat-kharghar-navi-mumbai-sbi", "deep path"],
  ["/search?city=pune&type=residential", "query preserved"],
  ["/pricing#annual", "hash preserved"],
  ["/", "site root"],
]

const REJECT = [
  ["https://evil.com", "absolute url"],
  ["http://evil.com/x", "absolute url, http"],
  ["//evil.com", "protocol-relative"],
  ["///evil.com", "triple slash"],
  ["/\\evil.com", "backslash, normalised to // by browsers"],
  ["/\\/evil.com", "mixed slash/backslash"],
  ["\\\\evil.com", "unc-style"],
  ["javascript:alert(1)", "javascript scheme"],
  ["data:text/html,<script>alert(1)</script>", "data scheme"],
  ["evil.com", "bare host"],
  ["", "empty"],
  [null, "null"],
  [undefined, "undefined"],
  ["/foo\nSet-Cookie: a=b", "newline injection"],
  ["/foo\rLocation: https://evil.com", "carriage return injection"],
  ["/foo\u0000bar", "null byte"],
  ["/foo\u007fbar", "delete char"],
]

let fail = 0

console.log("=== MUST BE ACCEPTED ===")
for (const [value, why] of ACCEPT) {
  const got = safeNextPath(value)
  const ok = got === value
  if (!ok) fail++
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${JSON.stringify(value)}  (${why})${ok ? "" : ` -> got ${JSON.stringify(got)}`}`)
}

console.log("\n=== MUST BE REJECTED ===")
for (const [value, why] of REJECT) {
  const got = safeNextPath(value)
  const ok = got === null
  if (!ok) fail++
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${JSON.stringify(value)}  (${why})${ok ? "" : ` -> LEAKED ${JSON.stringify(got)}`}`)
}

console.log("\n=== withNext() ===")
const cases = [
  [withNext("/login", "/profile"), "/login?next=%2Fprofile"],
  [withNext("/login", "/search?city=pune"), "/login?next=%2Fsearch%3Fcity%3Dpune"],
  [withNext("/login", "https://evil.com"), "/login"],
  [withNext("/login", null), "/login"],
]
for (const [got, want] of cases) {
  const ok = got === want
  if (!ok) fail++
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${got}${ok ? "" : `  (wanted ${want})`}`)
}

console.log(
  fail === 0
    ? `\nRESULT: PASS — ${ACCEPT.length + REJECT.length + cases.length} assertions, no open redirect`
    : `\nRESULT: FAIL — ${fail} assertion(s)`,
)
process.exit(fail === 0 ? 0 : 1)
