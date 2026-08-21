# Thrift & Co. — Launch Checklist

Status: **CERTIFIED FOR LAUNCH** (code-level, see `docs/QA-EVIDENCE.md` → REALITY CHECK VERDICT)

## Founder actions (~30 min, all config — no code changes needed)

1. [ ] Create Firebase project at https://console.firebase.google.com
2. [ ] Register a Web app → copy the 6 `firebaseConfig` values
3. [ ] `cp web/.env.example web/.env.local` → paste values
4. [ ] Authentication → Sign-in method → enable **Email/Password**
5. [ ] Firestore Database → create in **production mode** (note region)
6. [ ] Create a free Cloudinary account (https://cloudinary.com) — no card needed; copy your **Cloud Name**, then Settings → Upload → Upload presets → add one with signing mode **Unsigned** → copy its name
7. [ ] Put `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` + `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` into `.env.local`
8. [ ] Deploy Firestore rules: `cd web && npx firebase-tools login && npx firebase-tools deploy --only firestore:rules` ✅ DONE
9. [ ] Push to GitHub (see repo layout decision below)
10. [ ] Vercel: import repo → set env vars (Production **and** Preview): all six `NEXT_PUBLIC_FIREBASE_*` plus both `NEXT_PUBLIC_CLOUDINARY_*`
11. [ ] Deploy → run the smoke test below
12. [ ] Recommended: restrict Firebase authorized domains to your Vercel domain; set a ~$10 GCP budget alert

## Repo layout decision (pick ONE before step 8)

- **Option A (recommended):** `git init` in `Second hand Webapp\` (parent), commit everything, push. In Vercel set **Root Directory = `web`**. Keeps `docs\` and the original prototype versioned with the app.
- **Option B:** push only `web\` as the repo root (a git repo already exists there). Vercel Root Directory stays default. Docs/prototype live outside version control.

Note: if you use Option B, delete the nested `.git` confusion risk — never nest one repo inside another without ignoring.

## Production smoke test (run immediately after first deploy)

1. Sign up a real account → verify session persists on refresh
2. Post a listing with a photo → confirm it appears on home grid
3. Browse/search/filter categories → open listing detail
4. Contact Seller → mailto opens with prefilled subject/body
5. Signed out → `/listings/new` redirects to sign-in and returns after auth
6. Attempt an unauthenticated Firestore write (console) → must be REJECTED

## Week-3 Growth Team activation

Trigger: any two of — ≥20 listings posted, ≥15 signups, ≥30 contact-seller clicks (PRD success metrics).
Roster activates: Growth Hacker, Content Creator, Social Media Strategist.
Analytics hook already wired: contact clicks push `{event:'contact_seller', listingId}` onto `window.dataLayer` — attach GA4 there.
