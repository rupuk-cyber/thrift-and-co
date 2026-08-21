"use client";

import Link from "next/link";
import type { Listing } from "@/src/lib/types";
import { categoryMeta } from "./categoryMeta";

export function ProductCard({ listing }: { listing: Listing }) {
  const meta = categoryMeta(listing.category);
  return (
    <Link href={`/listings/${listing.id}`} className="product-card">
      <div className="product-image">
        {listing.imageUrl ? (
          <img src={listing.imageUrl} alt={listing.title} loading="lazy" />
        ) : (
          <span aria-hidden="true">📦</span>
        )}
        <span className="condition-tag">{listing.condition || "Good"}</span>
      </div>
      <div className="product-body">
        <div className="title">{listing.title}</div>
        <div className="meta">
          <span className="price">
            ${Number(listing.price).toFixed(2)}{" "}
            <span>
              · <span aria-hidden="true">{meta.emoji}</span> {meta.label}
            </span>
          </span>
        </div>
        <span className="location">📍 {listing.location}</span>
      </div>
    </Link>
  );
}
