import Link from "next/link";
import { getListing } from "@/src/lib/listings";
import { Badge } from "@/src/components/Badge";
import { ContactSellerActions } from "@/src/components/ContactSellerActions";
import { categoryMeta } from "@/src/components/categoryMeta";

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

  return (
    <div className="container">
      <div className="detail-wrap">
        {listing ? (
          <article className="detail-panel">
            <Link href="/" className="detail-close" aria-label="Back to listings">
              ✕
            </Link>
            <div className="detail-image">
              {listing.imageUrl ? (
                <img src={listing.imageUrl} alt={listing.title} />
              ) : (
                <span aria-hidden="true">📦</span>
              )}
            </div>
            <h2>{listing.title}</h2>
            <div className="chip-row">
              <Badge variant="accent">${Number(listing.price).toFixed(2)}</Badge>
              <Badge>{listing.condition || "Good"}</Badge>
              <Badge>
                <span aria-hidden="true">{categoryMeta(listing.category).emoji}</span>{" "}
                {categoryMeta(listing.category).label}
              </Badge>
            </div>
            <p className="detail-description">
              {listing.description || "No description provided."}
            </p>
            <p className="detail-meta">
              👤 {listing.sellerName || "Unknown"} · 📍 {listing.location || "Unknown"}
            </p>
            <p className="detail-meta">
              📅 Posted{" "}
              {POSTED_DATE_FORMAT.format(new Date(listing.createdAt))}
            </p>
            <ContactSellerActions listing={listing} />
          </article>
        ) : (
          <div className="no-products">
            <span className="empty-icon" aria-hidden="true">
              📦
            </span>
            <p style={{ fontSize: "var(--text-lg)", fontWeight: 500 }}>
              This listing is no longer available
            </p>
            <p style={{ fontSize: "var(--text-sm)" }}>
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
    </div>
  );
}
