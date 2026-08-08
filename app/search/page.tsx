import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SearchSection } from "@/components/search-section"
import { PropertyResults } from "@/components/property-results"
import { createClient } from "@/lib/supabase/server"
import type { SearchParamsInput } from "@/lib/data/listings"
import { pageMetadata } from "@/lib/seo"

// The canonical points at the bare /search so the thousands of filter-param
// permutations all consolidate to one indexable URL instead of competing.
export const metadata = pageMetadata({
  title: "Search Bank Auction Properties",
  description:
    "Search live SARFAESI bank auction properties across India. Filter by city, price, bank, property type, and possession status.",
  path: "/search",
})

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsInput>
}) {
  const params = await searchParams
  const hasSearched = Object.keys(params).length > 0

  const supabase = await createClient()
  const { data: banks } = await supabase
    .from("banks")
    .select("id, name, shortName")
    .eq("isActive", true)
    .order("name")

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <div className="flex-1 pt-24 md:pt-28">
        <SearchSection banks={banks ?? []} initialParams={params} />
        {hasSearched && <PropertyResults searchParams={params} />}
      </div>
      <Footer />
    </main>
  )
}
