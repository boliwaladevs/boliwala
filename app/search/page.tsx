import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SearchSection } from "@/components/search-section"
import { PropertyResults } from "@/components/property-results"
import { createClient } from "@/lib/supabase/server"
import type { SearchParamsInput } from "@/lib/data/listings"

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
