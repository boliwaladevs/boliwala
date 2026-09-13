import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  forceWhite?: boolean
  withTagline?: boolean
}

export function Logo({ className, forceWhite = false, withTagline = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5 group", className)}>
      <div className="relative flex items-center justify-center w-[38px] h-[38px] rounded-[12px] bg-gradient-to-br from-[var(--logo-tile-from)] to-[var(--logo-tile-to)] shadow-logo overflow-hidden shrink-0">
        <svg
          width="19" height="19" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className="text-[var(--logo-mark-ink)] relative z-10 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
        >
          <path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10"/>
          <path d="m16 16 6-6"/>
          <path d="m8 8 6-6"/>
          <path d="m9 7 8 8"/>
          <path d="m21 11-8-8"/>
        </svg>
      </div>
      <div className="flex flex-col">
        <div className={cn(
          "font-serif text-[20px] sm:text-[23px] font-bold tracking-[-0.02em] leading-none transition-colors",
          forceWhite ? "text-white" : "text-ink"
        )}>
          Boli
          <span className={forceWhite ? "text-[var(--logo-tile-from)]" : "text-[var(--logo-wordmark-accent)] dark:text-[var(--logo-tile-from)]"}>
            wala
          </span>
        </div>
        {withTagline && (
          <div className={cn(
            "text-[8.5px] font-bold uppercase tracking-[0.2em] mt-[3px]",
            forceWhite ? "text-white/70" : "text-ink2"
          )}>
            We Know Auctions!
          </div>
        )}
      </div>
    </div>
  )
}
