import React from "react";
import Link from "next/link";
import { getListing } from "@/src/lib/listings";
import { getViewCount } from "@/src/lib/engagement";
import { categoryMeta } from "@/src/components/categoryMeta";
import { ViewTracker } from "@/src/components/ViewTracker";
import { SellerCard } from "@/src/components/SellerCard";
import { FavoriteButton } from "@/src/components/FavoriteButton";
import { ReviewsSection } from "@/src/components/ReviewsSection";
import { StickyContactBar } from "@/src/components/StickyContactBar";
import { RelatedItems } from "@/src/components/RelatedItems";
import { ContactSellerActions } from "@/src/components/ContactSellerActions";

function PdpBackLink() {
  return (
    <Link
      href="/"
      className="detail-close"
      aria-label="Back to listings"
    >
      ✕
    </Link>
  );
}

const POSTED_DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  year: "numeric",
  month: "short",
  day: "numeric",
});

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getListing(id);
  const viewCount = await getViewCount(id);

  const meta = categoryMeta(listing?.category || "");
  const postedDate = listing ? POSTED_DATE_FORMAT.format(new Date(listing.createdAt)) : "";

  return (
    <div className="container pdp-page">
      {listing ? (
        <>
          <ViewTracker listingId={id} />
          <article className="pdp-grid">
            {/* Gallery Column */}
            <div className="pdp-gallery">
              <div className="pdp-main-image" tabIndex={0} role="img" aria-label={`${listing.title} product image`}>
                {listing.imageUrl ? (
                  <img src={listing.imageUrl} alt={listing.title} />
                ) : (
                  <span className="pdp-image-placeholder" aria-hidden="true">{meta.emoji}</span>
                )}
              </div>
            </div>

            {/* Content Column */}
            <div className="pdp-content">
              <header className="pdp-header">
                <PdpBackLink />

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)", flexWrap: "wrap" }}>
                  <h1 className="pdp-title" style={{ margin: 0 }}>{listing.title}</h1>
                  <FavoriteButton listingId={id} size="md" ariaLabel="Add to favorites" />
                </div>

                <div className="pdp-badges">
                  <span className="chip chip-accent pdp-price-badge">${Number(listing.price).toFixed(2)}</span>
                  <span className="chip">{listing.condition || "Good"}</span>
                  <span className="chip">
                    <span aria-hidden="true">{meta.emoji}</span>{" "}
                    {meta.label}
                  </span>
                </div>
              </header>

              <p className="pdp-description">{listing.description || "No description provided."}</p>

              <hr className="pdp-divider" aria-hidden="true" />

              {/* Seller Card */}
              <SellerCard listing={listing} />

              {/* Meta Chips */}
              <div className="pdp-meta-chips" role="list" aria-label="Listing details">
                <span className="pdp-meta-chip" role="listitem">
                  <span className="chip-icon" aria-hidden="true">📍</span>
                  {listing.location || "Unknown location"}
                </span>
                <span className="pdp-meta-chip" role="listitem">
                  <span className="chip-icon" aria-hidden="true">📅</span>
                  Posted {postedDate}
                </span>
                <span className="pdp-view-count" role="listitem">
                  <span className="view-icon" aria-hidden="true">👁️</span>
                  {viewCount} {viewCount === 1 ? "view" : "views"}
                </span>
              </div>

              {/* Contact Section - target for IntersectionObserver */}
              <section id="pdp-contact-section" className="pdp-contact-section" aria-labelledby="contact-heading">
                <h2 id="contact-heading" className="sr-only">Contact seller</h2>
                <ContactSellerActions listing={listing} />
              </section>

              {/* Reviews Section */}
              <ReviewsSection listingId={id} />

              {/* Related Items */}
              <RelatedItems category={listing.category} currentId={id} maxItems={4} />
            </div>
          </article>

          {/* Sticky Contact Bar */}
          <StickyContactBar listing={listing} targetSelector="#pdp-contact-section" />
        </>
      ) : (
        <div className="no-products glass">
          <span className="empty-icon" aria-hidden="true">
            📦
          </span>
          <p style={{ fontSize: "var(--text-lg)", fontWeight: 500 }}>
            This listing is no longer available
          </p>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
            It may have been sold or removed by the seller.
          </p>
          <p style={{ marginTop: "var(--space-4)" }}>
            <Link href="/" className="btn btn-outline">
              Browse listings
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}