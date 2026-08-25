"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/components/AuthProvider";
import { useToast } from "@/src/components/ToastProvider";
import { ConfirmDialog } from "@/src/components/Modal";
import { Spinner } from "@/src/components/Skeletons";
import { Button } from "@/src/components/Button";
import { EmptyState } from "@/src/components/EmptyState";
import { getListingsBySeller, getSellerStats } from "@/src/lib/listings";
import { getViewCount } from "@/src/lib/engagement";
import { deleteDoc, doc } from "firebase/firestore";
import { getFirestoreDb } from "@/src/lib/firebase";
import type { Listing } from "@/src/lib/types";

interface ListingWithViews extends Listing {
  views: number;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [listings, setListings] = useState<ListingWithViews[]>([]);
  const [stats, setStats] = useState<{ count: number; totalValue: number }>({
    count: 0,
    totalValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof ListingWithViews | "views";
    direction: "asc" | "desc";
  }>({ key: "createdAt", direction: "desc" });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    listing: ListingWithViews | null;
    busy: boolean;
  }>({ open: false, listing: null, busy: false });

  const gated = authLoading || !user;

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth/signin?next=%2Fdashboard");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (gated) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [sellerListings, sellerStats] = await Promise.all([
          getListingsBySeller(user!.uid),
          getSellerStats(user!.uid),
        ]);

        const listingsWithViews = await Promise.all(
          sellerListings.map(async (listing) => ({
            ...listing,
            views: await getViewCount(listing.id),
          }))
        );

        setListings(listingsWithViews);
        setStats(sellerStats);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        showToast("Failed to load your listings", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, showToast]);

  const handleSort = (key: keyof ListingWithViews | "views") => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sortedListings = [...listings].sort((a, b) => {
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    if (aVal === undefined || bVal === undefined) return 0;
    const direction = sortConfig.direction === "asc" ? 1 : -1;
    if (typeof aVal === "number" && typeof bVal === "number") {
      return (aVal - bVal) * direction;
    }
    return String(aVal).localeCompare(String(bVal)) * direction;
  });

  const avgPrice = stats.count > 0 ? stats.totalValue / stats.count : 0;
  const latestPost = listings.length > 0 ? Math.max(...listings.map((l) => l.createdAt)) : 0;

  const openDeleteDialog = (listing: ListingWithViews) => {
    setDeleteDialog({ open: true, listing, busy: false });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.listing || deleteDialog.busy) return;
    setDeleteDialog((prev) => ({ ...prev, busy: true }));

    try {
      const db = getFirestoreDb();
      await deleteDoc(doc(db, "listings", deleteDialog.listing.id));
      showToast(`✅ "${deleteDialog.listing.title}" deleted`, "success");
      setListings((prev) => prev.filter((l) => l.id !== deleteDialog.listing!.id));
      setStats((prev) => ({
        count: prev.count - 1,
        totalValue: prev.totalValue - deleteDialog.listing!.price,
      }));
      setDeleteDialog({ open: false, listing: null, busy: false });
    } catch (error) {
      console.error("Failed to delete listing:", error);
      showToast("Could not delete listing — please try again", "error");
      setDeleteDialog((prev) => ({ ...prev, busy: false }));
    }
  };

  if (gated) {
    return <Spinner label="Checking sign-in…" />;
  }

  if (loading) {
    return (
      <div className="container page-shell fade-up">
        <div className="page-header">
          <div>
            <h1 className="page-title">My Listings</h1>
            <p className="page-subtitle">Manage your active and past listings</p>
          </div>
        </div>
        <div className="stat-grid" aria-hidden="true">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="stat-card-skeleton">
              <div className="skeleton-row">
                <div className="skeleton-line" style={{ width: "60%" }} />
                <div className="skeleton-line" style={{ width: "100%", height: "32px" }} />
              </div>
            </div>
          ))}
        </div>
        <div className="table-wrap" aria-hidden="true">
          <table className="listings-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Condition</th>
                <th>Price</th>
                <th>Posted</th>
                <th>Views</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  <td>
                    <div className="item-cell">
                      <div className="item-thumb skeleton skeleton-image" />
                      <div className="item-info">
                        <div className="skeleton skeleton-line" style={{ width: "120px" }} />
                        <div className="skeleton skeleton-line skeleton-line--w40" />
                      </div>
                    </div>
                  </td>
                  <td><div className="skeleton skeleton-line" style={{ width: "80px" }} /></td>
                  <td><div className="skeleton skeleton-line" style={{ width: "60px" }} /></td>
                  <td><div className="skeleton skeleton-line" style={{ width: "70px" }} /></td>
                  <td><div className="skeleton skeleton-line" style={{ width: "80px" }} /></td>
                  <td><div className="skeleton skeleton-line" style={{ width: "60px" }} /></td>
                  <td><div className="skeleton skeleton-line" style={{ width: "100px" }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-shell fade-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Listings</h1>
          <p className="page-subtitle">Manage your active and past listings</p>
        </div>
        <Link href="/listings/new">
          <Button>Post New Listing</Button>
        </Link>
      </div>

      <div className="stat-grid stagger" role="region" aria-label="Listing statistics">
        <article className="stat-card">
          <p className="stat-label">Total Listings</p>
          <p className="stat-value counting" aria-live="polite">{stats.count}</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Total Value</p>
          <p className="stat-value counting" aria-live="polite">{formatCurrency(stats.totalValue)}</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Average Price</p>
          <p className="stat-value counting" aria-live="polite">{formatCurrency(avgPrice)}</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Latest Post</p>
          <p className="stat-value counting" aria-live="polite">
            {latestPost ? formatDate(latestPost) : "—"}
          </p>
        </article>
      </div>

      {sortedListings.length === 0 ? (
        <EmptyState
          icon="📦"
          title="No listings yet"
          hint="Start selling by posting your first item."
        >
          <Link href="/listings/new">
            <Button className="empty-state-action">Post Your First Listing</Button>
          </Link>
        </EmptyState>
      ) : (
        <div className="table-wrap" role="region" aria-label="Your listings">
          <table className="listings-table">
            <thead>
              <tr>
                <th scope="col">
                  <button
                    type="button"
                    className="action-btn view"
                    onClick={() => handleSort("title")}
                    style={{ background: "transparent", border: "none", padding: 0, color: "inherit", font: "inherit", cursor: "pointer" }}
                  >
                    Item {sortConfig.key === "title" && (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                  </button>
                </th>
                <th scope="col">
                  <button
                    type="button"
                    className="action-btn view"
                    onClick={() => handleSort("category")}
                    style={{ background: "transparent", border: "none", padding: 0, color: "inherit", font: "inherit", cursor: "pointer" }}
                  >
                    Category {sortConfig.key === "category" && (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                  </button>
                </th>
                <th scope="col">
                  <button
                    type="button"
                    className="action-btn view"
                    onClick={() => handleSort("condition")}
                    style={{ background: "transparent", border: "none", padding: 0, color: "inherit", font: "inherit", cursor: "pointer" }}
                  >
                    Condition {sortConfig.key === "condition" && (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                  </button>
                </th>
                <th scope="col">
                  <button
                    type="button"
                    className="action-btn view"
                    onClick={() => handleSort("price")}
                    style={{ background: "transparent", border: "none", padding: 0, color: "inherit", font: "inherit", cursor: "pointer" }}
                  >
                    Price {sortConfig.key === "price" && (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                  </button>
                </th>
                <th scope="col">
                  <button
                    type="button"
                    className="action-btn view"
                    onClick={() => handleSort("createdAt")}
                    style={{ background: "transparent", border: "none", padding: 0, color: "inherit", font: "inherit", cursor: "pointer" }}
                  >
                    Posted {sortConfig.key === "createdAt" && (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                  </button>
                </th>
                <th scope="col">
                  <button
                    type="button"
                    className="action-btn view"
                    onClick={() => handleSort("views")}
                    style={{ background: "transparent", border: "none", padding: 0, color: "inherit", font: "inherit", cursor: "pointer" }}
                  >
                    Views {sortConfig.key === "views" && (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                  </button>
                </th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedListings.map((listing) => {
                const categoryMeta = listing.category
                  ? listing.category.charAt(0).toUpperCase() + listing.category.slice(1)
                  : "Unknown";
                return (
                  <tr key={listing.id}>
                    <td className="col-item">
                      <div className="item-cell">
                        <div className="item-thumb">
                          {listing.imageUrl ? (
                            <img src={listing.imageUrl} alt={listing.title} loading="lazy" />
                          ) : (
                            <span aria-hidden="true">📦</span>
                          )}
                        </div>
                        <div className="item-info">
                          <Link
                            href={`/listings/${listing.id}`}
                            className="item-title"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {listing.title}
                          </Link>
                          <span className="item-category">
                            <span aria-hidden="true">
                              {{
                                electronics: "📱",
                                furniture: "🪑",
                                books: "📚",
                                clothing: "👕",
                                home: "🏠",
                                other: "🔮",
                              }[listing.category] || "📦"}
                            </span>
                            {categoryMeta}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="cat-badge">{categoryMeta}</span>
                    </td>
                    <td>
                      <span className="condition-badge">{listing.condition}</span>
                    </td>
                    <td className="col-price">{formatCurrency(listing.price)}</td>
                    <td className="col-posted">{formatDate(listing.createdAt)}</td>
                    <td className="col-views">
                      <span className="views-icon" aria-hidden="true">👁️</span>
                      {listing.views}
                    </td>
                    <td className="col-actions">
                      <div className="action-group">
                        <Link
                          href={`/listings/${listing.id}`}
                          className="action-btn view"
                        >
                          View
                        </Link>
                        <button
                          type="button"
                          className="action-btn delete"
                          onClick={() => openDeleteDialog(listing)}
                          aria-label={`Delete ${listing.title}`}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={deleteDialog.open}
        title="⚠️ Delete this listing?"
        message={
          deleteDialog.listing
            ? `Are you sure you want to delete "${deleteDialog.listing.title}"? This action cannot be undone.`
            : "Are you sure you want to delete this listing? This action cannot be undone."
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        busy={deleteDialog.busy}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialog({ open: false, listing: null, busy: false })}
      />
    </div>
  );
}