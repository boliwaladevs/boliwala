"use client"

import { useState } from "react"
import { Search, MapPin, ChevronDown } from "lucide-react"

const locations = [
  { state: "Maharashtra", count: 7, cities: ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Thane", "Solapur"] },
  { state: "Delhi NCR", count: 5, cities: ["New Delhi", "Gurgaon", "Noida", "Faridabad", "Ghaziabad"] },
  { state: "Karnataka", count: 5, cities: ["Bengaluru", "Mysuru", "Hubli", "Mangaluru", "Belagavi"] },
  { state: "Tamil Nadu", count: 5, cities: ["Chennai", "Coimbatore", "Madurai", "Salem", "Tiruchirappalli"] },
  { state: "Telangana", count: 4, cities: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar"] },
  { state: "Gujarat", count: 5, cities: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"] },
  { state: "Rajasthan", count: 5, cities: ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer"] },
  { state: "Uttar Pradesh", count: 6, cities: ["Lucknow", "Kanpur", "Agra", "Varanasi", "Prayagraj", "Meerut"] },
  { state: "Punjab", count: 4, cities: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala"] },
  { state: "Madhya Pradesh", count: 5, cities: ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain"] },
  { state: "West Bengal", count: 5, cities: ["Kolkata", "Howrah", "Siliguri", "Durgapur", "Asansol"] },
  { state: "Kerala", count: 5, cities: ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur", "Kannur"] },
  { state: "Haryana", count: 5, cities: ["Gurugram", "Faridabad", "Ambala", "Karnal", "Panipat"] },
  { state: "Andhra Pradesh", count: 5, cities: ["Visakhapatnam", "Vijayawada", "Guntur", "Tirupati", "Nellore"] },
  { state: "Bihar", count: 4, cities: ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur"] },
  { state: "Jharkhand", count: 4, cities: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro"] },
]

export function AuctionsByCity() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)

  const filteredLocations = locations.filter((loc) => {
    const matchState = loc.state.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCity = loc.cities.some((city) => city.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchState || matchCity
  })

  // Determine how many to show based on expanded state and search
  const visibleLocations = searchTerm !== "" ? filteredLocations : (isExpanded ? filteredLocations : filteredLocations.slice(0, 8))

  return (
    <section className="mx-auto max-w-[1240px] px-5 pb-14">
      <div className="mb-6 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-ink2">Locations</p>
          <h2 className="mb-3 font-serif text-[32px] font-semibold tracking-[-0.02em] text-ink">Auctions by City</h2>
          <p className="max-w-xl text-base leading-[1.65] text-ink2">
            Find verified bank auction properties in your city. We cover 140+ cities across all 28 states and 8 union territories of India.
          </p>
        </div>

        <div className="relative w-full shrink-0 md:w-80">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink2" />
          <input
            type="text"
            placeholder="Search your city or state..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search your city or state"
            className="h-[46px] w-full rounded-field border border-line bg-paper pl-10 pr-4 text-sm text-ink outline-none transition-colors placeholder:text-ink2 focus:border-brand"
          />
        </div>
      </div>

      {filteredLocations.length === 0 ? (
        <div className="py-12 text-center text-ink2">No cities or states found matching "{searchTerm}"</div>
      ) : (
        <>
          <div className="grid gap-[18px] [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
            {visibleLocations.map((loc) => (
              <div
                key={loc.state}
                className="flex h-full flex-col rounded-card border border-line bg-paper p-5 transition-shadow hover:shadow-card"
              >
                <div className="mb-4 flex items-center justify-between border-b border-line pb-3.5">
                  <h3 className="font-serif text-lg font-semibold text-ink">{loc.state}</h3>
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-pill bg-surface px-2 text-[11px] font-bold tabular-nums text-ink2">
                    {loc.count}
                  </span>
                </div>
                <ul className="flex-1 space-y-2.5">
                  {loc.cities.map((city) => (
                    <li key={city} className="flex items-center gap-2.5 text-sm text-ink2">
                      <MapPin className="h-3 w-3 shrink-0 text-ink2/50" />
                      {city}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Show More Button if not searching and not expanded */}
          {searchTerm === "" && !isExpanded && filteredLocations.length > 8 && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => setIsExpanded(true)}
                className="group inline-flex h-11 items-center gap-2 rounded-pill border border-line bg-paper px-6 text-sm font-semibold text-ink transition-colors hover:bg-surface"
              >
                View All States
                <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
