import { PhotoSlot } from "@/components/photo-slot"
import { displayCount, type SiteStats } from "@/lib/stats"

export function Hero({ stats, children }: { stats: SiteStats; children?: React.ReactNode }) {
  const statCards = [
    { value: displayCount(stats.liveAuctions), label: "Live Auctions" },
    { value: displayCount(stats.cities), label: "Cities" },
    { value: displayCount(stats.lenders), label: "Lenders" },
    { value: "₹0", label: "To Browse" },
  ]

  return (
    <section id="hero" className="px-5 pt-5">
      <div className="mx-auto max-w-[1240px]">
        <PhotoSlot
          label="Hero photograph — city skyline or auctioned property"
          align="top-left"
          className="flex min-h-[440px] items-end rounded-[22px]"
        >
          <div className="relative w-full bg-[linear-gradient(to_top,rgba(24,20,16,0.88),rgba(24,20,16,0.55)_55%,transparent)] px-7 pb-7 pt-10">
            <div className="max-w-[640px]">
              <div className="mb-4 inline-flex items-center gap-[7px] rounded-pill border border-white/25 bg-white/15 px-3.5 py-1.5 backdrop-blur-[8px]">
                <span className="rounded-[4px] bg-white px-1.5 py-0.5 text-[10px] font-extrabold text-[#22201D]">IN</span>
                <span className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-white">
                  {"India's bank auction property platform"}
                </span>
              </div>

              <h1 className="mb-3.5 font-serif text-[34px] font-semibold leading-[1.05] tracking-[-0.025em] text-white sm:text-[42px] lg:text-[50px]">
                {"Find Bank Auction Properties at"}
                <span className="text-[var(--logo-tile-from)]">{" 30–40% Below Market"}</span>
              </h1>

              <p className="max-w-[52ch] text-[15px] leading-[1.55] text-white/85 sm:text-[16.5px]">
                {"India's only dedicated platform for SARFAESI bank auction properties — with free listings, alerts, and full end-to-end bidding support."}
              </p>
            </div>
          </div>
        </PhotoSlot>

        {/* The search panel overlaps the hero, so it sits inside this container
            rather than as a sibling section. */}
        {children && <div className="relative z-[5] -mt-[34px] px-0 sm:px-5">{children}</div>}

        <div className="mt-[34px] grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
          {statCards.map((stat) => (
            <div key={stat.label} className="rounded-block border border-line bg-paper px-5 py-[18px]">
              <div className="font-serif text-[32px] font-semibold leading-none tracking-[-0.02em] text-ink">{stat.value}</div>
              <div className="mt-2 text-xs font-semibold uppercase tracking-[0.1em] text-ink2">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
