# Thrift & Co. — 1-Week Sprint Plan (NEXUS-Sprint mode)

**Sprint goal**: Ship the 5 core-loop stories (US-1…US-5 from `PRD.md`) to production on Vercel by end of week.
**Team**: Backend Architect · Frontend Dev · DevOps Automator (parallel workstreams) → QA gate → Launch.
**Stack (locked)**: Next.js App Router + TypeScript, Firebase (Auth/Firestore/Storage), Vercel.

**Working agreement**: Days 1–5 build in parallel; Day 6 = QA gate (hard stop); Day 7 = launch. Feature freeze at end of Day 5. Bugs found at QA get fixed before anything else.

---

## Day-by-Day Plan

### Day 1 — Foundations
| Workstream | Tasks |
|---|---|
| **DevOps** | Init repo + Next.js (App Router, TS, ESLint). Scaffold `.env.example` for all `NEXT_PUBLIC_FIREBASE_*` vars. Create Vercel project, deploy a placeholder build same day. |
| **Backend** | Firebase project config module (client SDK init). Define Firestore data model + TS types: `listings { id, sellerId, sellerEmail, title, description, priceUsd, category(6), condition(7-level), location, imageUrl, status:'active', createdAt, updatedAt }`. Draft security rules (public read active listings; create only when authed and `sellerId == auth.uid`; update/delete owner-only). Seed script with the prototype's 6 sample items. |
| **Frontend** | Port prototype design tokens (palette, radii, type scale) into global styles. Build app shell: sticky header (logo, sign-in/account slot), footer, responsive container. Route map: `/`, `/listing/[id]`, `/post`, `/signin`, `/signup`. |

**🔗 Checkpoint A (EOD Day 1)**: Placeholder deployed to Vercel preview; types + rules reviewed and merged; seed data renders in a stub grid.

### Day 2 — Auth + browse skeleton
| Workstream | Tasks |
|---|---|
| **Backend** | Wire Auth email/password helpers (`signUp`, `signIn`, `signOut`, session observer). Deploy rules to a staging Firebase project / emulator; write rule unit tests (anon read OK, anon write denied, cross-user edit denied). |
| **Frontend** | `/signup` + `/signin` pages with inline validation (US-1), auth state in header, protected-route redirect for `/post` incl. return-to-post. |
| **DevOps** | CI on every PR: lint + typecheck + production build must pass; preview deploy per PR. |

**🔗 Checkpoint B (EOD Day 2)**: Sign-up/sign-in works end-to-end against staging Firebase on a preview URL.

### Day 3 — Post-a-listing pipeline
| Workstream | Tasks |
|---|---|
| **Backend** | Storage path convention `listings/{listingId}/cover.jpg`; Storage rules (image content-types only, ≤ 5 MB, owner-scoped writes). Listing service: `createListing` transactional write after upload succeeds. |
| **Frontend** | `/post` form (US-4): all fields + validation, client-side image compression (max ~1200 px JPEG), upload progress + error states, redirect to new detail page. |
| **DevOps** | Add preview env vars wired to staging Firebase project so previews have working data. |

**🔗 Checkpoint C (mid-Day 3, hard gate)**: Auth → post listing w/ photo → doc visible in Firestore console, E2E on preview. If this slips, everything re-prioritizes around it — it's the spine of the loop.

### Day 4 — Browse/search + detail
| Workstream | Tasks |
|---|---|
| **Frontend** | Home grid newest-first with category pills + debounced title search + "Load more" pagination (US-2); `/listing/[id]` detail page (US-3) with not-found state; loading skeletons + error/retry states. |
| **Backend** | Listings query layer: ordered-by-createdAt paginated reads, category `where` filter server-side; verify rules against real reads. |
| **DevOps** | Lighthouse smoke run on preview; flag any p95 LCP > 2.5 s (image sizing usually the culprit). |

**🔗 Checkpoint D (EOD Day 4)**: Full loop except contact click demoable: browse → search → detail → (post already works).

### Day 5 — Contact-seller + polish (feature freeze EOD)
| Workstream | Tasks |
|---|---|
| **Frontend** | "Contact Seller" mailto button with pre-filled subject/body + "Copy email" fallback + toast (US-5); contact-click event instrumentation; mobile pass at 375 px across all pages; empty states. |
| **Backend** | Rules final review; confirm denormalized `sellerEmail` present on every listing; graceful degradation check for deleted sellers. |
| **DevOps** | Production env var checklist prepared; rollback procedure documented (Vercel instant rollback to previous deployment). |

**🔗 Checkpoint E (EOD Day 5)**: All 5 stories demoable on preview. **Feature freeze.**

### Day 6 — QA Gate (must pass before any prod deploy)
Run the full gate below; fix and re-run until green. No new features.

### Day 7 — Launch day
Founder manual setup (below) → production deploy → smoke test → announce.

---

## QA Gate Criteria (all must pass)

- [ ] `npm run lint` — zero errors/warnings
- [ ] `npx tsc --noEmit` — clean
- [ ] `npm run build` — production build succeeds
- [ ] **All 5 user stories demoable end-to-end** on the Vercel preview, executed as a scripted walkthrough: sign up → browse → search/filter → open detail → post listing w/ photo → contact-seller mailto fires
- [ ] Security rules verified: anonymous reads allowed, anonymous writes denied, user B cannot edit/delete user A's listing, oversized/non-image uploads rejected
- [ ] Mobile spot-check at 375 px width: home, detail, post form, auth pages usable
- [ ] No console errors on core paths; friendly states confirmed for empty results, not-found listing, failed upload
- [ ] Contact-click event observed firing exactly once per click

## Launch-Day Checklist

### Founder manual steps (Firebase console — ~20 min, cannot be automated)
1. **Create Firebase project** named e.g. `thrift-and-co-prod` (Google Analytics optional).
2. **Enable Authentication → Sign-in method → Email/Password**.
3. **Create Firestore database** in **production mode**; pick region (e.g. `us-central1`) — note it, Storage must match.
4. **Enable Storage** (same region).
5. **Register a Web app** in Project Settings → copy the `firebaseConfig` values.
6. **Paste config into Vercel** → Project → Settings → Environment Variables (Production): `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`.
7. **Set a GCP budget alert** (e.g. $10 threshold) on the project's billing account.
8. (Optional) Add custom domain in Vercel.

### DevOps/launch steps (after founder steps)
1. Deploy security rules: `firebase deploy --only firestore:rules,storage:rules` (founder runs `firebase login` once).
2. Trigger production deploy from `main`.
3. Smoke test in production with two real accounts: US-1 → US-2 → US-3 → US-4 (real photo) → US-5 (mailto opens with correct subject).
4. Verify Firestore + Storage show real writes; delete test data via console.
5. Confirm rollback command known: Vercel → Deployments → previous → "Promote to Production".

---

*Risks and scope boundaries live in `PRD.md` §5–6. If any Day-3 checkpoint slips more than half a day, cut search polish and photo compression quality options first — never the core loop.*
