# DECISIONS

## D-001 — 2026-11-04 — Separate NRC folder

- Decision: Build NRC in `neuro-resident-companion/` inside the workspace.
- Alternatives: Build at the workspace root; create a sibling worktree.
- Reason: The root already contains an unrelated, complete POS PWA.
- Impact: All NRC commands run from the subfolder; the POS project stays intact.

## D-002 — 2026-11-04 — Hash-based routing

- Decision: Use `#/cases`, `#/clinical/scores`, etc. with a small custom parser.
- Alternatives: react-router; history API routing.
- Reason: Static hosting without rewrite rules, PWA-safe deep links, and a
  smaller dependency surface.
- Impact: Routes are parsed in `src/app/router.ts`; unknown hashes fall back to
  the case list.

## D-003 — 2026-11-04 — Co-locate Zod schemas

- Decision: Keep content schemas in `src/engine/types.ts` and case/settings
  schemas in `src/db/db.ts`.
- Alternatives: A separate `/src/schemas` folder as sketched in the spec.
- Reason: Schemas and their inferred types stay in sync; fewer circular imports.
- Impact: The folder can be split later without changing runtime behaviour.

## D-004 — 2026-11-04 — Non-clinical demo content

- Decision: Ship demo score/tree/dose/interaction objects in `src/content/demo.ts`
  to exercise the engines.
- Alternatives: Empty screens until Phase 2.
- Reason: Allows end-to-end verification of engine wiring and UI states without
  inventing clinical values.
- Impact: Every demo object is labelled “Demo” / “not clinical” and remains
  `status: 'draft'`. It must never be presented as medical advice.

## D-005 — 2026-11-04 — ESLint deferred — **SUPERSEDED by D-010**

- Decision: Do not install ESLint in this session.
- Alternatives: Add ESLint 9 flat config + typescript-eslint.
- Reason: Keep the initial install small and avoid config churn; correctness is
  currently enforced by `tsc --noEmit`, Vitest, and the Vite build.
- Impact: Superseded the same day by D-010; ESLint is now installed and part of
  `npm run check`.

## D-006 — 2026-11-04 — Backup format and merge semantics

- Decision: Backups are `{ app: 'nrc', schemaVersion: 1, exportedAt, cases,
  settings }`, validated by Zod; import `bulkPut`s cases/settings in one
  transaction.
- Alternatives: Per-case files; replace-all import.
- Reason: Simple, inspectable, safe to re-import, and preserves local cases.
- Impact: Import is a merge/upsert, not a destructive restore.

## D-007 — 2026-11-04 — Algorithm options are optional for result nodes

- Decision: `AlgorithmNode.options` is optional; question nodes require options
  at validation time, result nodes must omit them.
- Alternatives: Require `options: []` on every result node.
- Reason: Authoring is clearer and validation already enforces the shape.
- Impact: `walkAlgorithm`/`validateAlgorithm`/UI use `node.options ?? []`.

## D-008 — 2026-11-04 — No analytics or runtime network

- Decision: No analytics, no remote fonts, no CDN, no runtime API calls.
- Alternatives: Lightweight analytics or remote content updates.
- Reason: Patient-adjacent data must remain local; offline reliability is a core
  requirement.
- Impact: All assets are bundled; updates ship through a new app build.

## D-009 — 2026-11-04 — Dose rounding always floors

- Decision: Rounding applies after the absolute cap and always rounds down.
- Alternatives: Nearest rounding; round before capping.
- Reason: A safety ceiling must never be exceeded by rounding.
- Impact: `calculateDose` returns a `rounded` flag and a calculation trail.

## D-010 — 2026-11-04 — ESLint enabled

- Decision: Install ESLint 10 with `typescript-eslint`, `eslint-plugin-react-hooks`,
  and `eslint-plugin-react-refresh`; `npm run check` runs lint, typecheck, tests.
- Alternatives: Keep relying on `tsc --noEmit` + Vitest only (D-005).
- Reason: Catch React effect/state mistakes and unsafe patterns that TypeScript
  cannot see; support a clean `react-hooks` ruleset before real content lands.
- Impact: `eslint.config.js` is flat config; `@typescript-eslint/no-explicit-any`
  is an error; `react-refresh/only-export-components` is disabled because the
  toast context intentionally exports a hook beside its provider. Routing keys
  case pages by ID so effect state resets cleanly.

## D-011 — 2026-11-04 — robots.txt disallows indexing

- Decision: Ship `public/robots.txt` with `User-agent: *` / `Disallow: /`.
- Alternatives: Allow indexing; omit robots.txt.
- Reason: This is a clinical decision-support app with demo content and no SEO
  goal. Search indexing adds no value and could surface unapproved content.
- Impact: Lighthouse SEO is 100 with a valid robots.txt; the file is not part of
  the offline precache because the app never needs it at runtime.

## D-012 — 2026-11-04 — Offline verification method

- Decision: Verify offline by loading the production preview once (to install
  the Workbox service worker), stopping the preview server, then cold-opening a
  deep link in a new tab.
- Alternatives: DevTools “Offline” throttling; airplane-mode device testing.
- Reason: The preview server being unreachable proves the SW cache — not the
  network — serves the app; a cold tab also proves deep links work from cache.
- Impact: Re-run this after any change to `vite.config.ts`, assets, or routes.
  Also dispatch synthetic `offline`/`online` events to verify the badge state.

## D-013 — 2026-11-05 — Playwright E2E against the production preview

- Decision: Add `@playwright/test` with 6 tests in `e2e/`, run against
  `npm run build && vite preview` on port 4173; Chromium headless; one worker.
- Alternatives: Cypress; Vitest + jsdom component tests; testing the dev server.
- Reason: Only the production preview exercises the real Workbox service worker
  and Dexie, so the offline reload/deep-link test is meaningful. jsdom cannot
  prove offline behaviour.
- Impact: `npm run test:e2e` (and `test:e2e:ui`); intentionally not part of
  `npm run check` to keep the fast feedback loop. `tsconfig.e2e.json` type-checks
  the suite; `playwright-report/` and `test-results/` are git-ignored.

## D-014 — 2026-11-05 — PDF via the browser print pipeline

- Decision: Export the handover as PDF through a dedicated print view
  (`#/cases/:id/print`) and `window.print()` with “Save as PDF”.
- Alternatives: `jsPDF`/`pdf-lib` with an embedded Arabic font; server-side PDF.
- Reason: A JavaScript PDF library cannot shape Arabic script reliably and would
  add a large embedded-font dependency. The browser print pipeline preserves
  Arabic shaping, RTL order, and works offline with zero runtime network.
- Impact: The case detail has a “Print / PDF” link that opens the print view in a
  new tab. `@media print` hides the app chrome and forces black-on-white A4.
  The E2E suite calls `page.pdf()` and asserts a real `%PDF-` file.

## D-015 — 2026-11-05 — GitHub Pages deployment

- Decision: Deploy the static `dist/` to GitHub Pages through a GitHub Actions
  workflow (`.github/workflows/deploy-pages.yml`). Vite `base` comes from the
  `BASE_PATH` environment variable; the workflow sets it to `/<repo>/` for a
  project site and `/` for a `<user>.github.io` user site.
- Alternatives: Netlify/Vercel/Cloudflare Pages; committing `dist/` to a
  `gh-pages` branch; a custom server.
- Reason: Pages is free, needs no server, serves HTTPS, and the app is fully
  static. Hash routing means no rewrite rules, so Pages' lack of SPA fallback is
  irrelevant.
- Impact: The manifest uses relative `start_url`/`scope` (`"."`) so one build
  works at `/` and `/<repo>/`. `public/.nojekyll` keeps Pages from filtering
  files, and the workflow copies `dist/index.html` to `dist/404.html` for stray
  path URLs. No runtime network calls, analytics, or patient data are added.
