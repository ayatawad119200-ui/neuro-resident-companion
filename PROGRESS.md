# PROGRESS

## Status summary

- Version: `0.1.0`
- Last updated: 2026-11-04
- Current phase: **Phase 1 complete** (Phase 2 blocked on source text)
- Completion: Phase 0 = 100%, Phase 1 = 100%, overall MVP ≈ 62%

## Tasks

| ID | Title | Status | Session | Notes |
|---|---|---|---|---|
| T-001 | Setup: Vite/React/TS/Tailwind/Vitest | DONE | 1–2 | ESLint added in session 2 (D-010) |
| T-002 | PWA: manifest, SW, icons, offline | DONE | 1–2 | Offline verified with server stopped (D-012) |
| T-003 | Dexie schema + case CRUD | DONE | 1 | Autosave + handover |
| T-004 | i18n ar/en + RTL + theme | DONE | 1 | Symmetric keys, persisted |
| T-005 | Disclaimer + settings + wipe | DONE | 1 | Export/import + typed wipe |
| T-010 | Schemas + validator + source registry | DONE | 1 | Registry intentionally empty |
| T-011 | Score engine + tests | DONE | 1 | `calculateScore` |
| T-012 | Decision-tree runner + tests | DONE | 1 | Walker + validator |
| T-013 | Dose engine + tests | DONE | 1 | Caps + floor rounding |
| T-014 | Interaction engine + tests | DONE | 1 | Severity order + dedupe |
| T-020–T-030 | Clinical modules | BLOCKED | — | Need pasted source text |
| T-040 | Export/import + handover | DONE | 2 | JSON + text + print/PDF view (D-014) |
| T-041 | E2E + Lighthouse + a11y | DONE | 2 | Lighthouse 100 on 8 routes; 6 Playwright E2E tests (D-013) |
| T-042 | Five-doctor pilot | TODO | — | |
| T-043 | Deployment + v0.1 changelog | DOING | 3 | Changelog done; GitHub Pages workflow + `BASE_PATH` added |

## Session log

### Session 1 — 2026-11-04 — AI: DeepSeek V4.1 Flash Free

- Tasks: T-001 through T-014; partial T-040/T-043.
- Completed:
  - Project scaffold, Tailwind v4 design system, PWA manifest/service worker,
    generated PNG icons.
  - Pure engine: units, scores, algorithms, dose, interactions, handover.
  - Content scaffolding with demo-only objects and planned catalogues.
  - Dexie database, case repository, backup/import/wipe.
  - Arabic/English i18n with RTL and light/dark/system themes.
  - App shell, disclaimer gate, case list/form/detail, clinical scores and
    algorithms panels, drugs page, source registry, settings.
  - 56 engine tests; typecheck and production build pass.
  - Manual production-preview smoke test: disclaimer gate, case creation and
    handover, score/dose/interaction demos, source registry, settings backup
    export, language switch, and disclaimer modal; no console errors.
- Fixed: i18next placeholders were single-brace (`{age}`); corrected to
  `{{age}}` so counts, age, score maximum, and import totals interpolate.
- Files: full `src/` tree, config, `scripts/generate-icons.mjs`, docs.
- Tests: 56 passed / 0 failed (`npm test`).
- Build: passed (`npm run build`), JS ≈ 141 KB gzip.
- Open issues:
  - Real clinical content intentionally absent.

### Session 2 — 2026-11-04 — AI: DeepSeek V4.1 Flash Free

- Task: Phase 0/1 polish (T-001, T-002, T-041).
- Completed:
  - ESLint 10 flat config with `typescript-eslint` and React Hooks rules;
    added `npm run lint` and `npm run check`. Fixed `set-state-in-effect` in
    `CaseDetailPage` by setting the LKW input inside the async load callback and
    keying routed case pages by ID in `App.tsx`.
  - Real offline test: loaded the production preview, confirmed the SW was
    activated and controlling (8 precache entries), stopped the preview server,
    then cold-opened `#/sources` and a case deep link in a new tab. Both rendered
    from cache with no console errors; the offline badge toggled correctly on
    synthetic `offline`/`online` events.
  - Lighthouse audits on eight routes (cases, new case, case detail, clinical
    scores, clinical algorithms, drugs, settings): Accessibility 100, Best
    Practices 100, SEO 80 → 100 after adding a valid `public/robots.txt`.
  - Added `public/robots.txt` (`Disallow: /`) so the clinical app is not indexed.
  - Playwright E2E: 6 tests on the production build covering the disclaimer
    gate, case creation/autosave/handover copy, age validation, language/theme
    switching, JSON backup download, typed-wipe guard, print-to-PDF (asserts a
    real `%PDF-` file), and a true network-offline reload/deep link.
    `@types/node` + `tsconfig.e2e.json` type-check the suite;
    Playwright's bundled Chromium runs headless in CI and locally.
  - Print/PDF view: `#/cases/:id/print` renders a clean handover document and
    calls `window.print()`; `@media print` hides the app chrome (D-014).
- Files: `eslint.config.js`, `package.json`, `playwright.config.ts`,
  `tsconfig.e2e.json`, `e2e/helpers.ts`, `e2e/nrc.spec.ts`, `src/app/App.tsx`,
  `src/features/case/CaseDetailPage.tsx`, `public/robots.txt`, docs.
- Tests: 56 unit + 6 E2E passed; lint and typecheck (app + e2e) clean.
- Build: passed (`npm run build`), JS ≈ 140.5 KB gzip, CSS ≈ 6.6 KB gzip.
- Open issues:
  - `npm audit` could not run (registry advisory endpoint error); earlier
    install reported 18 advisories, not yet triaged.
  - Real clinical content intentionally absent.

## Medical content awaiting review

| File | Source | Status | Reviewer |
|---|---|---|---|
| `src/content/demo.ts` | Demo object (not a guideline) | Non-clinical | — |
| `src/content/catalog.ts` | Planned source list (not registered sources) | Pending | — |

No real clinical value has been entered. `sources` is empty by design.
