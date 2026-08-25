# Thrift & Co. V2 — Marketplace Redesign Master Spec (ULTRA effort)

Design bar: best-in-class 2026 e-commerce (Baymard-compliant) × Apple-quality glassmorphic aesthetic already established in globals.css. Every interaction needs micro-feedback. All motion respects prefers-reduced-motion.

## Existing conventions (MUST follow)
- Glass tokens: --glass-bg, --glass-border, --glass-blur, --glass-shadow, --glass-shadow-hover
- Accent: #b8875a light / #d4a373 dark. Radius tokens --radius/--radius-sm. Font var(--font).
- Existing class contracts stay working. Add classes, don't rename ones other files use.
- Touch targets >= 44px. Focus-visible rings everywhere. aria-labels on icon-only buttons.

## DATA LAYER CONTRACT (implemented by DATA agent — others consume EXACTLY this)

```ts
// src/lib/types.ts ADDITIONS (keep existing exports untouched)
export type SortOption = "newest" | "price-asc" | "price-desc";
export interface ListingFilters {
  category?: string;
  search?: string;
  priceMin?: number;
  priceMax?: number;
  conditions?: string[]; // OR within facet
  sort?: SortOption;
}
export interface Review {
  id: string; listingId: string; userId: string; userName: string;
  rating: number; // 1..5
  comment: string; createdAt: number;
}
export interface SellerStats { count: number; totalValue: number; }
```

```ts
// src/lib/listings.ts — EXTEND existing GetListingsOptions with:
//   priceMin?: number; priceMax?: number; conditions?: string[]; sort?: SortOption;
// getListings applies them (Firestore where clauses; sort default newest = orderBy createdAt desc).
// ADD: export async function getListingsBySeller(sellerId: string): Promise<Listing[]>
// ADD: export async function getSellerStats(sellerId: string): Promise<SellerStats>
//   (computed client-side from getListingsBySeller: count + sum of prices)

// NEW FILE src/lib/engagement.ts:
import { getFirebaseAuth, getFirestoreDb } from "@/src/lib/firebase";
export async function toggleFavorite(userId: string, listingId: string): Promise<boolean>
  // collection "favorites", doc id `${userId}_${listingId}`, returns true if now favorited
export async function isFavorite(userId: string, listingId: string): Promise<boolean>
export async function getFavoriteListings(userId: string): Promise<Listing[]>
  // fetch favorite docs then hydrate listings via getDoc on each listingId
export async function incrementView(listingId: string): Promise<void>
  // collection "listingViews", doc id = listingId, field { count: increment(1) } via setDoc merge
export async function getViewCount(listingId: string): Promise<number>
export async function addReview(params: { listingId: string; userId: string; userName: string; rating: number; comment: string }): Promise<void>
  // subcollection listings/{id}/reviews, auto-id, serverTimestamp + createdAt ms
export async function getReviews(listingId: string): Promise<Review[]>
  // newest first, max 50; map timestamps safely
export async function getAverageRating(listingId: string): Promise<{ avg: number; count: number }>
```

```rules
// firestore.rules ADDITIONS:
// match /favorites/{favId}: allow read: if request.auth != null && favId splits with userId prefix;
//   allow create, delete: if request.auth != null && request.auth.uid == request.resource.data.userId (create)
//   or resource.data.userId == request.auth.uid (delete). Validate listingId is string.
// match /listingViews/{id}: allow read: if true; allow create, update: if true (anonymous counters, validated int)
// match /listings/{listingId}/reviews/{reviewId}: allow read: if true;
//   allow create: if request.auth != null && request.resource.data.userId == request.auth.uid
//     && rating is int >=1 && <=5 && comment is string && size <1000;
//   allow delete: if request.auth != null && resource.data.userId == request.auth.uid
```

## FILE OWNERSHIP (never edit another wave's files)
- W2-A SHELL: src/components/Navbar.tsx, src/app/layout.tsx, NEW src/styles/shell.css
- W2-B PLP: src/components/HomeBrowser.tsx, ProductCard.tsx, CategoryPills.tsx, Skeletons.tsx, NEW src/styles/plp.css
- W2-C PDP: src/app/listings/[id]/page.tsx + NEW components (ReviewsSection, FavoriteButton, StickyContactBar, ViewTracker, RelatedItems, SellerCard) + NEW src/styles/pdp.css
- W2-D PAGES: NEW src/app/dashboard/page.tsx, src/app/favorites/page.tsx, src/app/sellers/[id]/page.tsx + NEW src/styles/pages.css
- W2-E MOTION: NEW src/styles/motion.css only

## Quality gates (every agent)
1. `npx tsc --noEmit` clean. 2. No inline styles except trivial one-offs. 3. Mobile-first: every new layout must have a <=768px breakpoint story. 4. Loading skeletons for async content. 5. Error states with retry, never blank screens.
