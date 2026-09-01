/**
 * Types for the gated-field access layer.
 *
 * Business rules recovered from the pricing table in demo/services.html:
 *
 *   ALWAYS PUBLIC (no login, never paywalled)
 *     full address · reserve price · EMD · auction dates · auction notice
 *
 *   GATED — 1 credit per group
 *     flat_floor       flat number & floor
 *     inspection       inspection date & time
 *     officer_contact  authorised officer & lender contact
 *
 *   TIERS
 *     Free      ₹0        5 credits on signup
 *     Annual    ₹999/yr   unlimited unlocking
 *     Service   ₹9,999    unlimited unlocking + expert handling (per property)
 */

export const FIELD_GROUPS = ["flat_floor", "inspection", "officer_contact"] as const;

export type FieldGroup = (typeof FIELD_GROUPS)[number];

export const FIELD_GROUP_LABELS: Record<FieldGroup, string> = {
  flat_floor: "Flat number & floor",
  inspection: "Inspection date & time",
  officer_contact: "Authorised officer & lender contact",
};

/** The four states the whole business model turns on. */
export type AccessState =
  | "guest"
  | "member_no_credits"
  | "member_with_credits"
  | "subscriber";

/**
 * Admin-configurable pricing (build requirement #2). Always loaded from the
 * settings table — never hardcode any of these in a component or route.
 */
export interface PricingSettings {
  freeSignupCredits: number;
  annualPrice: number;
  servicePackagePrice: number;
  successFeePct: number;
  creditCost: Record<FieldGroup, number>;
}

/**
 * Channel partner commission configuration (product spec 5.10).
 *
 * The two live rates are the client's confirmed numbers. `successFeePct` is
 * configurable but inert: nothing records a success fee, so nothing can accrue
 * against it.
 *
 * The tier minimums are `null` until the client decides them. Null means "not
 * set", which the admin panel says out loud rather than showing a 0 that would
 * read as a decision nobody made.
 */
export interface CommissionSettings {
  subscriptionPct: number;
  packagePct: number;
  successFeePct: number;
  silverMinConversions: number | null;
  goldMinConversions: number | null;
  attributionDays: number;
}

/** The signed-in viewer, resolved against one specific listing. */
export interface Viewer {
  userId: string;
  creditBalance: number;
  hasActiveSubscription: boolean;
  /** Groups this user has already unlocked *on this listing*. */
  unlockedGroups: FieldGroup[];
}

/**
 * What the UI should do for one gated group. Components render this and
 * nothing else — they never re-derive access from user or listing fields.
 */
export type GateDecision =
  | { visible: true; via: "subscription" | "unlocked" }
  | { visible: false; action: "signup"; cost: number }
  | { visible: false; action: "spend"; cost: number }
  | { visible: false; action: "upgrade"; cost: number; shortfall: number };

export interface ListingAccess {
  state: AccessState;
  creditBalance: number;
  settings: PricingSettings;
  /** Decision for a single group. */
  decide(group: FieldGroup): GateDecision;
  /** Convenience: is this group's value safe to send to the client? */
  canSee(group: FieldGroup): boolean;
}
