"use client";

import Link from "next/link";
import type { Listing } from "@/src/lib/types";

interface SellerCardProps {
  listing: Listing;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatMemberSince(createdAt: number): string {
  const date = new Date(createdAt);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
}

export function SellerCard({ listing }: SellerCardProps) {
  const initials = getInitials(listing.sellerName || "Unknown");

  return (
    <div className="seller-card glass">
      <Link href={`/sellers/${listing.sellerId}`} className="seller-card-link" aria-label={`View ${listing.sellerName}'s profile`}>
        <div className="seller-avatar" aria-hidden="true">
          {initials}
        </div>
        <div className="seller-info">
          <span className="seller-name">{listing.sellerName || "Unknown Seller"}</span>
          <span className="seller-location" aria-label="Location">
            <span aria-hidden="true">📍</span>
            {listing.location || "Unknown location"}
          </span>
          <span className="seller-member-since" aria-label="Member since">
            <span aria-hidden="true">🗓️</span>
            Member since {formatMemberSince(listing.createdAt)}
          </span>
        </div>
      </Link>
    </div>
  );
}