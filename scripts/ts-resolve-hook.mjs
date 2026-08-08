// Lets `node --experimental-strip-types` load the app's own .ts modules.
//
// TypeScript source writes extensionless relative imports (`from "./types"`),
// which Node's ESM resolver rejects. This hook retries those as `.ts` so test
// scripts can exercise the real modules instead of a copy — without adding
// `.ts` extensions to application source purely to suit a test runner.
//
//   node --experimental-strip-types --import ./scripts/ts-resolve-hook.mjs <script>

import { register } from "node:module"
import { pathToFileURL } from "node:url"

export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context)
  } catch (error) {
    if (specifier.startsWith(".") && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      return next(`${specifier}.ts`, context)
    }
    throw error
  }
}

register(pathToFileURL(import.meta.filename))
