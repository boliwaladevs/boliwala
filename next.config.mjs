// `NEXT_PUBLIC_*` values are inlined at compile time, so an absent one is not a
// runtime gap that fixes itself — it is baked into the bundle. Missing here,
// `NEXT_PUBLIC_SUPABASE_URL` used to fall back to `https://localhost` and ship a
// green build whose listing images all 400 (§27.6), while the prerender of
// /partner/login died 20 frames deep in minified vendor code with
// `Error: supabaseUrl is required.` Failing at config load names the variable
// instead.
//
// These are *build* variables, not runtime secrets. Locally they come from
// `.env.local`; on Cloudflare from Worker > Settings > Build > Variables and
// secrets — which is configured **per trigger**, so the production branch and
// the non-production branch triggers each need their own copy.
for (const name of ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"]) {
  if (!process.env[name]) {
    throw new Error(
      `${name} is not set. It is a build-time variable: set it in .env.local locally, ` +
        `or in Workers Builds > Variables and secrets for the trigger being built.`,
    )
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Serves AVIF/WebP at the size the viewport actually needs. Previously
    // `unoptimized: true`, which shipped every source file at full resolution.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        // Listing photos live in the public `listing-images` Supabase Storage
        // bucket; without this the optimizer refuses them as a remote host.
        protocol: "https",
        hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
}

export default nextConfig
