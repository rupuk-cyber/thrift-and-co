"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { useToast } from "./ToastProvider";
import { toggleFavorite, isFavorite } from "@/src/lib/engagement";

interface FavoriteButtonProps {
  listingId: string;
  initialFavorite?: boolean;
  size?: "sm" | "md" | "lg";
  ariaLabel?: string;
}

export function FavoriteButton({
  listingId,
  initialFavorite = false,
  size = "md",
  ariaLabel = "Add to favorites",
}: FavoriteButtonProps) {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [isFav, setIsFav] = useState(initialFavorite);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (!user || hasChecked) return;
    const checkFavorite = async () => {
      try {
        const fav = await isFavorite(user.uid, listingId);
        setIsFav(fav);
      } catch {
        // Ignore errors
      } finally {
        setHasChecked(true);
      }
    };
    checkFavorite();
  }, [user, listingId, hasChecked]);

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      showToast("Sign in to save favorites", "info");
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    const previousState = isFav;
    setIsFav((prev) => !prev);

    try {
      const newState = await toggleFavorite(user.uid, listingId);
      setIsFav(newState);
      showToast(newState ? "Added to favorites" : "Removed from favorites", "success");
    } catch {
      setIsFav(previousState);
      showToast("Could not update favorites", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: "fav-btn-sm",
    md: "fav-btn-md",
    lg: "fav-btn-lg",
  };

  return (
    <button
      type="button"
      className={`favorite-button ${sizeClasses[size]} ${isFav ? "favorited" : ""} ${isLoading ? "loading" : ""}`}
      onClick={handleClick}
      disabled={isLoading || authLoading}
      aria-label={ariaLabel}
      aria-pressed={isFav}
    >
      <span className="fav-heart" aria-hidden="true">
        {isFav ? "❤️" : "🤍"}
      </span>
      <span className="sr-only">{isFav ? "Remove from favorites" : "Add to favorites"}</span>
    </button>
  );
}