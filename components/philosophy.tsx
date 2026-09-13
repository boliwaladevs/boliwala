import { PhotoSlot } from "@/components/photo-slot"

const philosophyItems = [
  {
    title: "Browse & Shortlist",
    description: "Filter 12,400+ verified properties by city, bank, type and budget. Free forever, no signup.",
    tag: "FREE",
  },
  {
    title: "Due Diligence",
    description: "Our legal team checks title, encumbrance and dues. You get a written clearance report.",
    tag: "MANAGED BY US",
  },
  {
    title: "We Bid For You",
    description: "We register, pay EMD, and bid strategically within your ceiling. You just sit back.",
    tag: "MANAGED BY US",
  },
  {
    title: "Possession Support",
    description: "Sale certificate, registration, mutation and physical possession — all handled post-win.",
    tag: "MANAGED BY US",
  },
  {
    title: "Loan Arranged",
    description: "Post-auction financing via our NBFC & bank partners. Even for occupied properties.",
    tag: "MANAGED BY US",
  },
]

export function Philosophy() {
  return (
    <section id="about" className="mx-auto max-w-[1240px] px-5 pb-14">
      <div className="grid items-start gap-11 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
        <div>
          <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-ink2">Our Process</div>
          <h2 className="mb-4 font-serif text-[32px] font-semibold leading-[1.1] tracking-[-0.025em] text-ink md:text-[40px]">
            You Browse.
            <br />
            We Handle Everything.
          </h2>
          <p className="mb-6 max-w-[44ch] text-base leading-[1.65] text-ink2">
            From finding the property to handing you the keys — Boliwala manages every step so you don't navigate the auction maze alone.
          </p>
          <PhotoSlot label="Team / handover photo" ratio="4 / 3" className="rounded-card" />
        </div>

        <div className="flex flex-col gap-3">
          {philosophyItems.map((item, index) => (
            <div
              key={item.title}
              className="flex gap-4 rounded-block border border-line bg-paper px-5 py-[18px] transition-shadow hover:shadow-card"
            >
              <span className="font-serif text-lg font-semibold text-brand">0{index + 1}</span>
              <div className="min-w-0">
                <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
                  <h3 className="text-[17px] font-bold text-ink">{item.title}</h3>
                  <span className="rounded-pill bg-gold-soft px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.06em] text-gold">
                    {item.tag}
                  </span>
                </div>
                <p className="text-sm leading-[1.6] text-ink2">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
