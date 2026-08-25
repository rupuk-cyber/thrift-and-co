"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { useToast } from "./ToastProvider";
import { getReviews, getAverageRating, addReview } from "@/src/lib/engagement";
import type { Review } from "@/src/lib/types";
import { FavoriteButton } from "./FavoriteButton";

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: number) => void;
  value?: number;
  ariaLabel?: string;
}

function StarRating({
  rating,
  max = 5,
  size = "md",
  interactive = false,
  onChange,
  value,
  ariaLabel = "Rating",
}: StarRatingProps) {
  const displayRating = value ?? rating;
  const sizeClasses = { sm: "star-sm", md: "star-md", lg: "star-lg" };

  const handleKeyDown = (event: React.KeyboardEvent, starValue: number) => {
    if (!interactive || !onChange) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onChange(starValue);
    } else if (event.key === "ArrowRight" && starValue < max) {
      event.preventDefault();
      onChange(starValue + 1);
    } else if (event.key === "ArrowLeft" && starValue > 1) {
      event.preventDefault();
      onChange(starValue - 1);
    }
  };

  return (
    <div
      className={`star-rating ${sizeClasses[size]} ${interactive ? "interactive" : ""}`}
      role={interactive ? "radiogroup" : "img"}
      aria-label={ariaLabel}
      aria-readonly={!interactive}
    >
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type={interactive ? "button" : undefined}
          className={`star ${star <= Math.round(displayRating) ? "filled" : ""} ${star === Math.ceil(displayRating) && displayRating % 1 >= 0.5 ? "half" : ""}`}
          onClick={() => interactive && onChange?.(star)}
          onKeyDown={(e) => handleKeyDown(e, star)}
          onMouseEnter={() => interactive && onChange?.(star)}
          onMouseLeave={() => interactive && onChange?.(value ?? rating)}
          disabled={!interactive}
          aria-label={`${star} out of ${max} stars`}
          aria-checked={interactive && star === (value ?? rating)}
        >
          <span aria-hidden="true">★</span>
        </button>
      ))}
    </div>
  );
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="review-card glass">
      <header className="review-header">
        <div className="reviewer-info">
          <div className="reviewer-avatar" aria-hidden="true">
            {review.userName.charAt(0).toUpperCase()}
          </div>
          <div className="reviewer-details">
            <span className="reviewer-name">{review.userName}</span>
            <time className="review-date" dateTime={new Date(review.createdAt).toISOString()}>
              {formatDate(review.createdAt)}
            </time>
          </div>
        </div>
        <StarRating rating={review.rating} size="sm" ariaLabel={`${review.rating} out of 5 stars`} />
      </header>
      <p className="review-comment">{review.comment}</p>
    </article>
  );
}

function ReviewForm({ listingId, onReviewAdded }: { listingId: string; onReviewAdded: () => void }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || rating === 0 || !comment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addReview({
        listingId,
        userId: user.uid,
        userName: user.displayName || user.email?.split("@")[0] || "Anonymous",
        rating,
        comment: comment.trim(),
      });
      showToast("Review posted!", "success");
      setRating(0);
      setComment("");
      onReviewAdded();
    } catch {
      showToast("Could not post review", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="review-form glass" onSubmit={handleSubmit}>
      <h4 className="review-form-title">Write a review</h4>
      <fieldset className="review-rating-field">
        <legend>Your rating</legend>
        <StarRating
          rating={0}
          value={hoverRating || rating}
          interactive
          onChange={setRating}
          size="lg"
          ariaLabel="Select your rating"
        />
        <div className="rating-hint" aria-hidden="true">
          {rating === 0
            ? "Tap to rate"
            : rating === 1
            ? "Poor"
            : rating === 2
            ? "Fair"
            : rating === 3
            ? "Good"
            : rating === 4
            ? "Very Good"
            : "Excellent"}
        </div>
      </fieldset>
      <div className="form-group">
        <label htmlFor="review-comment">Your experience <span className="required">*</span></label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this seller..."
          required
          minLength={10}
          maxLength={1000}
          rows={4}
        />
        <p className="field-hint">{comment.length}/1000 characters</p>
      </div>
      <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting || rating === 0 || comment.trim().length < 10}>
        {isSubmitting ? "Posting…" : "Post Review"}
      </button>
    </form>
  );
}

function SignInPrompt({ listingId }: { listingId: string }) {
  return (
    <div className="review-signin-prompt glass">
      <p>Sign in to write a review</p>
      <a href={`/auth/signin?redirect=/listings/${listingId}`} className="btn btn-primary">
        <span aria-hidden="true">🔑</span> Sign In
      </a>
    </div>
  );
}

function RatingDistribution({ avg, count }: { avg: number; count: number }) {
  const getPercentage = (star: number) => {
    // This is a simplified distribution - in a real app you'd compute from actual reviews
    const base = Math.max(0, 100 - Math.abs(star - avg) * 20);
    return Math.round(base);
  };

  return (
    <div className="rating-distribution" role="img" aria-label={`Rating distribution: ${avg.toFixed(1)} out of 5 stars, ${count} reviews`}>
      <div className="rating-summary">
        <span className="avg-rating" aria-label={`Average rating ${avg.toFixed(1)} out of 5`}>
          {avg.toFixed(1)}
        </span>
        <StarRating rating={avg} size="lg" ariaLabel={`Average rating ${avg.toFixed(1)} out of 5`} />
        <span className="review-count">({count} {count === 1 ? "review" : "reviews"})</span>
      </div>
      <div className="distribution-bars">
        {Array.from({ length: 5 }, (_, i) => 5 - i).map((star) => (
          <div key={star} className="distribution-bar">
            <span className="bar-label">{star}★</span>
            <div className="bar-track" role="progressbar" aria-valuenow={getPercentage(star)} aria-valuemin={0} aria-valuemax={100} aria-label={`${star} star ratings`}>
              <div className="bar-fill" style={{ width: `${getPercentage(star)}%` }} />
            </div>
            <span className="bar-percent">{getPercentage(star)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewsSkeleton() {
  return (
    <div className="reviews-section" aria-busy="true" aria-label="Loading reviews">
      <div className="reviews-header">
        <div className="skeleton skeleton-line" style={{ width: "120px", height: "24px" }} />
        <div className="skeleton skeleton-line" style={{ width: "80px", height: "16px" }} />
      </div>
      <div className="rating-distribution">
        <div className="rating-summary">
          <div className="skeleton skeleton-line" style={{ width: "40px", height: "48px" }} />
          <div className="skeleton skeleton-line" style={{ width: "120px", height: "32px" }} />
          <div className="skeleton skeleton-line" style={{ width: "60px", height: "16px" }} />
        </div>
        <div className="distribution-bars">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="distribution-bar">
              <div className="skeleton skeleton-line" style={{ width: "30px", height: "14px" }} />
              <div className="bar-track">
                <div className="skeleton skeleton-line" style={{ width: "60%", height: "100%" }} />
              </div>
              <div className="skeleton skeleton-line" style={{ width: "30px", height: "14px" }} />
            </div>
          ))}
        </div>
      </div>
      <div className="reviews-list" role="status" aria-label="Loading reviews">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="review-card skeleton-card">
            <div className="review-header">
              <div className="reviewer-info">
                <div className="skeleton skeleton-line" style={{ width: "40px", height: "40px", borderRadius: "50%" }} />
                <div className="reviewer-details">
                  <div className="skeleton skeleton-line" style={{ width: "100px", height: "14px" }} />
                  <div className="skeleton skeleton-line" style={{ width: "80px", height: "12px" }} />
                </div>
              </div>
              <div className="skeleton skeleton-line" style={{ width: "80px", height: "20px" }} />
            </div>
            <div className="skeleton skeleton-line" style={{ width: "100%", height: "14px" }} />
            <div className="skeleton skeleton-line" style={{ width: "80%", height: "14px" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReviewsSection({ listingId }: { listingId: string }) {
  const { user, loading: authLoading } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState({ avg: 0, count: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReviews = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [reviewsData, avgData] = await Promise.all([getReviews(listingId), getAverageRating(listingId)]);
      setReviews(reviewsData);
      setAvgRating(avgData);
    } catch {
      setError("Failed to load reviews");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [listingId]);

  const handleReviewAdded = () => {
    loadReviews();
  };

  if (isLoading && !error) {
    return <ReviewsSkeleton />;
  }

  if (error) {
    return (
      <div className="reviews-section glass" role="alert">
        <p className="error-message">Failed to load reviews</p>
        <button type="button" className="btn btn-outline" onClick={loadReviews}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <section className="reviews-section glass" aria-labelledby="reviews-heading">
      <header className="reviews-header">
        <h3 id="reviews-heading" className="reviews-title">
          Reviews
          <span className="reviews-count">({avgRating.count})</span>
        </h3>
        <RatingDistribution avg={avgRating.avg} count={avgRating.count} />
      </header>

      <div className="reviews-list" role="list" aria-label="Customer reviews">
        {reviews.length > 0 ? (
          reviews.map((review) => <ReviewCard key={review.id} review={review} />)
        ) : (
          <p className="no-reviews">No reviews yet. Be the first to review!</p>
        )}
      </div>

      {authLoading ? (
        <div className="review-form-loading" aria-busy="true">
          <div className="skeleton skeleton-line" style={{ width: "200px", height: "20px" }} />
        </div>
      ) : user ? (
        <ReviewForm listingId={listingId} onReviewAdded={handleReviewAdded} />
      ) : (
        <SignInPrompt listingId={listingId} />
      )}
    </section>
  );
}