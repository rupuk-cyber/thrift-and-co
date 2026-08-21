# QA Evidence — Thrift & Co. MVP Gate

**Runbook role**: Evidence Collector (observe & record only — no repairs attempted)
**Working directory**: `web\`
**Evidence date**: 2026-08-22 03:07:09 +08:00

---

## Environment Facts

| Item | Value |
|---|---|
| Node | v24.12.0 |
| npm | 11.11.1 |
| next (package.json) | 16.3.2 |
| react / react-dom | 19.2.8 |
| firebase | ^12.18.0 |
| typescript | ^5 (devDep) |
| eslint | ^9 (devDep, flat config; `lint` script = `eslint`) |
| Firebase env vars in this environment | NONE present — build must succeed via lazy init (`src/lib/firebase.ts` defers config read to `requireConfig()`, called only inside `getFirebaseAuth/getFirestoreDb/getFirebaseStorage`) |

---

## Checks 1–3: Build Gate Results

| # | Check | Command | Exit Code | Status | Key Output Excerpt |
|---|---|---|---|---|---|
| 1 | Lint | `npm run lint` | **1** | ❌ **FAIL** | `✖ 8 problems (5 errors, 3 warnings)` — 5× `react-hooks/set-state-in-effect` errors, 3× `@next/next/no-img-element` warnings (detail below) |
| 2 | Type check | `npx tsc --noEmit` | 0 | ✅ PASS | No output (clean) |
| 3 | Build | `npm run build` | 0 | ✅ PASS | `▲ Next.js 16.3.2 (Turbopack)` · `✓ Compiled successfully in 2.4s` · `Finished TypeScript in 1137ms` · `Generating static pages … (7/7)`. Built with **zero Firebase env vars set** → lazy init confirmed working |

### Check 1 verbatim error list (blocking)

All 5 errors are rule `react-hooks/set-state-in-effect` ("Calling setState synchronously within an effect can trigger cascading renders"):

```
src/components/ContactSellerActions.tsx
  28:5   error  react-hooks/set-state-in-effect   setOrigin(window.location.origin)

src/components/HomeBrowser.tsx
  38:5   error  react-hooks/set-state-in-effect   setCategory(initialCategory); setQuery(initialQuery); setInputValue(initialQuery)
  83:10  error  react-hooks/set-state-in-effect   void loadFirstPage()

src/components/Modal.tsx
  21:5   error  react-hooks/set-state-in-effect   setMounted(true)

src/components/ThemeProvider.tsx
  29:5   error  react-hooks/set-state-in-effect   setThemeState(current)
```

Non-blocking warnings (`@next/next/no-img-element`):

```
src/app/listings/[id]/page.tsx   32:17  warning
src/components/PhotoDropzone.tsx 94:11  warning
src/components/ProductCard.tsx   13:11  warning
```

### Check 3 build route table (verbatim)

```
Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /auth/signin
├ ○ /auth/signup
├ ƒ /listings/[id]
└ ○ /listings/new

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

---

## Check 4: Static Route ↔ PRD Story Mapping

Route directories found under `web/src/app`: `auth/signin`, `auth/signup`, `listings/[id]`, `listings/new`, root `/`.

| Story | PRD Summary | Route(s) | Implementing Files Present | Confirmed |
|---|---|---|---|---|
| US-1 | Email/password sign-up & sign-in | `/auth/signup`, `/auth/signin` | `src/app/auth/signup/page.tsx`, `src/app/auth/signin/page.tsx`; components: `SignInForm.tsx`, `SignUpForm.tsx`, `AuthProvider.tsx`, `authErrors.ts` | ✅ |
| US-2 | Browse & search listings | `/` | `src/app/page.tsx` (imports + renders `HomeBrowser`, verified line 2/8); components: `HomeBrowser.tsx`, `ProductCard.tsx`, `CategoryPills.tsx`, `EmptyState.tsx`, `Skeletons.tsx`; data: `src/lib/listings.ts` | ✅ |
| US-3 | Listing detail page | `/listings/[id]` | `src/app/listings/[id]/page.tsx`; also `not-found.tsx` at app root for friendly 404 | ✅ |
| US-4 | Post a listing with photo upload | `/listings/new` | `src/app/listings/new/page.tsx` (renders `PhotoDropzone`, verified line 13/226); components: `PhotoDropzone.tsx`, `photo.ts` (client-side compression), `Modal.tsx`, `Field.tsx`; data: `src/lib/listings.ts` | ✅ |
| US-5 | Contact seller (mailto recommended) | component on detail page | `src/components/ContactSellerActions.tsx` — contains `mailto:` link builder (line 20), `copyEmail` via `navigator.clipboard` + toast confirmation (lines 51–54); imported and rendered by `src/app/listings/[id]/page.tsx` line 4/56 | ✅ |

**Result**: All 5 core-loop stories have implementing files present and correctly wired.

---

## Check 5: Security Rules Audit

| File | Exists | One-sentence enforcement summary |
|---|---|---|
| `firestore.rules` | ✅ (57 lines) | Public read of `listings`, but create requires auth plus strict schema validation (field allowlist, length caps, fixed category/condition enums, Storage-hosted image URL), update/delete restricted to the listing's own seller with immutable `sellerId`/`createdAt`. |
| `storage.rules` | ✅ (21 lines) | Public read of listing photos under `listings/{uid}/{fileName}`, but writes require the authenticated owner's uid matching the path segment, size ≤ 5 MB, and content type limited to JPEG/PNG/WebP. |

---

## GATE VERDICT

**FAIL**

Blocking items:

1. **Check 1 — `npm run lint` exited 1**: 5 ESLint errors (`react-hooks/set-state-in-effect`) in `ContactSellerActions.tsx:28`, `HomeBrowser.tsx:38`, `HomeBrowser.tsx:83`, `Modal.tsx:21`, `ThemeProvider.tsx:29`. (3 `no-img-element` warnings are non-blocking.)

Not blocking (passed): Check 2 `tsc --noEmit` exit 0 · Check 3 `next build` exit 0 (incl. no-env lazy init) · all 5 PRD stories have implementing files · both rules files exist.

---

*QA Agent: EvidenceQA (Evidence Collector role) · Run executed per Startup MVP Build runbook, checks in order, no fixes applied.*

---

# Re-verification (post-fix pass)

**Evidence date**: 2026-08-22 03:23:38 +08:00
**Role**: Evidence Collector (observe & record only — no repairs attempted)
**Purpose**: Re-run build gate after developer's lint fix pass targeting the 5 prior `react-hooks/set-state-in-effect` errors.

## Checks 1–3: Re-verification Results

| # | Check | Command | Exit Code | Status | Key Output Excerpt |
|---|---|---|---|---|---|
| 1 | Lint | `npm run lint` | **1** | ❌ **FAIL** | `✖ 4 problems (1 error, 3 warnings)` — residual `react-hooks/set-state-in-effect` **error** at `src/components/HomeBrowser.tsx 79:10` (`void loadFirstPage()` called synchronously inside `useEffect`, deps `[loadFirstPage, reloadToken]`); 3× `@next/next/no-img-element` warnings unchanged |
| 2 | Type check | `npx tsc --noEmit` | 0 | ✅ PASS | No output (clean) |
| 3 | Build | `npm run build` | 0 | ✅ PASS | `▲ Next.js 16.3.2 (Turbopack)` · `✓ Compiled successfully in 208ms` · `Finished TypeScript in 1026ms` · `Generating static pages … (7/7)`. Route list below |

### Check 3 route table (verbatim)

```
Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /auth/signin
├ ○ /auth/signup
├ ƒ /listings/[id]
└ ○ /listings/new

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

### Check 1 verbatim residual error

```
C:\Users\juden\Downloads\Second hand Webapp\web\src\components\HomeBrowser.tsx
  79:10  error  Error: Calling setState synchronously within an effect can trigger cascading renders
...
  78 |   useEffect(() => {
> 79 |     void loadFirstPage();
     |          ^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
  80 |   }, [loadFirstPage, reloadToken]);
  react-hooks/set-state-in-effect
```

## Prior Violations vs. Observed Post-Fix State

Observed facts from this run's lint output + source greps:

| Prior violation (first pass) | Post-fix status | Evidence |
|---|---|---|
| `ContactSellerActions.tsx:28` | ✅ Cleared | No longer flagged by ESLint; source now uses `useSyncExternalStore(subscribeNoop, getOrigin, getOriginServer)` (line 29) |
| `HomeBrowser.tsx:38` (state-init trio) | ✅ Cleared | No longer flagged by ESLint; effect-restructured |
| `HomeBrowser.tsx:83` (`void loadFirstPage()`) | ❌ **PERSISTS** | Still flagged — same pattern relocated to **line 79** after restructuring |
| `Modal.tsx:21` | ✅ Cleared | No longer flagged; source now uses `useSyncExternalStore(subscribeNoop, getMountedClient, getMountedServer)` (line 22) |
| `ThemeProvider.tsx:29` | ✅ Cleared | No longer flagged; source now uses `useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getThemeServerSnapshot)` (line 42) |

**Suppression check (grep, observed)**: `eslint-disable` searched across all of `web\src` → **0 matches**. The remediations were done without any ESLint suppressions. Method confirmed in source for 3 of the 4 cleared sites via `useSyncExternalStore` adoption (ThemeProvider, Modal, ContactSellerActions); HomeBrowser state-init pair cleared via effect restructuring.

**Summary**: 4 of 5 prior violations remediated cleanly; 1 remains blocking (`HomeBrowser.tsx:79`).

## Environment Facts (re-verification run)

| Item | Value |
|---|---|
| Node | v24.12.0 |
| npm | 11.11.1 |
| Next.js (build banner) | 16.3.2 (Turbopack) |
| Working directory | `web\` (checks run in declared order: lint → tsc → build) |
| Fixes applied by QA during this pass | None — observe & record only |

## GATE VERDICT (re-verification)

**FAIL**

Reason: Gate requires all three checks to exit 0. Check 1 (`npm run lint`) exited **1** due to the residual `react-hooks/set-state-in-effect` error in `HomeBrowser.tsx:79`. Checks 2 and 3 exited 0 (tsc clean; production build compiled successfully with the full route table above).

Blocking item for next fix pass: eliminate the synchronous `loadFirstPage()` call inside the `HomeBrowser` effect (e.g., move invocation out of the effect body or adopt a subscribe-based data-load pattern consistent with the other four remediations).

---

*QA Agent: EvidenceQA (Evidence Collector role) · Re-verification executed per Startup MVP Build runbook, checks in order, exit codes captured, no fixes applied.*

---

# Final Verification (post-fix — HomeBrowser.tsx setTimeout macrotask deferral)

**Evidence date**: 2026-08-22 03:28:39 +08:00
**Role**: Evidence Collector (observe & record only — no repairs attempted)
**Purpose**: Final gate re-verification after the developer resolved the last residual lint error (`HomeBrowser.tsx` synchronous `void loadFirstPage()` inside `useEffect`, previously flagged at line 79) via `setTimeout` macrotask deferral.

## Checks 1–3: Final Results

| # | Check | Command | Exit Code | Status | Key Output Excerpt |
|---|---|---|---|---|---|
| 1 | Lint | `npm run lint` | 0 | ✅ **PASS** | `✖ 3 problems (0 errors, 3 warnings)` — only the 3 known non-blocking `@next/next/no-img-element` warnings (`src/app/listings/[id]/page.tsx 32:17`, `src/components/PhotoDropzone.tsx 94:11`, `src/components/ProductCard.tsx 13:11`). The prior `react-hooks/set-state-in-effect` error in `HomeBrowser.tsx` no longer appears |
| 2 | Type check | `npx tsc --noEmit` | 0 | ✅ **PASS** | No output (clean) |
| 3 | Build | `npm run build` | 0 | ✅ **PASS** | `▲ Next.js 16.3.2 (Turbopack)` · `✓ Compiled successfully in 168ms` · `Finished TypeScript in 902ms` · `Generating static pages … (7/7)` |

## HomeBrowser.tsx Fix — Source Verification (verbatim, lines 78–83)

```tsx
useEffect(() => {
  const timeout = window.setTimeout(() => {
    void loadFirstPage();
  }, 0);
  return () => window.clearTimeout(timeout);
}, [loadFirstPage, reloadToken]);
```

Confirmed by direct source read: the effect no longer calls `loadFirstPage()` synchronously — it defers the invocation into a `window.setTimeout(..., 0)` macrotask and returns a `window.clearTimeout(timeout)` cleanup. The companion search-debounce effect (lines 37–44) uses the same `window.setTimeout` / `window.clearTimeout(timer)` pattern with cleanup on `[inputValue]`. No suppression comments involved.

## Suppression Check

Grep for `eslint-disable` across all of `web\src`: **0 matches**. All remediations across all three passes were implemented without any ESLint suppressions.

## Environment Facts (final verification run)

| Item | Value |
|---|---|
| Node | v24.12.0 |
| npm | 11.11.1 |
| Next.js (build banner) | 16.3.2 (Turbopack) |
| react / react-dom | 19.2.8 |
| firebase | ^12.18.0 |
| Working directory | `web\` (checks executed in declared order: lint → tsc → build) |
| Firebase env vars set during build | None — lazy-init path (`src/lib/firebase.ts`) exercised again; build still succeeded |
| Fixes applied by QA during this pass | None — observe & record only |

## Compiled Route Table (verbatim from build output)

```
Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /auth/signin
├ ○ /auth/signup
├ ƒ /listings/[id]
└ ○ /listings/new

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

## GATE VERDICT (final)

**PASS**

Reason: All three checks exited 0 — lint clean of errors, `tsc --noEmit` clean, production build compiled successfully and generated all 7 pages with the full route table above.

Non-blocking remainder (advisory only, does not affect the exit-code gate): 3 × `@next/next/no-img-element` warnings at `listings/[id]/page.tsx:32`, `PhotoDropzone.tsx:94`, `ProductCard.tsx:13`.

---

*QA Agent: EvidenceQA (Evidence Collector role) · Final verification executed per Startup MVP Build runbook, checks in order, exit codes captured, no fixes applied.*

---

# REALITY CHECK VERDICT

**Role**: Integration Agent / Reality Checker (independent verifier — observe only, no fixes applied)
**Assessment date**: 2026-08-22
**Working directory**: `web\`
**Method**: Independent re-verification. Nothing below is taken from prior agents' reports on faith; every claim was re-checked against source files or re-executed commands.

## 1. Gate History Coherence Review (docs\QA-EVIDENCE.md, read end-to-end)

The recorded gate history is **coherent and internally consistent**: initial FAIL (5× `react-hooks/set-state-in-effect` errors) → partial-fix FAIL (1 residual error relocated to `HomeBrowser.tsx:79` after restructuring, with a per-violation cleared/persists table) → final PASS (`HomeBrowser.tsx` setTimeout macrotask deferral). Line-number drift between passes is explicitly explained rather than papered over; suppression greps (`eslint-disable` → 0 matches) are documented per pass; route tables are reproduced verbatim and identical across passes. No fantasy indicators ("zero issues", perfect scores) appear anywhere in the record — the FAILs are honestly recorded. This is what credible QA evidence looks like.

## 2. Independent Gate Re-runs (my own exit codes, this environment)

| # | Command | My exit code | Result |
|---|---|---|---|
| 1 | `npm run lint` | **0** | 0 errors, 3 warnings — exactly the 3 known `@next/next/no-img-element` warnings at the same files/lines as recorded (`listings/[id]/page.tsx:32`, `PhotoDropzone.tsx:94`, `ProductCard.tsx:13`). No drift between doc and reality. |
| 2 | `npx tsc --noEmit` | **0** | Clean, no output. |
| 3 | `npm run build` | **0** | Turbopack compile success, TypeScript pass, 7/7 static pages generated; route table identical to all three recorded passes. Ran with **zero Firebase env vars set**, independently re-confirming lazy init. |

Suppression scan (my own grep, not inherited): `eslint-disable` across `web\src` → **0 matches**.

## 3. Substance Spot-checks (source-level, not compilation-only)

- **`web\firestore.rules`** — Unauthenticated users **cannot write anything**. Create requires `request.auth != null` plus strict schema validation: field allowlist (`hasOnly`, 11 fields), length caps, fixed category/condition enums, `imageUrl` must match `https://firebasestorage\.googleapis\.com/.+`, `sellerId == request.auth.uid`, `createdAt == request.time`. Update/delete restricted to owning seller with immutable `sellerId`/`createdAt`. Public read only.
- **`web\storage.rules`** — Public read of listing photos only. All writes require `request.auth != null && request.auth.uid == uid` matching the path segment, size ≤ 5 MB, MIME ∈ {JPEG, PNG, WebP}. Unmatched paths default-deny. Unauth write impossible.
- **`web\src\lib\firebase.ts`** — Missing config produces a **clear, actionable error**, not a silent crash: `requireConfig()` names every missing `NEXT_PUBLIC_FIREBASE_*` variable and instructs where to get values and to restart the dev server. Init is lazy (`resolveApp()` called only inside `getFirebaseAuth/getFirestoreDb/getFirebaseStorage`), which is why builds succeed env-less.
- **US-5 contact** — `web\src\components\ContactSellerActions.tsx`: `buildMailto()` (lines 12–25) composes subject/body/listing URL into a `mailto:` link (rendered line 64), with clipboard-copy fallback + toast and graceful degradation when `sellerEmail` is absent. Imported and rendered by `src/app/listings/[id]/page.tsx` lines 4/56. Confirmed.
- **US-4 auth gating** — `src/app/listings/new/page.tsx` gates posting behind auth client-side (`gated = loading || !user`, redirect to `/auth/signin?next=%2Flistings%2Fnew`, spinner while checking; lines 69–84) **and** server-side via rules (auth + `sellerId == request.auth.uid` required to create). Defense in depth present; the enforcement point that matters (rules) is server-side.
- **Write-path audit** — `src/lib/listings.ts` contains only create (`setDoc`) and reads; no `updateDoc`/`deleteDoc` anywhere in `src`. Client cannot even attempt disallowed operations.
- **Final HomeBrowser fix verified in source** — lines 78–83 match the QA record verbatim: `setTimeout(0)` macrotask deferral with cleanup, plus an `await Promise.resolve()` microtask hop inside `loadFirstPage` and a `requestRef` race guard. Genuine remediation, not suppression.
- **Config surface** — `.env.example` lists exactly the 6 variables `firebase.ts` requires. No real `.env.local`, no `firebase.json`, no `.firebaserc` exist — deployment configuration is genuinely not done yet (see founder actions).

## 4. Confirmed Strengths (with file references)

1. **Fail-closed security rules of genuinely good quality for an MVP**: `web\firestore.rules` (schema-validated, owner-scoped writes, Storage-URL-pinned images) + `web\storage.rules` (owner-matched path, size/MIME caps, default-deny). An anonymous visitor can read listings but can write nothing.
2. **Clean gates reproduced independently, with real fixes**: lint/tsc/build all exit 0 on my runs; zero ESLint suppressions anywhere; the last lint error was fixed by actual source restructuring (`HomeBrowser.tsx:78–83`).
3. **Honest failure modes**: missing Firebase config throws a named-variable actionable error (`firebase.ts:44–54`); data-layer input validation duplicates rule constraints client-side (`listings.ts assertValidInput`); error states and retry affordances exist in the UI (`HomeBrowser.tsx:159–172`).

## 5. Known Gaps / Limitations (blunt)

1. **No runtime verification whatsoever against real Firebase** — no credentials exist in this environment. Auth signup/sign-in, listing creation, photo upload, pagination cursor, and rules enforcement are **unproven at runtime**. The first live smoke test may still surface surprises (e.g., the `imageUrl.matches('https://firebasestorage\\.googleapis\\.com/...')` rule constraint vs. regional/custom bucket hostnames — verify on your actual project).
2. **No visual/screenshot QA and no E2E tests were performed** (by me or recorded in evidence). UI quality claims are therefore unverified; there are also no automated tests of any kind in the repo and no CI pipeline.
3. **Search is client-side over a fetched window** (`listings.ts:88` — fetch limit ×3 when searching): search matches nothing beyond roughly the first ~36 newest matching docs. Acceptable MVP scope, but it is shallow search, not real search.
4. **Firestore update path is de-facto dead** — the update rule requires both `createdAt == resource.data.createdAt` and `validListingData(...)`, which itself demands `createdAt == request.time`; these are jointly unsatisfiable, so updates always fail (fail-closed). Harmless today since no edit feature exists, but it is a trap for anyone adding "edit listing" later without rewriting the rule.
5. **Seller emails are publicly readable** — public `listings` read includes `sellerEmail`, so addresses are harvestable by scrapers. Inherent to the mailto design; accepted tradeoff, worth a deliberate product decision later.
6. **3 `no-img-element` warnings persist** (advisory): `<img>` instead of `next/image` costs LCP/bandwidth optimization on Vercel.
7. **No `firebase.json`/`.firebaserc`** — rules must be deployed via CLI init or pasted into console editors; nothing automates this yet.

## 6. Pending Founder Actions (known launch-blockers — configuration, not defects)

Nothing below works until done; none of it is a code defect:

1. **Create the Firebase project** and register a web app; copy the SDK config values.
2. **Fill `web\.env.local`** from `web\.env.example` (all 6 `NEXT_PUBLIC_FIREBASE_*` vars) for local dev.
3. **Set the same 6 env vars in Vercel** project settings (Production + Preview), then redeploy.
4. **Enable Authentication → Email/Password** provider in the Firebase console.
5. **Create the Firestore database** (production mode) and **deploy `firestore.rules`** (CLI or console editor — file exists in repo, nothing deploys it automatically).
6. **Enable Storage** and **deploy `storage.rules`** likewise.
7. **Run one end-to-end production smoke test**: sign up → post a listing with a photo → browse/search/filter → open detail → Contact Seller mailto; additionally confirm an unauthenticated write is rejected (rules actually live).
8. Recommended hardening (not blocking): restrict authorized domains to the Vercel domain; consider Firebase App Check before any publicity.

## 7. Verdict

Code-level quality is real — independently reproduced gates, fail-closed security rules verified line-by-line, all five PRD core-loop stories have genuine implementations, and the fix history is honest (FAIL → FAIL → PASS with no suppressions). Every remaining blocker is exclusively founder-side configuration listed above. Limitations in §5 are honest and mostly inherent to MVP scope; none blocks launch.

**PRODUCTION READINESS: CERTIFIED FOR LAUNCH**

*Caveat on scope*: this certifies code-level readiness only. It is NOT a runtime certification — perform founder action #7 immediately post-config and treat its results as the final word. Re-assessment required if rules change, an edit-listing feature is added, or the smoke test contradicts anything above.

---

*Reality Checker: TestingRealityChecker · Independent verification, no repairs applied · Evidence date 2026-08-22*
