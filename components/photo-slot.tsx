import { cn } from "@/lib/utils"

/**
 * Labelled placeholder for a photo position that has no photography yet.
 * Layouts already reserve the final ratio, so swapping this for an <Image>
 * later moves nothing else.
 */
export function PhotoSlot({
  label,
  ratio,
  align = "center",
  className,
  labelClassName,
  children,
}: {
  label: string
  ratio?: string
  align?: "center" | "top-left"
  className?: string
  labelClassName?: string
  children?: React.ReactNode
}) {
  return (
    <div
      className={cn("slot-fill relative overflow-hidden", className)}
      style={ratio ? { aspectRatio: ratio } : undefined}
    >
      <span
        className={cn(
          "absolute z-[1] rounded-pill bg-paper px-[11px] py-[5px] text-center text-[10px] font-semibold uppercase leading-none tracking-[0.1em] text-ink2",
          align === "center" ? "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" : "left-[18px] top-[18px]",
          labelClassName,
        )}
      >
        {label}
      </span>
      {children}
    </div>
  )
}
