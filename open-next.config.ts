import { defineCloudflareConfig } from "@opennextjs/cloudflare"

// Item 1a go/no-go spike (ROADMAP.md Item 1). Defaults only — no incremental
// cache or tag store configured yet; those are Item 1c decisions once the
// spike passes.
export default defineCloudflareConfig()
