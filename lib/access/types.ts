/**
 * Types for the gated-field access layer.
 *
 * Business rules recovered from the pricing table in demo/services.html:
 *
 *   ALWAYS PUBLIC (no login, never paywalled)
 *     full address · reserve price · EMD · auction dates · bank notice
 *
 *   GATED — 1 credit per group
 *     flat_floor       flat number & floor
 *     inspection       inspection date & time
 *     officer_contact  authorised officer & bank contact
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
  officer_contact: "Authorised officer & bank contact",
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
