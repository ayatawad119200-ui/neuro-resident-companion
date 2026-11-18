# HANDOVER

## 1. Current state (three lines)

NRC Phase 0 (setup) and Phase 1 (engine + content framework) are complete and
the production build passes. The app is a fully offline-capable Arabic RTL PWA
with local case records, settings, backup/restore, and a source registry page,
deployed to GitHub Pages. No real clinical content exists yet; all
score/tree/dose/interaction objects in the UI are explicitly non-clinical demos.

Live: https://ayatawad119200-ui.github.io/neuro-resident-companion/

Clinical content: two **draft** scores (GCS, NIHSS) from the owner-provided
MedCalc-Pro dataset; no approved clinical values yet.

## 2. Last task

**T-021 — GCS + NIHSS (partial) — DOING.** Both are transcribed from the
owner-provided MedCalc-Pro dataset as `status: 'draft'` (D-016); exam forms
remain.
**T-043 is DONE**: the repo is public at
https://github.com/ayatawad119200-ui/neuro-resident-companion and Pages deploys
from Actions. **T-040/T-041 are also DONE**: print/PDF export, 6 Playwright E2E
tests, and Lighthouse 100 on 8 local routes plus the live site.

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
- `src/engine/engine.test.ts` — 57 engine tests.
- `src/content/clinical.ts` — registered draft source `medcalc-pro` + GCS and
  NIHSS drafts (D-016). `src/content/content.test.ts` — 15 content tests.
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
- Deployment (D-015): `vite.config.ts` reads `BASE_PATH`; PWA manifest uses
  relative `start_url`/`scope`; `.github/workflows/deploy-pages.yml` runs
  `npm run check`, builds with `/<repo>/`, writes `404.html` + `.nojekyll`, and
  publishes with `actions/deploy-pages`. `public/.nojekyll` is committed.
- Verified under `/nrc/`: assets, manifest, SW scope (`/nrc/`), and an offline
  deep link with the preview server stopped. Verified live under
  `/neuro-resident-companion/` (SW scope correct, Lighthouse 100/100/100).

## 4. What remains in the same task

- T-021: add the exam-form fields; get an independent clinician to verify the
  GCS and NIHSS values, options, and bands against primary sources before any
  `status: 'approved'` change.
- T-042 (five-doctor pilot) still needs approved clinical content.
- Optional follow-ups:
  - Wire score/decision/med logs to case records.
  - Add an approved-only content loader before real content ships.

## 5. Suggested next step

**Do not start Phase 2 until the user pastes the source text.** Then start
**T-020** (history templates, stroke first) or **T-023** (acute ischemic stroke
algorithm), depending on which source is provided. Create the `Source` row first,
then the draft clinical object, then boundary tests.

For future changes, push to `main`; the Pages workflow rebuilds and redeploys
automatically.

## 6. Run/test commands

```bash
npm install
npm run dev        # http://localhost:5173
npm run lint       # ESLint flat config
npm run typecheck
npm test           # 72 unit tests
npm run check      # lint + typecheck (app + e2e) + unit tests
npm run test:e2e   # 6 Playwright E2E tests (builds + previews)
npm run test:e2e:ui
npm run build
npm run preview
npm run icons
# Project-site build (GitHub Pages style)
BASE_PATH=/<repo>/ npm run build   # PowerShell: $env:BASE_PATH='/<repo>/'; npm run build
```

Deployment: push to `main`; `.github/workflows/deploy-pages.yml` runs
`npm run check`, builds with the repo base path, and deploys. Pages source must
stay **GitHub Actions**.

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
keeps every unverified item planned. The only transcribed values are the GCS
and NIHSS drafts in `src/content/clinical.ts` (MedCalc-Pro, D-016); they still
need a primary-source check before approval.

## 9. Known bugs / gaps

- `npm audit` could not reach the advisory endpoint in session 2; the earlier
  install reported 18 advisories (including 2 critical) that are not yet triaged.
- `esbuild` postinstall warning from npm allow-scripts appeared during install,
  but Vite/Vitest build and tests run correctly.
- The Pages workflow logs a Node 20 deprecation annotation for the pinned action
  versions (`checkout@v4`, `setup-node@v4`, `configure-pages@v5`); GitHub forces
  them onto Node 24 and deployment succeeds. Bump the actions later.
- Real clinical content is limited to two draft scores (GCS, NIHSS); everything
  else is absent.
- MedCalc-Pro (D-016) has no LICENSE file and no external citations, so its
  values stay draft until checked against a primary guideline/label by an
  independent reviewer.
- Git is not installed system-wide on this machine; the deploy session used
  portable MinGit + gh from `%TEMP%\opencode\nrc-tools`. Install Git normally
  before the next session if `git` should work from a fresh shell.

## 10. Notes for the next AI

- Read `AGENTS.md` and this file before editing.
- The UI must never calculate clinical values; extend `src/engine`.
- Do not mark content approved without two-person review.
- Keep Arabic/English keys symmetric; `en.ts` is typed from `ar.ts`.
- Preserve 44px touch targets, RTL logical properties, and the demo labels.
- Run `npm run check && npm run test:e2e && npm run build` before ending a session.
