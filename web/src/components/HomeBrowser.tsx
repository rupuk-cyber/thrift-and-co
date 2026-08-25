"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getListings } from "@/src/lib/listings";
import type { Listing } from "@/src/lib/types";
import { CategoryPills } from "./CategoryPills";
import { ProductCard } from "./ProductCard";
import { Button } from "./Button";
import { ProductGridSkeleton } from "./Skeletons";
import { useToast } from "./ToastProvider";

const PAGE_SIZE = 12;
const SEARCH_DEBOUNCE_MS = 350;

type Status = "loading" | "ready" | "error";

export function HomeBrowser() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialCategory = searchParams.get("category") ?? "all";
  const initialQuery = searchParams.get("q") ?? "";

  const [category, setCategory] = useState(initialCategory);
  const [query, setQuery] = useState(initialQuery);
  const [inputValue, setInputValue] = useState(initialQuery);
  const [items, setItems] = useState<Listing[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [loadingMore, setLoadingMore] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

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
    (nextCategory: string, nextQuery: string) => {
      const params = new URLSearchParams();
      if (nextCategory !== "all") params.set("category", nextCategory);
      if (nextQuery) params.set("q", nextQuery);
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
  }, [category, query]);

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
    syncUrl(next, query);
  };

  const hasFilters = category !== "all" || query.length > 0;

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

      {hasFilters && status === "ready" && (
        <p className="sr-only" role="status">
          {items.length} {items.length === 1 ? "item" : "items"} found
        </p>
      )}
    </div>
  );
}
