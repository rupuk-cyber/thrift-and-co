# Deployment Configuration-Parity Audit — Thrift & Co. MVP

Date: 2026-08-22 · Auditor: Backend Architect · Project: `thriftandco-83b6e` (Firebase) / `thriftandco-83b6e` (Vercel)

## Findings

| # | Area | Finding | Verdict |
|---|------|---------|---------|
| 1 | Firestore rules parity | Live release `cloud.firestore` → ruleset `d26c525c-90ce-4ad1-b596-8ee5fa19bcd4`; SHA256 of live source (`C100F577…6731CE`) identical to local `web/firestore.rules`, including the dual Cloudinary + firebasestorage imageUrl domain check | ✅ In parity — no redeploy performed |
| 2 | Storage rules | `web/storage.rules` exists locally and is wired in `firebase.json`, but no `cloud.storage` release exists on the project (only `cloud.firestore`); Storage bucket not provisioned (Blaze plan required). Rules are intentionally dormant; photo serving/writes use Cloudinary unsigned uploads exclusively | ✅ Dormant by design |
| 3 | Env completeness | Code consumes exactly 8 vars (6 Firebase + 2 Cloudinary, all in `src/lib/firebase.ts` + `src/lib/listings.ts`). Both present in `.env.example` and populated in `.env.local` | ✅ Complete — no orphan/missing vars |
| 4 | Missing-var error path | `requireConfig()` in `src/lib/firebase.ts` collects ALL missing Firebase vars and names them in one thrown error at first lazy init call | ✅ Passes |
| 5 | Cloudinary failure modes | `uploadImage()` throws naming both Cloudinary vars when unset, surfaces HTTP status on failed upload, rejects non-Cloudinary `secure_url` responses | ✅ Actionable errors |
| 6 | Storage SDK residue | `getFirebaseStorage()` was exported from `src/lib/firebase.ts` with zero consumers, keeping a live `firebase/storage` import. **Fixed**: import + export removed (minimal diff); `tsc --noEmit` clean; zero `firebase/storage` references remain in `src` | ✅ Fixed this audit |
| 7 | SSR risk — `/listings/[id]` | Lazy `resolveApp()` means build/prerender never initializes Firebase without creds (no top-level calls). At request time, `getListing()` returns the friendly "no longer available" state only for genuinely-missing docs; a transient Firestore outage makes `getDoc` reject and there is no `error.tsx` boundary → visitor sees Next.js raw production error page | ⚠️ Accepted MVP debt (documented, not changed) |
| 8 | SSR blast radius | Home `/` is fully client-side (`HomeBrowser.tsx` is `"use client"` under `<Suspense>`); `/listings/[id]` is the ONLY server-render Firestore call site | ℹ️ Informational |

## Canonical env var list for Vercel (all 8 required)

All are `NEXT_PUBLIC_*` (inlined into client bundle — must be set before build):

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN      # thriftandco-83b6e.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID       # thriftandco-83b6e
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET   # thriftandco-83b6e.firebasestorage.app (unused by code; harmless)
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME     # jnondibj
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET  # thriftandCo (must remain UNSIGNED)
```

Values mirror `web/.env.local`. After setting them on Vercel, trigger a fresh deployment — `NEXT_PUBLIC_*` values are baked at build time.

## Actions taken

1. Verified live Firestore rules via Firebase CLI (`firestore:databases:list`) + Firebase Rules REST API (releases → ruleset source). Local == live; no redeploy executed.
2. Removed dead `firebase/storage` dependency from `web/src/lib/firebase.ts` (import + unused `getFirebaseStorage()` export). Typecheck clean.
3. Wrote this audit document (`docs/DATA-LAYER-VERIFY.md` did not exist at write time).

## Open items for founder

1. **Vercel Deployment Protection** — being disabled separately (out of audit scope).
2. **Mirror the 8 env vars into Vercel** project settings (see list above), then redeploy.
3. **Accepted MVP debt**: transient Firestore unreachability on `/listings/[id]` shows Next's raw error boundary instead of a friendly state. Add an `error.tsx` boundary post-MVP.
4. **Storage provisioning deferred**: if migrating off Cloudinary later, upgrade to Blaze, provision the default bucket, then deploy `--only storage:rules` (`web/storage.rules` is ready but intentionally dormant).
