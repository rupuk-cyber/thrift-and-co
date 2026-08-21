# Thrift & Co.

Secondhand marketplace MVP — browse, search, and post used-item listings with email/password auth and a contact-seller flow. Built as a 1-week sprint to production on Vercel.

## Stack

Next.js (App Router, TypeScript) + Firebase (Auth / Firestore / Storage), deployed on Vercel.

## Prerequisites

- Node.js 24+
- A Firebase project (see setup below)

## Local setup

1. Copy the example env file and fill in your Firebase web app config:

   ```bash
   cp .env.example .env.local
   ```

2. Install dependencies and start the dev server:

   ```bash
   npm install
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000).

## Firebase console setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com) (e.g. `thrift-and-co-prod`).
2. **Authentication → Sign-in method → Email/Password** → enable it.
3. **Firestore Database** → create in production mode; note the region.
4. **Storage** → enable it (same region as Firestore).
5. **Project settings → Your apps** → register a Web app → copy the `firebaseConfig` values into `.env.local`.
6. Deploy security rules (`firestore.rules`, `storage.rules` at the repo root): `firebase deploy --only firestore:rules,storage:rules`.

## Deploy to Vercel

1. Import the repository at [vercel.com/new](https://vercel.com/new).
2. Set **Root Directory** to `web`.
3. Add all six `NEXT_PUBLIC_FIREBASE_*` variables from `.env.example` to both the **Production** and **Preview** environments.
4. Deploy — pushes to `main` go to production; pull requests get preview deployments automatically.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | Type-check without emitting (same check CI runs) |
