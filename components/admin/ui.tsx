// Shared presentational primitives for the admin panel — extracted from
// admin-view.tsx so the real-data panels (listings, listing form, bulk
// upload) can reuse the exact same styling without duplicating it.
import type { ReactNode } from "react"

export const Th = ({ children }: { children: ReactNode }) => (
  <th className="p-3 text-[11px] font-bold uppercase tracking-[0.8px] text-muted-foreground text-left">{children}</th>
)

export const Td = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <td className={`p-3 text-[13px] text-muted-foreground ${className}`}>{children}</td>
)

const pillStyles = {
  green: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20",
  gold: "bg-amber-100 text-amber-600 dark:bg-amber-500/20",
  red: "bg-red-100 text-red-600 dark:bg-red-500/20",
  purple: "bg-purple-100 text-purple-600 dark:bg-purple-500/20",
  gray: "bg-secondary text-muted-foreground",
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-500/20",
}

export const Pill = ({ children, type }: { children: ReactNode; type: keyof typeof pillStyles }) => (
  <span className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${pillStyles[type]}`}>{children}</span>
)

export const RaBtn = ({
  children,
  primary = false,
  danger = false,
  onClick,
  disabled,
  type = "button",
}: {
  children: ReactNode
  primary?: boolean
  danger?: boolean
  onClick?: () => void
  disabled?: boolean
  type?: "button" | "submit"
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`h-7 px-2.5 rounded-md text-[11px] font-semibold border-2 transition-colors whitespace-nowrap disabled:opacity-50 ${
      primary
        ? "bg-primary border-primary text-primary-foreground hover:bg-primary/90"
        : danger
          ? "border-border bg-background text-muted-foreground hover:border-destructive hover:text-destructive"
          : "border-border bg-background text-muted-foreground hover:border-primary hover:text-primary"
    }`}
  >
    {children}
  </button>
)

export const TcHead = ({ title, acts }: { title: ReactNode; acts?: ReactNode }) => (
  <div className="px-5 py-3.5 border-b border-border flex flex-wrap items-center justify-between gap-3">
    <div className="font-display text-[15px] font-bold text-foreground flex items-center gap-2">{title}</div>
    <div className="flex items-center gap-2 flex-wrap">{acts}</div>
  </div>
)

export const TcActionSelect = ({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string }[]
  value?: string
  onChange?: (value: string) => void
}) => (
  <select
    value={value}
    onChange={(e) => onChange?.(e.target.value)}
    className="h-8 px-2.5 border-2 border-border rounded-lg text-xs text-muted-foreground bg-background outline-none cursor-pointer"
  >
    {options.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
)

export const TcActionBtn = ({ children, primary = false, onClick }: { children: ReactNode; primary?: boolean; onClick?: () => void }) => (
  <button
    onClick={onClick}
    className={`h-8 px-3.5 text-xs font-semibold rounded-lg transition-colors ${primary ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-background border-2 border-border text-muted-foreground hover:border-muted-foreground"}`}
  >
    {children}
  </button>
)

export const FormSection = ({ title, children, foot }: { title: ReactNode; children: ReactNode; foot?: ReactNode }) => (
  <div className="bg-card border border-border rounded-xl shadow-sm mb-4">
    <div className="px-5 py-3.5 border-b border-border font-display text-[15px] font-bold text-foreground">{title}</div>
    <div className="p-5">{children}</div>
    {foot && <div className="px-5 py-3.5 border-t border-border bg-muted/50 flex justify-end gap-2">{foot}</div>}
  </div>
)

export const Flbl = ({ children }: { children: ReactNode }) => (
  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">{children}</label>
)

export const Finp = ({
  value,
  defaultValue,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  value?: string | number
  defaultValue?: string | number
  onChange?: (value: string) => void
  type?: string
  placeholder?: string
  required?: boolean
}) => (
  <input
    type={type}
    value={value}
    defaultValue={defaultValue}
    onChange={onChange ? (e) => onChange(e.target.value) : undefined}
    placeholder={placeholder}
    required={required}
    className="w-full h-9 px-3 border-2 border-border rounded-lg text-[13px] bg-background text-foreground outline-none focus:border-primary"
  />
)

export const Ftxt = ({
  value,
  onChange,
  placeholder,
}: {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
}) => (
  <textarea
    value={value}
    onChange={onChange ? (e) => onChange(e.target.value) : undefined}
    placeholder={placeholder}
    className="w-full min-h-[72px] p-3 border-2 border-border rounded-lg text-[13px] bg-background text-foreground outline-none focus:border-primary"
  />
)

export const Fsel = ({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string }[]
  value?: string
  onChange?: (value: string) => void
}) => (
  <select
    value={value}
    onChange={onChange ? (e) => onChange(e.target.value) : undefined}
    className="w-full h-9 px-3 border-2 border-border rounded-lg text-[13px] bg-background text-foreground outline-none focus:border-primary"
  >
    {options.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
)

export const StatCard = ({
  icon,
  trend,
  trendUp = true,
  trendFlat = false,
  value,
  label,
  iconBg,
}: {
  icon?: ReactNode
  trend?: string
  trendUp?: boolean
  trendFlat?: boolean
  value: ReactNode
  label: string
  iconBg?: string
}) => (
  <div className="bg-card border border-border rounded-xl p-4.5 shadow-sm">
    <div className="flex items-start justify-between mb-2.5">
      {icon && <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-[17px] ${iconBg}`}>{icon}</div>}
      {trend && (
        <div
          className={`flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full ${trendFlat ? "bg-secondary text-muted-foreground" : trendUp ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20" : "bg-red-100 text-red-600 dark:bg-red-500/20"}`}
        >
          {trend}
        </div>
      )}
    </div>
    <div className="font-display text-2xl font-extrabold text-foreground tracking-tight mb-0.5">{value}</div>
    <div className="text-xs text-muted-foreground">{label}</div>
  </div>
)

const alertStyles = {
  warning: "bg-amber-50 border-amber-500/25 dark:bg-amber-500/10 dark:border-amber-500/20",
  danger: "bg-red-50 border-red-500/20 dark:bg-red-500/10 dark:border-red-500/20",
  info: "bg-blue-50 border-blue-500/20 dark:bg-blue-500/10 dark:border-blue-500/20",
}

export const AlertStrip = ({
  icon,
  title,
  subtitle,
  linkText,
  linkAction,
  type = "warning",
}: {
  icon: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  linkText?: string
  linkAction?: () => void
  type?: keyof typeof alertStyles
}) => (
  <div className={`rounded-lg p-3.5 flex items-start gap-3 border mb-3 ${alertStyles[type]}`}>
    <span className="text-[17px] shrink-0 mt-0.5">{icon}</span>
    <div>
      <div className="text-[13px] font-bold text-foreground mb-0.5">{title}</div>
      {subtitle && <div className="text-xs text-muted-foreground leading-relaxed">{subtitle}</div>}
      {linkText && (
        <span onClick={linkAction} className="text-xs font-semibold text-primary cursor-pointer mt-1 inline-block hover:underline">
          {linkText}
        </span>
      )}
    </div>
  </div>
)
