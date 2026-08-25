export const CATEGORIES: readonly string[] = [
  "electronics",
  "furniture",
  "books",
  "clothing",
  "home",
  "other",
];

export const CONDITIONS: readonly string[] = [
  "New",
  "Like New",
  "Excellent",
  "Very Good",
  "Good",
  "Fair",
  "Poor",
];

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  location: string;
  imageUrl: string;
  sellerId: string;
  sellerEmail: string;
  sellerName: string;
  createdAt: number;
}

export type SortOption = "newest" | "price-asc" | "price-desc";
export interface ListingFilters {
  category?: string;
  search?: string;
  priceMin?: number;
  priceMax?: number;
  conditions?: string[];
  sort?: SortOption;
}
export interface Review {
  id: string;
  listingId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: number;
}
export interface SellerStats {
  count: number;
  totalValue: number;
}
