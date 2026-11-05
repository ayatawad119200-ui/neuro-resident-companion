# HANDOVER

## 1. Current state (three lines)

NRC Phase 0 (setup) and Phase 1 (engine + content framework) are complete and
the production build passes. The app is a fully offline-capable Arabic RTL PWA
with local case records, settings, backup/restore, and a source registry page.
No real clinical content exists yet; all score/tree/dose/interaction objects in
the UI are explicitly non-clinical demos.

## 2. Last task

**T-040 — Export/import + handover — DONE.** JSON backup/restore, copyable text
handover, and a dedicated print/PDF view. **T-041 is also DONE**: 6 Playwright
E2E tests pass and Lighthouse is 100 on 8 routes.

## 3. What was done (files + functions)

- `src/engine/units.ts` — mass/volume/weight/length conversions, `assertRange`,
  `roundTo`, `bmi`, `formatDecimal`.
- `src/engine/score.ts` — `calculateScore` with min/max, completeness, bands.
- `src/engine/algorithm.ts` — `walkAlgorithm`, `validateAlgorithm`.
- `src/engine/dose.ts` — `calculateDose`, `DOSE_LIMITS`, `formatDose`.
- `src/engine/interactions.ts` — `checkInteractions`, `SEVERITY_ORDER`.
- `src/engine/handover.ts` — `elapsedSince`, `formatElapsed`,
  `buildHandoverNote`.
- `src/engine/types.ts` — Zod content schemas, `EngineError`, status types.
- `src/content/catalog.ts` — `CONTENT_VERSION`, complaint labels, planned
  scores/algorithms/drug classes/sources, empty `sources`.
- `src/content/demo.ts` — non-clinical demo score/tree/dose/drugs/interactions.
- `src/db/db.ts` / `caseRepo.ts` — Dexie schema, settings, backup/import/wipe,
  case CRUD + autosave patch.
- `src/features/*` — case pages, clinical panels, drugs page, source registry,
  settings (language/theme/export/import/wipe/disclaimer/about).
- `src/app/*` — hash router, layout, disclaimer gate, settings context, toast.
- `src/i18n/*` — Arabic/English dictionaries (symmetric keys).
- `src/ui/*` — design-system kit, icons, date formatting.
- `src/engine/engine.test.ts` — 56 tests.
- i18n placeholder fix: `{var}` → `{{var}}` for counts, age, score maximum,
  interaction count, and import totals.
- Manual smoke test passed in the production preview (disclaimer, case creation
  and handover, score/dose/interaction demos, sources, settings, export,
  language switch, disclaimer modal) with no console errors.
- `eslint.config.js` — flat config with `typescript-eslint`, React Hooks and
  React Refresh plugins; `no-explicit-any` is an error. `npm run lint` and
  `npm run check` added to `package.json`.
- `CaseDetailPage` effect refactor: LKW input is populated inside the async
  load callback; routed case pages get `key={id}` so state resets on navigation.
- `public/robots.txt` — valid `Disallow: /` file; Lighthouse SEO 100.
- Offline verification: SW activated and controlling; preview server stopped;
  cold tab opened `#/sources` and a case deep link from cache with no console
  errors. Offline badge toggles on synthetic `offline`/`online` events.
- Lighthouse on 8 routes (cases, new case, case detail, print/PDF, clinical
  scores, algorithms, drugs, settings): Accessibility 100, Best Practices 100,
  SEO 100.
- `playwright.config.ts` + `e2e/nrc.spec.ts` + `e2e/helpers.ts` — 6 E2E tests
  against `vite preview`: disclaimer gate persistence, case create/autosave/
  handover copy, age validation, language/theme + backup download + wipe guard,
  a real print-to-PDF (`page.pdf()` asserts `%PDF-`), and an offline reload/
  deep link.
- `src/features/case/CasePrintPage.tsx` + route `#/cases/:id/print` — clean
  handover document, `window.print()` button, A4 `@media print` rules that hide
  the app chrome (D-014).
- `handoverInputFor` shares the case→handover mapping between detail and print.
- `tsconfig.e2e.json` type-checks the tests; `@types/node` added for config/tests.

## 4. What remains in the same task

- None for T-040/T-041. Optional follow-ups:
  - Wire score/decision/med logs to case records (Phase 2).
  - Add an approved-only content loader before real content ships.

## 5. Suggested next step

**Do not start Phase 2 until the user pastes the source text.** Then start
**T-020** (history templates, stroke first) or **T-023** (acute ischemic stroke
algorithm), depending on which source is provided. Create the `Source` row first,
then the draft clinical object, then boundary tests.

## 6. Run/test commands

```bash
npm install
npm run dev        # http://localhost:5173
npm run lint       # ESLint flat config
npm run typecheck
npm test           # 56 unit tests
npm run check      # lint + typecheck (app + e2e) + unit tests
npm run test:e2e   # 6 Playwright E2E tests (builds + previews)
npm run test:e2e:ui
npm run build
npm run preview
npm run icons
```

## 7. Important decisions / constraints

- NRC lives in `neuro-resident-companion/`; the unrelated POS project in the
  parent workspace must not be modified.
- Hash routing instead of react-router (see `DECISIONS.md`).
- Zod schemas co-located with types; `/schemas` folder not created yet.
- Demo content is non-clinical and must remain labelled.
- No analytics, no runtime network calls, no patient identifiers.

## 8. Open TODO_VERIFY (medical values needing a source)

Everything clinical, including but not limited to:

- `TODO_VERIFY` — all score item values, cut-offs, and interpretations.
- `TODO_VERIFY` — all algorithm questions, branches, contraindications, actions.
- `TODO_VERIFY` — all drug doses, max doses, renal/hepatic/age adjustments.
- `TODO_VERIFY` — all interaction severities and management text.
- `TODO_VERIFY` — red-flag lists, swallow screen, investigation lists.
- `TODO_VERIFY` — any guideline recommendation or monitoring interval.

No real value may be filled from memory. `src/content/catalog.ts` intentionally
exports an empty `sources` array.

## 9. Known bugs / gaps

- `npm audit` could not reach the advisory endpoint in session 2; the earlier
  install reported 18 advisories (including 2 critical) that are not yet triaged.
- `esbuild` postinstall warning from npm allow-scripts appeared during install,
  but Vite/Vitest build and tests run correctly.
- Real clinical content is intentionally absent; Phase 2 remains blocked.

## 10. Notes for the next AI

- Read `AGENTS.md` and this file before editing.
- The UI must never calculate clinical values; extend `src/engine`.
- Do not mark content approved without two-person review.
- Keep Arabic/English keys symmetric; `en.ts` is typed from `ar.ts`.
- Preserve 44px touch targets, RTL logical properties, and the demo labels.
- Run `npm run check && npm run test:e2e && npm run build` before ending a session.
