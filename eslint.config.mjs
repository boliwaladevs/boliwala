import coreWebVitals from "eslint-config-next/core-web-vitals"
import typescriptConfig from "eslint-config-next/typescript"

/**
 * `pnpm run lint` has existed in package.json since the project was scaffolded,
 * but eslint was in neither dependencies nor devDependencies — so the script had
 * never run once. W8 makes it real.
 *
 * The stock Next.js configuration, not a hand-picked rule set: the point of
 * adding lint to a project this far along is to catch what the framework
 * considers a mistake, not to start an argument about style with forty files of
 * working code.
 *
 * Four rules are demoted to warnings. Each demotion is a judgement about
 * *this* codebase, written down rather than left as a mystery — see below. The
 * counts they produce are recorded in MEMORY.md §39.9 as debt, so "0 errors"
 * never quietly means "nothing left to do".
 *
 * Note `eslint-config-next@16` ships native flat config: wrapping it in
 * `FlatCompat`, as most .eslintrc recipes online still do, throws
 * "Converting circular structure to JSON".
 */
const config = [
  {
    ignores: [
      ".next/**",
      ".open-next/**",
      // Wrangler's local dev bundle — a generated single-file worker that
      // accounts for 11,502 of the 11,998 problems in the first ever run of
      // this linter. It is a build artifact, not source.
      ".wrangler/**",
      "node_modules/**",
      "next-env.d.ts",
      // Design mockups kept for reference, not application source.
      "*.html",
    ],
  },
  ...coreWebVitals,
  ...typescriptConfig,
  {
    rules: {
      // `any` on the admin panel's presentational helpers predates this config
      // by months. tsc covers their call sites; rewriting them to satisfy a
      // linter added at the end of the queue traces to nothing anyone asked for.
      "@typescript-eslint/no-explicit-any": "warn",

      // ~220 hits, almost all in admin-view.tsx, where a dozen tiny
      // presentational helpers (Td, Pill, RaBtn…) are declared inside the
      // component. The real fix is to delete them and import the identical
      // components that already exist in components/admin/ui.tsx — a genuine
      // simplification, and one that touches every table in the admin panel.
      // Not something to do at the end of a queue with no browser available to
      // check the result. Recorded as debt instead.
      "react-hooks/static-components": "warn",

      // Apostrophes in body copy. React renders them correctly; the rule guards
      // against accidental stray quotes, which tsc and review already catch.
      "react/no-unescaped-entities": "warn",

      // Mostly a false positive here. The flagged effects read `localStorage`
      // or `window` and set state from it — which is exactly what an effect is
      // for in a server-rendered app: the value does not exist during SSR, so
      // moving it into a `useState` initialiser would break hydration. The
      // shadcn-generated files under components/ui carry the rest.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    // components/ui is generated shadcn source, vendored into the repo. Holding
    // it to rules the project did not write it against produces noise nobody
    // will action, and editing it means diverging from upstream.
    files: ["components/ui/**"],
    rules: {
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/rules-of-hooks": "warn",
    },
  },
]

export default config
