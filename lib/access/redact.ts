import type { Listing } from "@/lib/data/types";
import {
  FIELD_GROUP_LABELS,
  type FieldGroup,
  type GateDecision,
  type ListingAccess,
} from "./types";

/**
 * Server → client boundary for listings.
 *
 * The revenue model depends on gated values never reaching a browser that
 * hasn't paid for them. Blurring them in CSS or hiding them with `display:
 * none` still ships them in the HTML payload, so we strip them here instead
 * and send only a decision.
 *
 * The public field list below is an explicit allowlist, not a spread of the
 * listing. That is deliberate: when a new gated column is added to the schema
 * it stays invisible until someone consciously adds it here, rather than
 * leaking the moment it exists.
 */

export interface GatedValue<V> {
  group: FieldGroup;
  label: string;
  decision: GateDecision;
  /** Always null when `decision.visible` is false. */
  value: V | null;
}

export interface SafeListing {
  id: string;
  slug: string;
  title: string;
  propertyType: Listing["propertyType"];
  possessionType: Listing["possessionType"];
  status: Listing["status"];
  bank: Listing["bank"];

  addressLine: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  reservePrice: number;
  emdAmount: number;
  estimatedMarketValue: number | null;
  auctionDate: string;
  auctionTime: string | null;
  mode: string | null;
  emdDeadline: string;
  bidIncreaseAmount: number | null;
  totalOutstandingDues: number | null;
  noticeUrl: string | null;
  areaSqft: number | null;
  bedrooms: number | null;
  images: string[];
  viewCount: number;

  gated: {
    flat_floor: GatedValue<{ flatNumber: string | null; floor: string | null }>;
    inspection: GatedValue<{
      inspectionDatetime: string | null;
      inspectionNotes: string | null;
    }>;
    officer_contact: GatedValue<{
      authorisedOfficerName: string | null;
      authorisedOfficerPhone: string | null;
      authorisedOfficerEmail: string | null;
      bankContact: string | null;
    }>;
  };
}

export function redactListing(
  listing: Listing,
  access: ListingAccess,
): SafeListing {
  return {
    id: listing.id,
    slug: listing.slug,
    title: listing.title,
    propertyType: listing.propertyType,
    possessionType: listing.possessionType,
    status: listing.status,
    bank: listing.bank,

    addressLine: listing.addressLine,
    locality: listing.locality,
    city: listing.city,
    state: listing.state,
    pincode: listing.pincode,
    reservePrice: listing.reservePrice,
    emdAmount: listing.emdAmount,
    estimatedMarketValue: listing.estimatedMarketValue,
    auctionDate: listing.auctionDate,
    auctionTime: listing.auctionTime,
    mode: listing.mode,
    emdDeadline: listing.emdDeadline,
    bidIncreaseAmount: listing.bidIncreaseAmount,
    totalOutstandingDues: listing.totalOutstandingDues,
    noticeUrl: listing.noticeUrl,
    areaSqft: listing.areaSqft,
    bedrooms: listing.bedrooms,
    images: listing.images,
    viewCount: listing.viewCount,

    gated: {
      flat_floor: gate("flat_floor", access, () => ({
        flatNumber: listing.flatNumber,
        floor: listing.floor,
      })),
      inspection: gate("inspection", access, () => ({
        inspectionDatetime: listing.inspectionDatetime,
        inspectionNotes: listing.inspectionNotes,
      })),
      officer_contact: gate("officer_contact", access, () => ({
        authorisedOfficerName: listing.authorisedOfficerName,
        authorisedOfficerPhone: listing.authorisedOfficerPhone,
        authorisedOfficerEmail: listing.authorisedOfficerEmail,
        bankContact: listing.bankContact,
      })),
    },
  };
}

/**
 * `read` is a thunk so the values are never even materialised when the viewer
 * can't see them.
 */
function gate<V>(
  group: FieldGroup,
  access: ListingAccess,
  read: () => V,
): GatedValue<V> {
  const decision = access.decide(group);
  return {
    group,
    label: FIELD_GROUP_LABELS[group],
    decision,
    value: decision.visible ? read() : null,
  };
}
