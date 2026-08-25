"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "./ThemeProvider";
import { useAuth } from "./AuthProvider";
import { useToast } from "./ToastProvider";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="theme-toggle" role="radiogroup" aria-label="Color theme">
      <button
        type="button"
        className={`theme-toggle-btn${theme === "light" ? " active" : ""}`}
        role="radio"
        aria-checked={theme === "light"}
        aria-label="Light theme"
        onClick={() => setTheme("light")}
      >
        <span aria-hidden="true">☀️</span>
      </button>
      <button
        type="button"
        className={`theme-toggle-btn${theme === "dark" ? " active" : ""}`}
        role="radio"
        aria-checked={theme === "dark"}
        aria-label="Dark theme"
        onClick={() => setTheme("dark")}
      >
        <span aria-hidden="true">🌙</span>
      </button>
    </div>
  );
}

function AccountMenu() {
  const { user, signOut } = useAuth();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const name = user?.displayName || user?.email?.split("@")[0] || "Account";

  return (
    <div className="account-menu" ref={containerRef}>
      <button
        type="button"
        className="account-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span aria-hidden="true">👤</span>
        <span className="account-name">{name}</span>
      </button>
      {open && (
        <div className="account-dropdown" role="menu" aria-label="Account menu">
          <span className="account-email">{user?.email}</span>
          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              setOpen(false);
              await signOut();
              showToast("Logged out", "info");
            }}
          >
            <span aria-hidden="true">🚪</span> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function MobileSheetThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="sheet-theme-toggle" role="radiogroup" aria-label="Color theme">
      <label>
        <input
          type="radio"
          name="mobile-theme"
          checked={theme === "light"}
          onChange={() => setTheme("light")}
        />
        <span aria-hidden="true">☀️</span> Light
      </label>
      <label>
        <input
          type="radio"
          name="mobile-theme"
          checked={theme === "dark"}
          onChange={() => setTheme("dark")}
        />
        <span aria-hidden="true">🌙</span> Dark
      </label>
    </div>
  );
}

function MobileSignOutButton({ onClose }: { onClose: () => void }) {
  const { signOut } = useAuth();
  const { showToast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    showToast("Logged out", "info");
    onClose();
  };

  return (
    <button
      type="button"
      className="sheet-nav-item"
      onClick={handleSignOut}
    >
      <span aria-hidden="true">🚪</span> Sign out
    </button>
  );
}

function NavbarInner() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      router.push(`/?q=${encodeURIComponent(q)}`);
    } else {
      router.push("/");
    }
    setMobileOpen(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  useEffect(() => {
    const initialQ = searchParams.get("q");
    if (initialQ) {
      setSearchQuery(initialQ);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <header className="shell-navbar" role="banner">
        <div className="shell-navbar-inner">
          <Link href="/" className="shell-logo" aria-label="Thrift & Co. Home">
            <span className="shell-logo-icon" aria-hidden="true">🛍️</span>
            Thrift<span>&</span>Co.
          </Link>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="shell-navbar" role="banner">
        <nav className="shell-navbar-inner" aria-label="Main navigation">
          <Link href="/" className="shell-logo" aria-label="Thrift & Co. Home">
            <span className="shell-logo-icon" aria-hidden="true">🛍️</span>
            Thrift<span>&</span>Co.
          </Link>

          <div className="shell-search">
            <form className="shell-search-form" onSubmit={handleSearchSubmit} role="search">
              <label htmlFor="navbar-search" className="sr-only">
                Search listings
              </label>
              <span className="shell-search-icon" aria-hidden="true">🔍</span>
              <input
                id="navbar-search"
                type="search"
                className="shell-search-input"
                placeholder="Search listings…"
                value={searchQuery}
                onChange={handleSearchChange}
                autoComplete="off"
                aria-label="Search listings"
              />
            </form>
          </div>

          <div className="shell-actions">
            <ThemeToggle />

            {!user && (
              <>
                <Link
                  href="/auth/signin"
                  className="shell-action-btn"
                  aria-label="Sign in"
                >
                  <span aria-hidden="true">🔑</span> Sign in
                </Link>
                <Link
                  href="/listings/new"
                  className="shell-action-btn primary"
                  aria-label="Post a listing"
                >
                  <span aria-hidden="true">➕</span> Post listing
                </Link>
              </>
            )}

            {user && (
              <>
                <Link
                  href="/dashboard"
                  className="shell-action-btn"
                  aria-label="Dashboard"
                >
                  <span aria-hidden="true">📊</span> Dashboard
                </Link>
                <Link
                  href="/favorites"
                  className="shell-action-btn"
                  aria-label="Favorites"
                >
                  <span aria-hidden="true">❤️</span> Favorites
                </Link>
                <Link
                  href="/listings/new"
                  className="shell-action-btn primary"
                  aria-label="Post a listing"
                >
                  <span aria-hidden="true">➕</span> Post listing
                </Link>
                <AccountMenu />
              </>
            )}

            <button
              type="button"
              className="shell-hamburger"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-sheet"
              onClick={() => setMobileOpen(true)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden="true"
              >
                {mobileOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                )}
              </svg>
            </button>
          </div>
        </nav>
      </header>

      <div
        className="shell-mobile-sheet-overlay"
        role="presentation"
        aria-hidden="true"
        onClick={() => setMobileOpen(false)}
      >
        {mobileOpen && <div className="shell-mobile-sheet-overlay open" />}
      </div>

      <aside
        id="mobile-sheet"
        className={`shell-mobile-sheet ${mobileOpen ? "open" : ""}`}
        role="dialog"
        aria-label="Navigation menu"
        aria-modal="true"
      >
        {mobileOpen && (
          <>
            <div className="sheet-header">
              <span className="sheet-title">Menu</span>
              <button
                type="button"
                className="sheet-close"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="sheet-nav" aria-label="Mobile navigation">
              <Link
                href="/"
                className="sheet-nav-item"
                onClick={() => setMobileOpen(false)}
              >
                <span aria-hidden="true">🏠</span> Home
              </Link>
              <Link
                href="/favorites"
                className="sheet-nav-item"
                onClick={() => setMobileOpen(false)}
              >
                <span aria-hidden="true">❤️</span> Favorites
              </Link>
              {user && (
                <Link
                  href="/dashboard"
                  className="sheet-nav-item"
                  onClick={() => setMobileOpen(false)}
                >
                  <span aria-hidden="true">📊</span> Dashboard
                </Link>
              )}
              <Link
                href="/listings/new"
                className="sheet-nav-item primary"
                onClick={() => setMobileOpen(false)}
              >
                <span aria-hidden="true">➕</span> Post listing
              </Link>

              <div className="sheet-divider" />

              <MobileSheetThemeToggle />

              <div className="sheet-divider" />

              {!user ? (
                <Link
                  href="/auth/signin"
                  className="sheet-nav-item"
                  onClick={() => setMobileOpen(false)}
                >
                  <span aria-hidden="true">🔑</span> Sign in
                </Link>
              ) : (
                <>
                  <div className="sheet-user-info">
                    Signed in as {user?.displayName || user?.email?.split("@")[0] || "Account"}
                  </div>
                  <MobileSignOutButton onClose={() => setMobileOpen(false)} />
                </>
              )}
            </nav>
          </>
        )}
      </aside>
    </>
  );
}
export function Navbar() {
  return (
    <Suspense fallback={
      <header className="shell-navbar" role="banner">
        <div className="shell-navbar-inner" />
      </header>
    }>
      <NavbarInner />
    </Suspense>
  );
}
