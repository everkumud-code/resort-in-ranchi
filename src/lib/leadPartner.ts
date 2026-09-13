import { prisma } from "./prisma";

export interface LeadPartnerLike {
  id: string;
  propertyId: string;
  enabled: boolean;
  eligibleCategorySlugs: string[];
  eligibleLocationSlugs: string[];
  priority: number;
  monthlyLeadCap: number | null;
  // The partner's OWN Property's real, already-stored capacity range —
  // never a number re-entered on the LeadPartner row, so this can never
  // drift from or duplicate the property's own data.
  capacityMin: number | null;
  capacityMax: number | null;
}

export interface LeadTarget {
  propertyId: string;
  categorySlug: string;
  // null = the enquired property genuinely has no locality set. Distinct
  // from a partner having no location restriction (see eligibleLocationSlugs).
  localitySlug: string | null;
  // undefined/null = not yet known (e.g. the enquire PAGE renders before a
  // visitor has entered a guest count) — capacity matching is skipped in
  // that case rather than guessing. A real number (even 0) is used for real
  // matching once the visitor has actually submitted it.
  guests?: number | null;
}

export interface EligibilityContext {
  /** partnerId -> number of PartnerLeads already created for that partner so far in the current calendar month (UTC). Missing key = 0. */
  currentMonthLeadCounts: Record<string, number>;
}

export interface EligibilityResult {
  eligible: boolean;
  /** Always populated — the specific reason for the verdict, for audit/debugging. Stored verbatim on PartnerLead.eligibilityReason when eligible. */
  reason: string;
}

/** First moment (00:00:00.000 UTC on the 1st) of the calendar month containing `now`, in UTC — used consistently so "this month" never depends on server-local timezone. */
export function startOfCurrentMonthUtc(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
}

/**
 * Pure eligibility check — nothing here is hardcoded to any specific
 * property or partner name; every real-world fact (which property is a
 * partner, which categories/locations it accepts, its capacity, whether
 * it's enabled) comes from the LeadPartner row (and, for capacity, its own
 * Property row) itself. Checked in order: self-referral, enabled, category,
 * location, capacity, monthly cap — the first failing check's reason is
 * returned; when every check passes, `reason` summarizes all of them for an
 * auditable record of why the match happened.
 */
export function evaluatePartnerEligibility(
  partner: LeadPartnerLike,
  target: LeadTarget,
  context: EligibilityContext
): EligibilityResult {
  if (partner.propertyId === target.propertyId) {
    return { eligible: false, reason: "Not eligible: partner is the enquired property itself (no self-referral)." };
  }
  if (!partner.enabled) {
    return { eligible: false, reason: "Not eligible: partner is currently disabled." };
  }
  if (!partner.eligibleCategorySlugs.includes(target.categorySlug)) {
    return { eligible: false, reason: `Not eligible: category "${target.categorySlug}" is not in the partner's eligible categories.` };
  }

  let locationClause: string;
  if (partner.eligibleLocationSlugs.length === 0) {
    locationClause = "location: no restriction configured";
  } else if (!target.localitySlug) {
    return { eligible: false, reason: "Not eligible: partner restricts by location, but the enquired property has no location set." };
  } else if (!partner.eligibleLocationSlugs.includes(target.localitySlug)) {
    return { eligible: false, reason: `Not eligible: location "${target.localitySlug}" is not in the partner's eligible locations.` };
  } else {
    locationClause = `location "${target.localitySlug}" matched`;
  }

  let capacityClause: string;
  const guests = target.guests ?? null;
  if (partner.capacityMin === null && partner.capacityMax === null) {
    capacityClause = "capacity: no constraint on this partner's venue";
  } else if (guests === null) {
    capacityClause = "capacity: guest count not yet known, constraint skipped";
  } else if (partner.capacityMin !== null && guests < partner.capacityMin) {
    return { eligible: false, reason: `Not eligible: ${guests} guests is below the partner's minimum capacity of ${partner.capacityMin}.` };
  } else if (partner.capacityMax !== null && guests > partner.capacityMax) {
    return { eligible: false, reason: `Not eligible: ${guests} guests exceeds the partner's maximum capacity of ${partner.capacityMax}.` };
  } else {
    capacityClause = `capacity: ${guests} guests fits the partner's range`;
  }

  const currentMonthCount = context.currentMonthLeadCounts[partner.id] ?? 0;
  let capClause: string;
  if (partner.monthlyLeadCap === null) {
    capClause = "monthly cap: unlimited";
  } else if (currentMonthCount >= partner.monthlyLeadCap) {
    return { eligible: false, reason: `Not eligible: partner is at its monthly lead cap (${currentMonthCount}/${partner.monthlyLeadCap}).` };
  } else {
    capClause = `monthly cap: ${currentMonthCount}/${partner.monthlyLeadCap} used`;
  }

  return {
    eligible: true,
    reason: `category "${target.categorySlug}" matched; ${locationClause}; ${capacityClause}; ${capClause}; priority ${partner.priority}.`,
  };
}

export function isPartnerEligible(partner: LeadPartnerLike, target: LeadTarget, context: EligibilityContext): boolean {
  return evaluatePartnerEligibility(partner, target, context).eligible;
}

export interface EligiblePartnerMatch {
  partner: LeadPartnerLike;
  reason: string;
}

/** Eligible partners only, ranked highest-priority first (ties keep their original relative order). Never limits the count — priority is an ordering/audit signal, not a cutoff. */
export function findEligiblePartners(
  partners: LeadPartnerLike[],
  target: LeadTarget,
  context: EligibilityContext
): EligiblePartnerMatch[] {
  return partners
    .map((partner) => ({ partner, result: evaluatePartnerEligibility(partner, target, context) }))
    .filter((entry): entry is { partner: LeadPartnerLike; result: EligibilityResult & { eligible: true } } => entry.result.eligible)
    .map(({ partner, result }) => ({ partner, reason: result.reason }))
    .sort((a, b) => b.partner.priority - a.partner.priority);
}

/**
 * Live DB lookup used by both the enquiry Server Action (to decide whether
 * to actually create PartnerLead rows) and the enquire page (to decide
 * whether to show the sharing disclosure) — the same function backs both,
 * so the disclosure shown can never promise sharing the action wouldn't
 * actually do. The page calls this with `guests` omitted (unknown at
 * render time), which only ever WIDENS eligibility relative to the action's
 * real, guest-count-aware check — so the action can never share a lead with
 * a partner the disclosure didn't already allow for.
 */
export async function getEligiblePartnersForProperty(target: LeadTarget): Promise<EligiblePartnerMatch[]> {
  const partners = await prisma.leadPartner.findMany({
    where: { enabled: true },
    select: {
      id: true,
      propertyId: true,
      enabled: true,
      eligibleCategorySlugs: true,
      eligibleLocationSlugs: true,
      priority: true,
      monthlyLeadCap: true,
      property: { select: { eventCapacityMin: true, eventCapacityMax: true } },
    },
  });
  if (partners.length === 0) return [];

  const monthCounts = await prisma.partnerLead.groupBy({
    by: ["partnerId"],
    where: { partnerId: { in: partners.map((p) => p.id) }, createdAt: { gte: startOfCurrentMonthUtc() } },
    _count: { _all: true },
  });
  const currentMonthLeadCounts = Object.fromEntries(monthCounts.map((c) => [c.partnerId, c._count._all]));

  const partnerLikes: LeadPartnerLike[] = partners.map((p) => ({
    id: p.id,
    propertyId: p.propertyId,
    enabled: p.enabled,
    eligibleCategorySlugs: p.eligibleCategorySlugs,
    eligibleLocationSlugs: p.eligibleLocationSlugs,
    priority: p.priority,
    monthlyLeadCap: p.monthlyLeadCap,
    capacityMin: p.property.eventCapacityMin,
    capacityMax: p.property.eventCapacityMax,
  }));

  return findEligiblePartners(partnerLikes, target, { currentMonthLeadCounts });
}
