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
        hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://localhost").hostname,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
}

export default nextConfig
