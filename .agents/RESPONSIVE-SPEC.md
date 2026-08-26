# Thrift & Co. — Responsive Hardening Spec (Design Division)

## Mission
Make every page flawless at **desktop (1440)**, **tablet (768)**, and **mobile (390)**. No horizontal scroll anywhere, no clipped text, intentional layouts per breakpoint.

## AUDITED FINDINGS (measured via Playwright, not guessed)
1. `.hero-orbs` uses `inset: -20% -10%` → extends past viewport on ALL widths (5px desk / 58px tab / 20px mob horizontal overflow). Decorative element must never create scroll.
2. `.category-bar` at tablet: pills wrap OK, but bar relies on page-level wrap; on narrow mobile the wrapped rows look cramped (no scroll-snap row).
3. Dashboard `.stat-grid` = `repeat(auto-fit, minmax(180px,1fr))` → 4 cards squeeze into one row at tablet with ~90px cards, labels wrap awkwardly. Needs explicit tablet/mobile behavior.
4. PDP `.pdp-grid` is two-column on desktop; verify it collapses cleanly and the sticky contact bar doesn't cover content on mobile.
5. Listings table (dashboard) has `white-space: nowrap` headers inside `.table-wrap` — confirm horizontal scroll works within the wrapper only (page must not scroll).
6. Navbar at ≤480px: logo + search + hamburger; verify search doesn't crush logo.

## HARD RULES (all agents)
- CSS-only changes + minimal JSX class additions. NO logic/state/Firebase edits.
- Never introduce new undefined custom properties. Use existing tokens (--space-N, --radius, --glass-*). A token audit script exists: `node token-audit.py` must print "NONE".
- Every fix must work in BOTH light and dark themes.
- Do not remove existing breakpoints; extend them.
- Touch targets stay >= 44px.
- prefers-reduced-motion already handled globally; don't break it.

## FILE OWNERSHIP
- R1 SHELL/TABLET: src/styles/shell.css, src/styles/plp.css (navbar + category-bar + hero-orbs + plp-layout breakpoints)
- R2 PDP/MOBILE: src/styles/pdp.css (+ pdp-grid collapse, sticky bar safe-area)
- R3 PAGES/DESKTOP: src/styles/pages.css (stat-grid breakpoints, table-wrap scroll containment, seller grid)
- R4 VERIFY+GLOBAL: src/app/globals.css (only if a global utility is needed), plus final `node token-audit.py && npx tsc --noEmit`

## ACCEPTANCE CRITERIA (the whole team is judged on this)
Playwright measurement at 390/768/1440 on /, /listings/[id], /dashboard, /favorites, /listings/new:
document.documentElement.scrollWidth - clientWidth === 0 on EVERY page/width (hero-orbs included).
