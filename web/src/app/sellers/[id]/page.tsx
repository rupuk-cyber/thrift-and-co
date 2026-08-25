"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ProductCard } from "@/src/components/ProductCard";
import { Spinner } from "@/src/components/Skeletons";
import { EmptyState } from "@/src/components/EmptyState";
import { getListingsBySeller, getSellerStats } from "@/src/lib/listings";
import type { Listing } from "@/src/lib/types";

interface SellerProfileProps {
  params: Promise<{ id: string }>;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function SellerProfilePage({ params }: SellerProfileProps) {
  const [sellerId, setSellerId] = useState<string>("");
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<{ count: number; totalValue: number }>({
    count: 0,
    totalValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sellerName, setSellerName] = useState<string>("");
  const [sellerLocation, setSellerLocation] = useState<string>("");

  useEffect(() => {
    const loadSeller = async () => {
      const resolvedParams = await params;
      const id = resolvedParams.id;
      setSellerId(id);
      setLoading(true);
      setError(null);

      try {
        const [sellerListings, sellerStats] = await Promise.all([
          getListingsBySeller(id),
          getSellerStats(id),
        ]);

        if (sellerListings.length === 0 && sellerStats.count === 0) {
          notFound();
        }

        setListings(sellerListings);
        setStats(sellerStats);

        if (sellerListings.length > 0) {
          setSellerName(sellerListings[0].sellerName);
          setSellerLocation(sellerListings[0].location);
        }
      } catch (err) {
        console.error("Failed to load seller profile:", err);
        setError("Failed to load seller profile");
      } finally {
        setLoading(false);
      }
    };

    loadSeller();
  }, [params]);

  if (loading) {
    return (
      <div className="container page-shell fade-up">
        <div className="seller-header-skeleton" aria-hidden="true">
          <div className="avatar-skeleton skeleton" />
          <div className="skeleton-body" style={{ flex: 1 }}>
            <div className="skeleton skeleton-line skeleton-text" />
            <div className="skeleton skeleton-line skeleton-text-sm" />
            <div className="skeleton skeleton-line skeleton-text-sm" style={{ width: "80%" }} />
            <div style={{ display: "flex", gap: "var(--space-4)", marginTop: "var(--space-3)" }}>
              <div className="skeleton skeleton-line" style={{ width: "80px", height: "32px" }} />
              <div className="skeleton skeleton-line" style={{ width: "80px", height: "32px" }} />
            </div>
          </div>
        </div>
        <div className="section-header">
          <h2 className="section-title">Listings</h2>
        </div>
        <div className="seller-listings-grid" role="status" aria-label="Loading listings" aria-hidden="true">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="product-card product-card--skeleton">
              <div className="skeleton skeleton-image" />
              <div className="skeleton-body">
                <div className="skeleton skeleton-line" />
                <div className="skeleton skeleton-line skeleton-line--w60" />
                <div className="skeleton skeleton-line skeleton-line--w40" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !sellerName) {
    notFound();
  }

  return (
    <div className="container page-shell fade-up">
      <div className="seller-profile">
        <header className="seller-header-card">
          <div className="seller-avatar-large" aria-hidden="true">
            {getInitials(sellerName)}
          </div>
          <div className="seller-info-main">
            <h1 className="seller-name-large">{sellerName}</h1>
            <div className="seller-meta">
              <span className="seller-meta-item">
                <span aria-hidden="true">📍</span>
                {sellerLocation}
              </span>
            </div>
            <div className="seller-stats-row">
              <div className="seller-stat">
                <span className="seller-stat-label">Listings</span>
                <span className="seller-stat-value">{stats.count}</span>
              </div>
              <div className="seller-stat">
                <span className="seller-stat-label">Total Value</span>
                <span className="seller-stat-value">{formatCurrency(stats.totalValue)}</span>
              </div>
            </div>
          </div>
        </header>

        <section className="seller-listings-section" aria-labelledby="seller-listings-heading">
          <div className="section-header">
            <h2 id="seller-listings-heading" className="section-title">
              {stats.count} Listing{stats.count !== 1 ? "s" : ""}
            </h2>
          </div>

          {listings.length === 0 ? (
            <EmptyState
              icon="📦"
              title="No listings yet"
              hint="This seller hasn't posted any items."
            />
          ) : (
            <div
              className="seller-listings-grid"
              role="list"
              aria-label={`${sellerName}'s listings`}
            >
              {listings.map((listing) => (
                <div key={listing.id} className="product-card" role="listitem">
                  <ProductCard listing={listing} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}