"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Listing } from "@/src/lib/types";
import { categoryMeta } from "./categoryMeta";
import { FavoriteButton } from "./FavoriteButton";

export function ProductCard({ listing }: { listing: Listing }) {
  const meta = categoryMeta(listing.category);
  const cardRef = useRef<HTMLElement>(null);
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches);
    mediaQuery.addEventListener?.("change", handler);
    return () => mediaQuery.removeEventListener?.("change", handler);
  }, []);

  useEffect(() => {
    const card = cardRef.current;
    if (!card || prefersReducedMotion) return;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = event.clientX - centerX;
      const deltaY = event.clientY - centerY;
      const maxTilt = 8;
      const tiltX = Math.max(-maxTilt, Math.min(maxTilt, (deltaY / (rect.height / 2)) * maxTilt));
      const tiltY = Math.max(-maxTilt, Math.min(maxTilt, (-deltaX / (rect.width / 2)) * maxTilt));
      setTiltX(tiltX);
      setTiltY(tiltY);
      card.style.setProperty("--tilt-x", `${tiltX}deg`);
      card.style.setProperty("--tilt-y", `${tiltY}deg`);
    };

    const handleMouseLeave = () => {
      setTiltX(0);
      setTiltY(0);
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
    };

    const handleMouseEnter = () => {
      setIsHovering(true);
    };

    const handleMouseLeaveReset = () => {
      setIsHovering(false);
    };

    card.addEventListener("mousemove", handleMouseMove);
    card.addEventListener("mouseleave", handleMouseLeave);
    card.addEventListener("mouseenter", handleMouseEnter);
    card.addEventListener("mouseleave", handleMouseLeaveReset);

    return () => {
      card.removeEventListener("mousemove", handleMouseMove);
      card.removeEventListener("mouseleave", handleMouseLeave);
      card.removeEventListener("mouseenter", handleMouseEnter);
      card.removeEventListener("mouseleave", handleMouseLeaveReset);
    };
  }, [prefersReducedMotion]);

  return (
    <article
      ref={cardRef}
      className="product-card fade-up"
      style={{ "--tilt-x": `${tiltX}deg`, "--tilt-y": `${tiltY}deg` } as React.CSSProperties}
      onMouseEnter={() => !prefersReducedMotion && setIsHovering(true)}
      onMouseLeave={() => !prefersReducedMotion && setIsHovering(false)}
    >
      <Link href={`/listings/${listing.id}`} className="product-card-link">
        <div className="product-image">
          {listing.imageUrl ? (
            <img src={listing.imageUrl} alt={listing.title} loading="lazy" />
          ) : (
            <span aria-hidden="true">📦</span>
          )}
          <span className="condition-tag">{listing.condition || "Good"}</span>
        </div>
        <div className="product-body">
          <h3 className="title">{listing.title}</h3>
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
      <FavoriteButton
        listingId={listing.id}
        size="sm"
        ariaLabel={listing.title ? `Add "${listing.title}" to favorites` : "Add to favorites"}
      />
    </article>
  );
}