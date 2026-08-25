"use client";

import { useEffect, useRef, useState } from "react";
import { ContactSellerActions } from "./ContactSellerActions";
import type { Listing } from "@/src/lib/types";
import { FavoriteButton } from "./FavoriteButton";

interface StickyContactBarProps {
  listing: Listing;
  targetSelector: string;
}

export function StickyContactBar({ listing, targetSelector }: StickyContactBarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const target = document.querySelector(targetSelector);
    if (!target) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(!entry.isIntersecting);
      },
      {
        rootMargin: "0px",
        threshold: 0.1,
      }
    );

    observerRef.current.observe(target);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [targetSelector]);

  if (!isVisible) return null;

  return (
    <div className="sticky-contact-bar glass" role="complementary" aria-label="Contact seller">
      <div className="sticky-contact-inner">
        <div className="price-recap">
          <span className="price-label">Price</span>
          <span className="price-value">${Number(listing.price).toFixed(2)}</span>
        </div>
        <div className="sticky-actions">
          <FavoriteButton listingId={listing.id} size="md" ariaLabel="Add to favorites" />
          <ContactSellerActions listing={listing} />
        </div>
      </div>
    </div>
  );
}