# Neuro Resident Companion (NRC)

Offline-first PWA decision-support companion for a neurology resident. Arabic UI
(RTL) with English medical terms, local-only data, no analytics, and no runtime
network calls.

> **Safety notice:** This is a decision-support tool for physicians, not a
> substitute for clinical judgement or the local protocol. The treating
> physician remains responsible. Never enter a patient name, file number, or any
> other identifier.

## Current status

**Phase 0 (setup) and Phase 1 (engine framework) are complete.**

- No real clinical content is loaded yet. Scores, algorithms, drug rules, and
  interactions shown in the UI are **non-clinical demo objects** used only to
  exercise the engines.
- Every real clinical value must be extracted from pasted source text,
  two-person reviewed, and registered with `sourceId`, `version`, and
  `status: 'draft' | 'approved'` before it can be used.
- The source registry is intentionally empty (`src/content/catalog.ts`).

See [`PROGRESS.md`](./PROGRESS.md) and [`HANDOVER.md`](./HANDOVER.md) for the
task-level state.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm test           # Vitest (56 engine tests)
npm run check      # lint + typecheck (app + e2e) + unit tests
npm run test:e2e   # Playwright (6 E2E tests; builds + previews)
npm run build      # typecheck + production build + service worker
npm run preview    # serve dist/
npm run icons      # regenerate PNG icons (Node script, no dependencies)
```

Requirements: Node.js 20+.

## Deployment (GitHub Pages)

The app is static and deploys from `dist/` under `Base` hash routing, so no
server rewrites are needed.

1. Push the project to a GitHub repository.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Push to `main` (or run the workflow manually). `.github/workflows/deploy-pages.yml`
   runs `npm run check`, builds with the correct `BASE_PATH`, and publishes.

`BASE_PATH` is only needed for local builds that mimic a project site:

```bash
# Project site: https://<user>.github.io/<repo>/
BASE_PATH=/<repo>/ npm run build
# PowerShell
$env:BASE_PATH='/<repo>/'; npm run build
```

Without it, `base` stays `/` for local dev, preview, and `<user>.github.io`
user sites. See `DECISIONS.md` D-015.

## What works today

| Area | State |
|---|---|
| App shell, hash routing, responsive layout | Done |
| Arabic/English, RTL/LTR, light/dark/system | Done |
| Disclaimer gate + persistent acceptance | Done |
| Offline badge, PWA manifest, Workbox service worker | Done — cold offline deep links verified |
| Accessibility audit (Lighthouse, 8 routes) | 100 accessibility / best practices / SEO |
| ESLint + typecheck + 56 tests + production build | All pass (`npm run check`) |
| Playwright E2E (disclaimer, cases, settings, PDF, offline) | 6/6 pass (`npm run test:e2e`) |
| Case CRUD with autosave, LKW + elapsed time, BMI, handover note | Done |
| JSON backup export/import, typed `DELETE` wipe | Done |
| Copyable handover + print/PDF view | Done |
| Source registry page (empty, planned sources listed) | Done |
| Generic score engine + tests | Done |
| Decision-tree walker + validation + tests | Done |
| Dose calculator (caps, floor rounding, hard input limits) + tests | Done |
| Interaction matcher (dedupe + severity order) + tests | Done |
| Real scores/algorithms/drugs/investigations | **Pending source text** |

## Project layout

```text
src/
  app/          # providers, layout, hash router, disclaimer, preferences
  features/     # case, clinical (scores + algorithms), drugs, sources, settings
  engine/       # pure TypeScript clinical arithmetic (no UI, no React)
  content/      # catalogues + clearly-labelled demo objects
  db/           # Dexie schema, case repository, backup/restore
  i18n/         # ar/en dictionaries
  ui/           # design-system primitives and icons
docs/           # PRD, requirements, architecture, task list
```

**Architectural rule:** the UI never calculates clinical values. All arithmetic
and decision logic lives in `src/engine`; all clinical data belongs in
`src/content`. Clinical data items carry `sourceId`, `version`, and `status`.

## Data and privacy

- Cases and settings live in IndexedDB (`nrc-db`) on this device.
- Language/theme fallbacks are mirrored in `localStorage` for instant startup.
- There are no analytics, no external calls at runtime, and no identifiers.
- Backups are local JSON files (`{ app: 'nrc', schemaVersion: 1, ... }`).
- “Wipe all data” clears cases and settings after typing `DELETE`.

## Safety rules for contributors

1. Never write a dose, cut-off, score value, guideline recommendation, or
   investigation list from memory. Use `TODO_VERIFY` and wait for source text.
2. No clinical logic in UI components. Add pure functions to `src/engine`.
3. No clinical data without `sourceId`, `version`, and `status`.
4. Demo content must stay visibly labelled as non-clinical.
5. Keep every interactive target at least 44×44 px and preserve RTL.

See [`AGENTS.md`](./AGENTS.md) for the full contributor contract.

## Documentation

- [PRD](./docs/PRD.md)
- [Requirements](./docs/REQUIREMENTS.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Tasks](./docs/TASKS.md)
- [Decisions](./DECISIONS.md)
- [Changelog](./CHANGELOG.md)
