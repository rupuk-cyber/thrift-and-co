"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/components/AuthProvider";
import { useToast } from "@/src/components/ToastProvider";
import { Spinner } from "@/src/components/Skeletons";
import { EmptyState } from "@/src/components/EmptyState";
import { ProductCard } from "@/src/components/ProductCard";
import { getFavoriteListings } from "@/src/lib/engagement";
import { toggleFavorite } from "@/src/lib/engagement";
import type { Listing } from "@/src/lib/types";

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  const gated = authLoading || !user;

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth/signin?next=%2Ffavorites");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (gated) return;

    const fetchFavorites = async () => {
      setLoading(true);
      try {
        const favListings = await getFavoriteListings(user!.uid);
        setFavorites(favListings);
      } catch (error) {
        console.error("Failed to fetch favorites:", error);
        showToast("Failed to load favorites", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [user, showToast]);

  const handleUnfavorite = async (listingId: string) => {
    if (!user || removingIds.has(listingId)) return;

    setRemovingIds((prev) => new Set(prev).add(listingId));

    try {
      await toggleFavorite(user.uid, listingId);
      setFavorites((prev) => prev.filter((l) => l.id !== listingId));
      showToast("Removed from favorites", "info");
    } catch (error) {
      console.error("Failed to remove favorite:", error);
      showToast("Could not remove favorite — please try again", "error");
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(listingId);
        return next;
      });
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
            <h1 className="page-title">Favorites</h1>
            <p className="page-subtitle">Your saved items</p>
          </div>
        </div>
        <div className="favorites-grid" role="status" aria-label="Loading favorites" aria-hidden="true">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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

  return (
    <div className="container page-shell fade-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">Favorites</h1>
          <p className="page-subtitle">Your saved items</p>
        </div>
      </div>

      {favorites.length === 0 ? (
        <EmptyState
          icon="❤️"
          title="No favorites yet"
          hint="Items you favorite will appear here."
        >
          <a href="/" className="btn btn-primary empty-state-action">
            Browse Listings
          </a>
        </EmptyState>
      ) : (
        <div
          className="favorites-grid"
          role="list"
          aria-label={`Your ${favorites.length} favorite item${favorites.length !== 1 ? "s" : ""}`}
        >
          {favorites.map((listing) => (
            <div
              key={listing.id}
              className={`product-card${removingIds.has(listing.id) ? " fade-out" : ""}`}
              role="listitem"
              style={{
                opacity: removingIds.has(listing.id) ? 0 : 1,
                transform: removingIds.has(listing.id) ? "translateY(-12px) scale(0.95)" : "none",
                pointerEvents: removingIds.has(listing.id) ? "none" : "auto",
                transition: "opacity 0.3s ease, transform 0.3s ease",
              }}
            >
              <ProductCard listing={listing} />
              <button
                type="button"
                className="favorite-button fav-btn-md favorited"
                onClick={() => handleUnfavorite(listing.id)}
                disabled={removingIds.has(listing.id)}
                aria-label={`Remove ${listing.title} from favorites`}
                aria-pressed="true"
                style={{
                  position: "absolute",
                  top: "var(--space-3)",
                  right: "var(--space-3)",
                  zIndex: 2,
                }}
              >
                <span className="fav-heart" aria-hidden="true">❤️</span>
                <span className="sr-only">Remove from favorites</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}