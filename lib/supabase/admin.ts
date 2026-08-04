import "server-only"

import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * Service-role client — bypasses RLS and column grants entirely. Never
 * import from a client component. Reserved for operations the app itself
 * must perform that no client role should be able to (reading gated listing
 * columns to compute a redaction, writing listing_views, crediting/spending
 * credits outside the unlock RPC).
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}
