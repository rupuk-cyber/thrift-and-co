# Thrift & Co. — Glassmorphic Redesign Spec ("Apple design team" quality bar)

## Goal
Transform the current warm-paper marketplace into an Apple-quality glassmorphic (frosted-glass) UI: translucent layered surfaces, backdrop blur, soft depth, precise typography, restrained color.

## Hard rules
1. ONLY CSS + minimal JSX class changes. Do NOT touch business logic, Firebase calls, routing, state, or data flow.
2. Keep ALL existing CSS custom property names that JS or TSX reference (--accent, --text-primary, --bg-primary, --radius, --shadow, --transition, etc.) — redefine their values, never delete them.
3. Preserve accessibility: the --on-accent token must keep >=4.5:1 contrast on accent fills in BOTH themes. Keep .sr-only and focus-visible styles.
4. Both light AND dark themes must look intentional ([data-theme="dark"] overrides required).
5. Keep the existing warm amber accent (#b8875a light / #d4a373 dark) as the brand thread — glassmorphism changes surfaces, not brand.
6. Performance: backdrop-filter blur <= 24px; avoid nesting blurred elements more than 2 deep; add @supports fallbacks (solid rgba background when backdrop-filter unsupported).
7. No external dependencies, no new packages, no Tailwind — plain CSS only.

## Glass recipe (canonical)
- --glass-bg: rgba(255,255,255,0.55) light / rgba(30,28,25,0.55) dark
- --glass-border: rgba(255,255,255,0.6) light / rgba(255,255,255,0.12) dark
- --glass-blur: saturate(180%) blur(20px)
- --glass-shadow: 0 8px 32px rgba(26,24,22,0.12) light / deeper for dark
- 1px inner highlight via inset box-shadow top edge (light stroke).

## Division of work (do NOT cross into another agent's files)
- Agent TOKENS: owns `src/app/globals.css` lines 1–130 (the :root and [data-theme="dark"] blocks only) + appends an ambient background layer (body::before/after gradient orbs).
- Agent SURFACES: owns component styling sections in `src/app/globals.css` (navbar, cards, buttons, modals, pills, toasts, forms, dropzone, skeletons) — everything AFTER the token blocks.
- Agent PAGES: owns JSX layout/markup polish in `src/app/page.tsx`, `src/app/layout.tsx`, `src/components/HomeBrowser.tsx`, `Navbar.tsx`, `ProductCard.tsx`, `Modal.tsx` — class names and structural wrappers ONLY (e.g. adding a `.hero-orb` container or `aria-hidden` decorative elements). No logic edits.

## Verification gate (every agent must pass)
- `npm run build` in web/ completes with zero errors.
- No hardcoded colors outside the :root/[data-theme=dark] token blocks for anything theme-dependent.
