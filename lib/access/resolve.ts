import {
  FIELD_GROUPS,
  type AccessState,
  type FieldGroup,
  type GateDecision,
  type ListingAccess,
  type PricingSettings,
  type Viewer,
} from "./types";

/**
 * The single access-control decision point for gated fields (requirement #1).
 *
 * Every surface — listing page, search cards, profile, admin preview — calls
 * this. If you find yourself checking `user.hasSubscription` or comparing a
 * credit balance anywhere else in the codebase, that logic belongs here.
 *
 * @param viewer  null for a signed-out visitor
 * @param settings  live pricing from the settings table, never hardcoded
 */
export function resolveListingAccess(
  viewer: Viewer | null,
  settings: PricingSettings,
): ListingAccess {
  const state = resolveState(viewer, settings);
  const unlocked = new Set(viewer?.unlockedGroups ?? []);
  const creditBalance = viewer?.creditBalance ?? 0;

  function decide(group: FieldGroup): GateDecision {
    const cost = settings.creditCost[group];

    // Paid tiers see everything with no unlock step.
    if (state === "subscriber") {
      return { visible: true, via: "subscription" };
    }

    // Already paid for this group on this listing — never charge twice.
    if (unlocked.has(group)) {
      return { visible: true, via: "unlocked" };
    }

    if (state === "guest") {
      return { visible: false, action: "signup", cost };
    }

    if (creditBalance >= cost) {
      return { visible: false, action: "spend", cost };
    }

    return {
      visible: false,
      action: "upgrade",
      cost,
      shortfall: cost - creditBalance,
    };
  }

  return {
    state,
    creditBalance,
    settings,
    decide,
    canSee: (group) => decide(group).visible,
  };
}

function resolveState(
  viewer: Viewer | null,
  settings: PricingSettings,
): AccessState {
  if (!viewer) return "guest";
  if (viewer.hasActiveSubscription) return "subscriber";

  // "Has credits" means able to afford the cheapest gated group — a balance
  // of 0 and a balance below every price are the same dead end to the user.
  const cheapest = Math.min(
    ...FIELD_GROUPS.map((group) => settings.creditCost[group]),
  );
  return viewer.creditBalance >= cheapest
    ? "member_with_credits"
    : "member_no_credits";
}
