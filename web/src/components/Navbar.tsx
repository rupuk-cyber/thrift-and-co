"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
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

export function Navbar() {
  const { user, loading } = useAuth();

  return (
    <header className="header">
      <div className="container header-inner">
        <nav className="navbar-inner" aria-label="Main navigation">
          <Link href="/" className="logo">
            <span className="logo-icon" aria-hidden="true">
              🛍️
            </span>
            Thrift<span>&</span>Co.
          </Link>
          <div className="nav-actions">
            <ThemeToggle />
            {!loading && !user && (
              <>
                <Link href="/auth/signin" className="admin-toggle-btn">
                  <span aria-hidden="true">🔑</span> Sign in
                </Link>
                <Link href="/listings/new" className="cart-btn">
                  <span aria-hidden="true">➕</span> Post listing
                </Link>
              </>
            )}
            {!loading && user && (
              <>
                <Link href="/listings/new" className="cart-btn">
                  <span aria-hidden="true">➕</span> Post listing
                </Link>
                <AccountMenu />
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
