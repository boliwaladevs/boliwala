const trustItems = [
  { title: "100% Verified", description: "Direct bank listings" },
  { title: "Daily Updated", description: "Real-time auction data" },
  { title: "Free to Browse", description: "Full address visibility" },
  { title: "Due Diligence", description: "Legal & physical checks" },
]

export function TrustBanner() {
  return (
    <section className="mx-auto max-w-[1240px] px-5 py-13">
      <div className="grid gap-6 rounded-[22px] border border-line bg-paper p-6 md:p-[30px] [grid-template-columns:repeat(auto-fit,minmax(210px,1fr))]">
        {trustItems.map((item, index) => (
          <div key={item.title}>
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-field bg-gold-soft text-[13px] font-extrabold text-gold">
              {index + 1}
            </div>
            <div className="mb-[3px] text-[15.5px] font-bold text-ink">{item.title}</div>
            <div className="text-[13.5px] leading-[1.5] text-ink2">{item.description}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
