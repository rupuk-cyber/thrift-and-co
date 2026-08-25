"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getListings } from "@/src/lib/listings";
import type { Listing, SortOption, CONDITIONS, CATEGORIES } from "@/src/lib/types";
import { CategoryPills } from "./CategoryPills";
import { ProductCard } from "./ProductCard";
import { Button } from "./Button";
import { ProductGridSkeleton, FilterSidebarSkeleton } from "./Skeletons";
import { useToast } from "./ToastProvider";

const PAGE_SIZE = 12;
const SEARCH_DEBOUNCE_MS = 350;

type Status = "loading" | "ready" | "error";

const CATEGORIES_LIST = [
  "electronics",
  "furniture",
  "books",
  "clothing",
  "home",
  "other",
] as const;

const CONDITIONS_LIST = [
  "New",
  "Like New",
  "Excellent",
  "Very Good",
  "Good",
  "Fair",
  "Poor",
] as const;

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

export function HomeBrowser() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialCategory = searchParams.get("category") ?? "all";
  const initialQuery = searchParams.get("q") ?? "";
  const initialSort = (searchParams.get("sort") as SortOption) ?? "newest";
  const initialPriceMin = searchParams.get("priceMin")
    ? Number(searchParams.get("priceMin"))
    : undefined;
  const initialPriceMax = searchParams.get("priceMax")
    ? Number(searchParams.get("priceMax"))
    : undefined;
  const initialConditions = searchParams.get("conditions")
    ? searchParams.get("conditions")!.split(",").filter(Boolean)
    : [];

  const [category, setCategory] = useState(initialCategory);
  const [query, setQuery] = useState(initialQuery);
  const [inputValue, setInputValue] = useState(initialQuery);
  const [sort, setSort] = useState<SortOption>(initialSort);
  const [priceMin, setPriceMin] = useState<number | undefined>(initialPriceMin);
  const [priceMax, setPriceMax] = useState<number | undefined>(initialPriceMax);
  const [conditions, setConditions] = useState<string[]>(initialConditions);
  const [items, setItems] = useState<Listing[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [loadingMore, setLoadingMore] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const requestRef = useRef(0);
  const { showToast } = useToast();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const trimmed = inputValue.trim();
      const next = trimmed.length >= 2 ? trimmed : "";
      setQuery((current) => (current === next ? current : next));
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [inputValue]);

  const syncUrl = useCallback(
    (
      nextCategory: string,
      nextQuery: string,
      nextSort: SortOption,
      nextPriceMin?: number,
      nextPriceMax?: number,
      nextConditions?: string[]
    ) => {
      const params = new URLSearchParams();
      if (nextCategory !== "all") params.set("category", nextCategory);
      if (nextQuery) params.set("q", nextQuery);
      if (nextSort !== "newest") params.set("sort", nextSort);
      if (typeof nextPriceMin === "number") params.set("priceMin", String(nextPriceMin));
      if (typeof nextPriceMax === "number") params.set("priceMax", String(nextPriceMax));
      if (nextConditions && nextConditions.length > 0) params.set("conditions", nextConditions.join(","));
      const qs = params.toString();
      router.replace(qs ? `/?${qs}` : "/", { scroll: false });
    },
    [router]
  );

  const loadFirstPage = useCallback(async () => {
    const requestId = ++requestRef.current;
    await Promise.resolve();
    if (requestId !== requestRef.current) return;
    setStatus("loading");
    try {
      const result = await getListings({
        category: category !== "all" ? category : undefined,
        search: query || undefined,
        sort,
        priceMin,
        priceMax,
        conditions: conditions.length > 0 ? conditions : undefined,
        pageSize: PAGE_SIZE,
      });
      if (requestId !== requestRef.current) return;
      setItems(result.items);
      setCursor(result.nextCursor);
      setStatus("ready");
    } catch {
      if (requestId !== requestRef.current) return;
      setStatus("error");
    }
  }, [category, query, sort, priceMin, priceMax, conditions]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadFirstPage();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadFirstPage, reloadToken]);

  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    const requestId = requestRef.current;
    setLoadingMore(true);
    try {
      const result = await getListings({
        category: category !== "all" ? category : undefined,
        search: query || undefined,
        sort,
        priceMin,
        priceMax,
        conditions: conditions.length > 0 ? conditions : undefined,
        pageSize: PAGE_SIZE,
        cursor,
      });
      if (requestId !== requestRef.current) return;
      setItems((current) => [...current, ...result.items]);
      setCursor(result.nextCursor);
    } catch {
      if (requestId !== requestRef.current) return;
      setCursor(null);
      showToast("Couldn't load more items — please try again.", "error");
    } finally {
      setLoadingMore(false);
    }
  };

  const selectCategory = (next: string) => {
    setCategory(next);
    setCursor(null);
    syncUrl(next, query, sort, priceMin, priceMax, conditions);
  };

  const handleSortChange = (nextSort: SortOption) => {
    setSort(nextSort);
    setCursor(null);
    syncUrl(category, query, nextSort, priceMin, priceMax, conditions);
  };

  const handlePriceMinChange = (value: string) => {
    const num = value === "" ? undefined : Number(value);
    setPriceMin(num);
    setCursor(null);
    syncUrl(category, query, sort, num, priceMax, conditions);
  };

  const handlePriceMaxChange = (value: string) => {
    const num = value === "" ? undefined : Number(value);
    setPriceMax(num);
    setCursor(null);
    syncUrl(category, query, sort, priceMin, num, conditions);
  };

  const handleConditionChange = (condition: string, checked: boolean) => {
    const nextConditions = checked
      ? [...conditions, condition]
      : conditions.filter((c) => c !== condition);
    setConditions(nextConditions);
    setCursor(null);
    syncUrl(category, query, sort, priceMin, priceMax, nextConditions);
  };

  const clearAllFilters = () => {
    setCategory("all");
    setInputValue("");
    setQuery("");
    setSort("newest");
    setPriceMin(undefined);
    setPriceMax(undefined);
    setConditions([]);
    setCursor(null);
    syncUrl("all", "", "newest", undefined, undefined, []);
  };

  const hasFilters =
    category !== "all" ||
    query.length > 0 ||
    sort !== "newest" ||
    typeof priceMin === "number" ||
    typeof priceMax === "number" ||
    conditions.length > 0;

  const activeFilterCount =
    (category !== "all" ? 1 : 0) +
    (query.length > 0 ? 1 : 0) +
    (sort !== "newest" ? 1 : 0) +
    (typeof priceMin === "number" ? 1 : 0) +
    (typeof priceMax === "number" ? 1 : 0) +
    conditions.length;

  const categoryMeta = (cat: string) => {
    const meta: Record<string, { emoji: string; label: string }> = {
      electronics: { emoji: "📱", label: "Electronics" },
      furniture: { emoji: "🪑", label: "Furniture" },
      books: { emoji: "📚", label: "Books" },
      clothing: { emoji: "👕", label: "Clothing" },
      home: { emoji: "🏠", label: "Home" },
      other: { emoji: "🔮", label: "Other" },
    };
    return meta[cat] ?? { emoji: "📦", label: cat };
  };

  return (
    <div className="container">
      <section className="hero fade-up">
        <div className="hero-orbs" aria-hidden="true" />
        <h1>
          Find <span>treasures</span> that tell a story
        </h1>
        <p className="hero-subtitle">
          Pre-loved, carefully selected secondhand goods — each with its own character and history.
        </p>
      </section>

      <div className="search-row fade-up">
        <div className="search-field">
          <label htmlFor="listing-search" className="sr-only">
            Search listings
          </label>
          <span className="search-icon" aria-hidden="true">
            🔍
          </span>
          <input
            id="listing-search"
            type="search"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder="Search listings…"
            autoComplete="off"
          />
          {inputValue && (
            <button
              type="button"
              className="search-clear"
              aria-label="Clear search"
              onClick={() => setInputValue("")}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <CategoryPills active={category} onSelect={selectCategory} />

      <div className="plp-layout fade-up">
        {/* Desktop Filter Sidebar */}
        <aside className="filter-sidebar" aria-label="Filters">
          {status === "loading" ? (
            <FilterSidebarSkeleton />
          ) : (
            <>
              <div className="filter-section">
                <label htmlFor="sort-select" className="filter-label">
                  Sort
                </label>
                <select
                  id="sort-select"
                  value={sort}
                  onChange={(e) => handleSortChange(e.target.value as SortOption)}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-section">
                <span className="filter-label">Category</span>
                <div className="category-radio-list" role="radiogroup" aria-label="Filter by category">
                  <label className="category-radio-item">
                    <input
                      type="radio"
                      name="category"
                      value="all"
                      checked={category === "all"}
                      onChange={() => selectCategory("all")}
                    />
                    <span className="cat-emoji" aria-hidden="true">📦</span>
                    <span className="cat-label">All</span>
                  </label>
                  {CATEGORIES_LIST.map((cat) => {
                    const meta = categoryMeta(cat);
                    return (
                      <label key={cat} className="category-radio-item">
                        <input
                          type="radio"
                          name="category"
                          value={cat}
                          checked={category === cat}
                          onChange={() => selectCategory(cat)}
                        />
                        <span className="cat-emoji" aria-hidden="true">{meta.emoji}</span>
                        <span className="cat-label">{meta.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="filter-section">
                <span className="filter-label">Condition</span>
                <div className="condition-checkboxes" role="group" aria-label="Filter by condition">
                  {CONDITIONS_LIST.map((cond) => (
                    <label key={cond} className="condition-checkbox-item">
                      <input
                        type="checkbox"
                        value={cond}
                        checked={conditions.includes(cond)}
                        onChange={(e) => handleConditionChange(cond, e.target.checked)}
                      />
                      <span className="cond-label">{cond}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="filter-section">
                <span className="filter-label">Price Range</span>
                <div className="price-inputs">
                  <div className="price-input-group">
                    <label htmlFor="price-min">Min</label>
                    <input
                      id="price-min"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={priceMin ?? ""}
                      onChange={(e) => handlePriceMinChange(e.target.value)}
                    />
                  </div>
                  <div className="price-input-group">
                    <label htmlFor="price-max">Max</label>
                    <input
                      id="price-max"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Any"
                      value={priceMax ?? ""}
                      onChange={(e) => handlePriceMaxChange(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {hasFilters && (
                <div className="filter-section">
                  <Button variant="outline" className="btn-block" onClick={clearAllFilters}>
                    Clear all filters
                  </Button>
                </div>
              )}
            </>
          )}
        </aside>

        {/* Results Column */}
        <div className="results-column">
          {/* Mobile Filters Trigger */}
          <div className="filters-trigger-row" style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="filters-trigger"
              onClick={() => setShowMobileFilters(true)}
              aria-label={`Filters${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ""}`}
              aria-expanded={showMobileFilters}
            >
              <span aria-hidden="true">🔍</span> Filters
              {activeFilterCount > 0 && (
                <span className="badge" aria-label={`${activeFilterCount} active filters`}>
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Results Header with Active Filter Chips */}
          <header className="results-header" aria-label="Results">
            <div className="results-count">
              {status === "loading" ? (
                <span>Loading…</span>
              ) : (
                <>
                  {items.length} {items.length === 1 ? "item" : "items"} found
                </>
              )}
            </div>
            <div className="active-filters" role="list" aria-label="Active filters">
              {category !== "all" && (
                <div className="filter-chip" role="listitem">
                  <span>{categoryMeta(category).emoji} {categoryMeta(category).label}</span>
                  <button
                    type="button"
                    aria-label={`Remove category filter: ${categoryMeta(category).label}`}
                    onClick={() => selectCategory("all")}
                  >
                    ✕
                  </button>
                </div>
              )}
              {query && (
                <div className="filter-chip" role="listitem">
                  <span>🔍 "{query}"</span>
                  <button
                    type="button"
                    aria-label={`Remove search filter: ${query}`}
                    onClick={() => setInputValue("")}
                  >
                    ✕
                  </button>
                </div>
              )}
              {sort !== "newest" && (
                <div className="filter-chip" role="listitem">
                  <span>⇅ {SORT_OPTIONS.find((o) => o.value === sort)?.label}</span>
                  <button
                    type="button"
                    aria-label={`Remove sort filter: ${SORT_OPTIONS.find((o) => o.value === sort)?.label}`}
                    onClick={() => handleSortChange("newest")}
                  >
                    ✕
                  </button>
                </div>
              )}
              {typeof priceMin === "number" && (
                <div className="filter-chip" role="listitem">
                  <span>💲 Min ${priceMin}</span>
                  <button
                    type="button"
                    aria-label={`Remove minimum price filter: $${priceMin}`}
                    onClick={() => handlePriceMinChange("")}
                  >
                    ✕
                  </button>
                </div>
              )}
              {typeof priceMax === "number" && (
                <div className="filter-chip" role="listitem">
                  <span>💲 Max ${priceMax}</span>
                  <button
                    type="button"
                    aria-label={`Remove maximum price filter: $${priceMax}`}
                    onClick={() => handlePriceMaxChange("")}
                  >
                    ✕
                  </button>
                </div>
              )}
              {conditions.map((cond) => (
                <div key={cond} className="filter-chip" role="listitem">
                  <span>✨ {cond}</span>
                  <button
                    type="button"
                    aria-label={`Remove condition filter: ${cond}`}
                    onClick={() => handleConditionChange(cond, false)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </header>

          {/* Product Grid */}
          {status === "loading" && <ProductGridSkeleton count={8} />}

          {status === "error" && (
            <div className="no-products fade-up">
              <span className="empty-icon" aria-hidden="true">
                ❌
              </span>
              <p style={{ fontSize: "var(--text-lg)", fontWeight: 500 }}>Something went wrong</p>
              <p style={{ fontSize: "var(--text-sm)" }}>We couldn&apos;t load the listings.</p>
              <p style={{ marginTop: "var(--space-4)" }}>
                <Button variant="outline" onClick={() => setReloadToken((token) => token + 1)}>
                  Try again
                </Button>
              </p>
            </div>
          )}

          {status === "ready" && items.length === 0 && (
            <div className="product-grid fade-up">
              <div className="no-products">
                <span className="empty-icon" aria-hidden="true">
                  🔍
                </span>
                {query ? (
                  <>
                    <p style={{ fontSize: "var(--text-lg)", fontWeight: 500 }}>
                      No results for &ldquo;{query}&rdquo;
                    </p>
                    <p style={{ fontSize: "var(--text-sm)" }}>Try a different keyword or filter.</p>
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: "var(--text-lg)", fontWeight: 500 }}>
                      No items in this category
                    </p>
                    <p style={{ fontSize: "var(--text-sm)" }}>
                      Try another filter or check back later.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {status === "ready" && items.length > 0 && (
            <>
              <div className="product-grid fade-up">
                {items.map((listing) => (
                  <ProductCard key={listing.id} listing={listing} />
                ))}
              </div>
              {cursor && (
                <div className="load-more-row fade-up">
                  <Button variant="outline" onClick={loadMore} loading={loadingMore}>
                    Load more
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Filters Bottom Sheet */}
      {showMobileFilters && (
        <div
          className="filter-bottom-sheet-backdrop"
          onClick={() => setShowMobileFilters(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={`filter-bottom-sheet ${showMobileFilters ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
      >
        <div className="filter-bottom-sheet-handle" aria-hidden="true" />
        <div className="filter-bottom-sheet-header">
          <h3>Filters</h3>
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setShowMobileFilters(false)}
          >
            ✕
          </button>
        </div>
        <div className="filter-bottom-sheet-content">
          {status === "loading" ? (
            <FilterSidebarSkeleton />
          ) : (
            <>
              <div className="filter-section">
                <label htmlFor="mobile-sort-select" className="filter-label">
                  Sort
                </label>
                <select
                  id="mobile-sort-select"
                  value={sort}
                  onChange={(e) => handleSortChange(e.target.value as SortOption)}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-section">
                <span className="filter-label">Category</span>
                <div className="category-radio-list" role="radiogroup" aria-label="Filter by category">
                  <label className="category-radio-item">
                    <input
                      type="radio"
                      name="mobile-category"
                      value="all"
                      checked={category === "all"}
                      onChange={() => selectCategory("all")}
                    />
                    <span className="cat-emoji" aria-hidden="true">📦</span>
                    <span className="cat-label">All</span>
                  </label>
                  {CATEGORIES_LIST.map((cat) => {
                    const meta = categoryMeta(cat);
                    return (
                      <label key={cat} className="category-radio-item">
                        <input
                          type="radio"
                          name="mobile-category"
                          value={cat}
                          checked={category === cat}
                          onChange={() => selectCategory(cat)}
                        />
                        <span className="cat-emoji" aria-hidden="true">{meta.emoji}</span>
                        <span className="cat-label">{meta.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="filter-section">
                <span className="filter-label">Condition</span>
                <div className="condition-checkboxes" role="group" aria-label="Filter by condition">
                  {CONDITIONS_LIST.map((cond) => (
                    <label key={cond} className="condition-checkbox-item">
                      <input
                        type="checkbox"
                        value={cond}
                        checked={conditions.includes(cond)}
                        onChange={(e) => handleConditionChange(cond, e.target.checked)}
                      />
                      <span className="cond-label">{cond}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="filter-section">
                <span className="filter-label">Price Range</span>
                <div className="price-inputs">
                  <div className="price-input-group">
                    <label htmlFor="mobile-price-min">Min</label>
                    <input
                      id="mobile-price-min"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={priceMin ?? ""}
                      onChange={(e) => handlePriceMinChange(e.target.value)}
                    />
                  </div>
                  <div className="price-input-group">
                    <label htmlFor="mobile-price-max">Max</label>
                    <input
                      id="mobile-price-max"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Any"
                      value={priceMax ?? ""}
                      onChange={(e) => handlePriceMaxChange(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="filter-bottom-sheet-actions">
          <Button variant="outline" onClick={clearAllFilters} disabled={!hasFilters}>
            Clear all
          </Button>
          <Button variant="primary" onClick={() => setShowMobileFilters(false)}>
            Apply
          </Button>
        </div>
      </aside>

      {hasFilters && status === "ready" && (
        <p className="sr-only" role="status">
          {items.length} {items.length === 1 ? "item" : "items"} found
        </p>
      )}
    </div>
  );
}