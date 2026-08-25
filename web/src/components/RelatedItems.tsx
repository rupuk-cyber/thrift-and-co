"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getListings } from "@/src/lib/listings";
import type { Listing } from "@/src/lib/types";
import { categoryMeta } from "./categoryMeta";
import { ProductCardSkeleton } from "./Skeletons";

interface RelatedItemsProps {
  category: string;
  currentId: string;
  maxItems?: number;
}

function RelatedItemCard({ listing }: { listing: Listing }) {
  const meta = categoryMeta(listing.category);

  return (
    <Link href={`/listings/${listing.id}`} className="related-item-card glass" aria-label={`${listing.title}, $${Number(listing.price).toFixed(2)}`}>
      <div className="related-item-image">
        {listing.imageUrl ? (
          <img src={listing.imageUrl} alt="" loading="lazy" />
        ) : (
          <span aria-hidden="true">{meta.emoji}</span>
        )}
        <span className="related-condition-tag">{listing.condition || "Good"}</span>
      </div>
      <div className="related-item-body">
        <h4 className="related-item-title">{listing.title}</h4>
        <div className="related-item-meta">
          <span className="related-item-price">${Number(listing.price).toFixed(2)}</span>
          <span className="related-item-location" aria-label="Location">
            <span aria-hidden="true">📍</span>
            {listing.location}
          </span>
        </div>
      </div>
    </Link>
  );
}

function RelatedItemsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="related-items-list" role="status" aria-label="Loading related items">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="related-item-card skeleton-card" aria-hidden="true">
          <div className="skeleton skeleton-line related-item-image-skeleton" />
          <div className="related-item-body">
            <div className="skeleton skeleton-line" style={{ width: "80%", height: "16px" }} />
            <div className="related-item-meta">
              <div className="skeleton skeleton-line" style={{ width: "60px", height: "18px" }} />
              <div className="skeleton skeleton-line" style={{ width: "80px", height: "12px" }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function RelatedItems({ category, currentId, maxItems = 4 }: RelatedItemsProps) {
  const [items, setItems] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadRelated = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const { items: listings } = await getListings({ category, pageSize: maxItems + 2 });
        const filtered = listings.filter((l) => l.id !== currentId).slice(0, maxItems);
        if (mounted) {
          setItems(filtered);
        }
      } catch {
        if (mounted) setError("Failed to load related items");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadRelated();

    return () => {
      mounted = false;
    };
  }, [category, currentId, maxItems]);

  if (isLoading) {
    return (
      <section className="related-items-section glass" aria-labelledby="related-heading" aria-busy="true">
        <h3 id="related-heading" className="related-section-title">You may also like</h3>
        <RelatedItemsSkeleton count={maxItems} />
      </section>
    );
  }

  if (error || items.length === 0) {
    return null;
  }

  return (
    <section className="related-items-section glass" aria-labelledby="related-heading">
      <h3 id="related-heading" className="related-section-title">You may also like</h3>
      <div className="related-items-list" role="list" aria-label="Related listings">
        {items.map((listing) => (
          <RelatedItemCard key={listing.id} listing={listing} />
        ))}
      </div>
    </section>
  );
}