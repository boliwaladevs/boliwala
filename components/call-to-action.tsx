import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

export function CallToAction() {
  return (
    <section className="mx-auto max-w-[1240px] px-5 pb-14">
      <div className="rounded-[22px] border border-line bg-paper px-6 py-14 text-center sm:px-12">
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.14em] text-ink2">Get Started</p>
        <h2 className="mx-auto mb-4 max-w-[20ch] font-serif text-[32px] font-semibold leading-[1.1] tracking-[-0.025em] text-ink md:text-[40px]">
          Ready to find your next property?
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-ink2">
          Create a free account to shortlist properties, set alerts, and unlock full auction details.
        </p>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="group flex h-12 w-full items-center justify-center gap-2 rounded-pill bg-brand px-8 text-[14.5px] font-bold text-on-brand transition-opacity hover:opacity-90 sm:w-auto"
          >
            Create Free Account
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
          {/* Pre-existing dead anchor — there is no #projects section. Left as
              found; changing the destination is not part of a visual pass. */}
          <a
            href="#projects"
            className="flex h-12 w-full items-center justify-center rounded-pill border border-line px-8 text-[14.5px] font-semibold text-ink transition-colors hover:bg-surface sm:w-auto"
          >
            Browse Properties
          </a>
        </div>
      </div>
    </section>
  )
}
