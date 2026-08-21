# Thrift & Co. — Product Requirements Document (MVP)

**Status**: Approved for NEXUS-Sprint build · **Date**: 2026-08-22 · **Owner**: Founder
**Stack (locked)**: Next.js (App Router) + Firebase (Auth email/password, Firestore, Storage) → Vercel
**Grounding**: Feature list derived from prototype `deepseek_html_20260819_5af3e2.html` (marketplace UI with 6 categories, 7-level condition scale, card fields title/price/condition/location). Prototype's admin panel and cart are **dropped** per locked scope; its emoji placeholders are replaced by real photo uploads.

---

## 1. Problem Statement

People have usable secondhand items sitting idle and no lightweight way to list them locally, while bargain hunters have no simple, ad-free place to browse nearby thrift finds and reach a seller directly. Existing marketplaces are heavyweight (accounts, payments, chat, fees) before a single item changes hands.

**MVP thesis**: Prove the core loop — *see an item → contact the seller* — with zero transaction machinery. If people post listings and click "Contact Seller," the concept works and we invest further.

## 2. Target User

- **Sellers**: Individuals decluttering (apartment moves, closet purges, garage-sale leftovers) who want a free, 2-minute way to list an item with one photo.
- **Buyers**: Local thrift-hunters browsing on mobile, willing to email a seller to arrange pickup/payment themselves.
- Both are assumed non-technical; every flow must work on a phone.

## 3. Success Metrics — Week 1 Post-Launch

| Metric | Target (Week 1) | How measured |
|---|---|---|
| Listings posted | ≥ 20 | Firestore `listings` count |
| Contact-seller clicks | ≥ 30 | Client-side event logged on button click |
| Sign-ups | ≥ 15 | Firebase Auth user count |
| Activation rate | ≥ 40% of sign-ups post ≥ 1 listing | listings ÷ signups |
| Listing detail views | ≥ 150 | Page analytics |

Vanity guardrail: we do **not** optimize traffic in week 1 — the loop conversion (detail view → contact click) matters more than raw visits.

## 4. Core-Loop User Stories (5)

### US-1 — Email/password sign-up & sign-in
> As a visitor, I can create an account with email + password and sign in, so that I can post listings.

**Acceptance criteria**
- **Given** I am on `/signup`, **when** I submit a valid email and password (≥ 8 chars), **then** my account is created, I am signed in, redirected to home, and the header shows a signed-in state with sign-out.
- **Given** an invalid email or a password < 8 chars, **when** I submit, **then** I see an inline error and no account is created.
- **Given** an existing account, **when** I sign in with correct credentials, **then** I am signed in; with wrong credentials, **then** I see a generic error (no field-level leakage).
- **Given** I am signed in, **when** I reload the page, **then** my session persists.
- **Given** I am signed out, **when** I open `/post`, **then** I am redirected to sign-in and returned to `/post` after success.

### US-2 — Browse & search listings
> As a visitor (no account required), I can browse newest listings, filter by category, and search by keyword.

**Acceptance criteria**
- **Given** active listings exist, **when** I open the home page, **then** a responsive grid shows them newest-first with photo, title, price, condition badge, and location.
- **Given** I tap a category pill (the prototype's six: Electronics, Furniture, Books, Clothing, Home, Other), **when** selected, **then** only that category shows; "All" resets.
- **Given** I type ≥ 2 characters in the search box, **when** results update, **then** the grid shows listings whose title matches case-insensitively; an empty state appears if none match.
- **Given** many listings, **when** I reach the end of a page, **then** "Load more" fetches the next batch (no unbounded reads).
- **Given** slow or failed loads, **then** skeletons show while loading and an error state with retry on failure.

### US-3 — Listing detail page
> As a visitor, I can open any listing to see full item details and the seller-contact action.

**Acceptance criteria**
- **Given** a listing card, **when** I click it, **then** the detail view (`/listing/[id]`) shows photo, title, price, condition, description, location, and posted date.
- **Given** a deleted or nonexistent listing id, **when** I open its URL, **then** I see a friendly not-found state (no crash).
- **Given** any visitor on a detail page, **when** it renders, **then** a prominent "Contact Seller" action is visible (behavior defined in US-5).
- **Given** I use browser back from detail, **when** returning, **then** I land back on the grid.

### US-4 — Post a listing with photo upload
> As a signed-in seller, I can publish a listing with details and one photo in under two minutes.

**Acceptance criteria**
- **Given** I am signed in, **when** I open `/post`, **then** the form offers title (required, ≤ 80 chars), price USD (> 0), category (fixed list), condition (prototype's scale: New → Poor), location (required), description (optional, ≤ 2000 chars), and one photo.
- **Given** I select a file > 5 MB or a non-image, **when** chosen, **then** it is rejected with a clear message; valid images are compressed client-side (max ~1200 px, JPEG) before upload.
- **Given** a valid form, **when** I submit, **then** the photo uploads to Storage, the listing document is written with my uid, and I am redirected to the new listing's detail page.
- **Given** an upload or write failure mid-submit, **then** I see an error, nothing partial is published, and my form input is preserved.
- **Given** a signed-out visitor, **when** hitting the submit endpoint/rule, **then** Firestore rules reject the write.

### US-5 — Contact seller ⭐ *recommended approach: mailto*
> As an interested buyer, I can contact the seller by email with one click.

**Recommendation**: Use a **`mailto:` link** (pre-filled subject/body referencing the listing), not revealed contact info. Rationale: zero PII displayed publicly (no scraping/spam harvest), no extra backend surface, and clicks can still be counted via a client-side event fired before the mail client opens — satisfying our week-1 metric. A small "copy email" fallback covers users without a configured mail client.

**Acceptance criteria**
- **Given** I am on a listing detail page, **when** I click "Contact Seller", **then** my default mail client opens addressed to the seller's email with subject `"Thrift & Co.: {listing title}"` and a short pre-filled body including the listing link.
- **Given** the click, **when** the mailto fires, **then** a contact-click event is recorded (listingId + timestamp) for the week-1 metric.
- **Given** I prefer not to use my mail client, **when** I click "Copy email", **then** the seller's address is copied and confirmed with a toast.
- **Given** a listing whose seller account was deleted, **when** I view contact actions, **then** they degrade gracefully (copy disabled / notice shown), never crashing the page.

## 5. Out of Scope (explicitly excluded — do not build)

Per locked MVP scope: payments/checkout · reviews · favorites/watchlist · seller profile pages · chat/messaging threads · admin panel (note: present in the HTML prototype — do **not** port it; takedowns happen via Firebase console for now).

Also deferred: social login, email verification enforcement, multi-photo galleries, saved searches, notifications, i18n, native apps.

## 6. Key Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| **Firebase quota exhaustion** (Spark free tier ≈ 50k doc reads/day, 20k writes/day) | App breaks mid-launch week | Paginated reads ("Load more", cap 12/page); category filter server-side; set GCP budget alert day 1; monitor usage daily during launch week |
| **Photo storage cost/bloat** (users upload huge originals) | Storage fills (1 GB Spark cap), slow pages | Mandatory client-side compression before upload; 5 MB hard limit; exactly 1 photo per listing; Storage rules enforce content-type + size |
| **Spam listings** | Marketplace becomes unusable, quota burn | Posting requires auth; strict field validation + length caps; Firestore rules pin `sellerId = request.auth.uid`; founder can delete docs from console within minutes |

Secondary risks tracked but accepted for MVP: mailto fails on devices without a mail app (mitigated by copy-email fallback); Firestore has no native substring search (client-side filter over fetched pages is fine at < ~500 listings; revisit with Algolia/Typesense if search becomes a bottleneck).

## 7. Open Questions (need founder input)

1. **Brand**: Final name/logo assets? Trademark check done?
2. **Categories**: Keep the prototype's six, or adjust before launch?
3. **Photos**: Confirm 1 photo per listing for launch, or is 3 required?
4. **Email verification**: Block posting until verified, or trust email/password for week 1?
5. **Moderation policy**: Post-first (takedown on report) acceptable at launch?
6. **Domain**: Custom domain for Vercel, or ship on `*.vercel.app`?
7. **Currency/locale**: USD-only confirmed?

---

*Scope discipline note: this PRD describes a deliberately small loop. Every feature above maps 1:1 to a sprint task in `SPRINT-PLAN.md`. Anything not written here is a "no" until week 2.*
