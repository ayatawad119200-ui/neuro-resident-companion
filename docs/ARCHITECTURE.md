# Architecture

## Principles

1. **UI does not calculate.** Components render values produced by `src/engine`.
2. **Clinical data is separate from code.** Definitions live in `src/content` and
   are validated by Zod schemas.
3. **Provenance is mandatory.** Every clinical item has `sourceId`, `version`,
   and `status` (`draft` by default).
4. **Offline first.** No runtime network dependency; the service worker caches
   the app shell and assets.
5. **No identifiers.** The case schema has no name/file-number/contact fields.

## Stack

- Vite 6 + React 18 + TypeScript 5 (strict)
- Tailwind CSS v4 via `@tailwindcss/vite`
- Dexie 4 (IndexedDB)
- Zod 3 (content, case, and backup validation)
- i18next + react-i18next (Arabic/English, RTL)
- vite-plugin-pwa + Workbox
- Vitest (engine unit tests)

## Directory map

```text
src/
  app/
    App.tsx            # providers + route switch
    Layout.tsx         # header, bottom navigation, offline badge, footer
    DisclaimerGate.tsx # blocking first-run disclaimer
    router.ts          # hash-based routing and Route union
    preferences.ts     # language/dir/theme application + localStorage mirror
    settingsContext.tsx
    toast.tsx
  features/
    case/              # list, create/edit form, detail + autosave + handover
    clinical/          # scores/algorithms tabs and panels
    drugs/             # dose calculator + interaction demo
    sources/           # source registry, planned sources, governance
    settings/          # language, theme, backup/restore/wipe, about
  engine/
    types.ts           # Zod schemas, inferred types, EngineError
    units.ts           # conversions, range assertions, BMI, formatting
    score.ts           # generic score calculator
    algorithm.ts       # tree walker + structural validator
    dose.ts            # dose calculator + hard limits
    interactions.ts    # interaction matcher + severity ordering
    handover.ts        # elapsed time + handover text builder
    engine.test.ts     # 56 unit tests
  content/
    catalog.ts         # version, complaint labels, planned catalogues, sources
    demo.ts            # explicitly non-clinical demo objects
  db/
    db.ts              # case/settings schemas, Dexie, backup/restore/wipe
    caseRepo.ts        # create/list/get/update/replace/delete/count
  i18n/                # ar.ts, en.ts (symmetric keys), init
  ui/                  # kit primitives, icons, date formatting
```

## Routing

Hash routing is used (`#/cases`, `#/clinical/scores`, `#/drugs`, `#/sources`,
`#/settings`) so the PWA works from any static host without server rewrites.
`parseHash` returns a discriminated `Route` union; unknown paths fall back to
the case list.

## Data flow

```text
Source text ──extract──▶ Source row + clinical object (draft)
                              │
                              ▼
                       Zod validation
                              │
                              ▼
                     src/content/*.ts
                              │
             UI passes inputs + definition
                              │
                              ▼
                    src/engine pure functions
                              │
                              ▼
             result object (score/dose/path/…)
                              │
                              ▼
                  React renders, no arithmetic
```

## Engine API

| Function | Contract |
|---|---|
| `calculateScore(def, values)` | Sums valid options; `complete=false` for missing items; throws `INVALID_OPTION`/`EMPTY_DEFINITION` |
| `walkAlgorithm(def, choices)` | Returns `question`, `result`, or typed `error`; detects cycles and missing nodes/options |
| `validateAlgorithm(def)` | Structural issues: duplicates, missing start/targets, unreachable nodes, payload mismatches |
| `calculateDose(rule, input, requestedUnit?)` | Hard range limits, rule weight limits, absolute cap, floor rounding, calculation trail, draft/adjustment warnings |
| `checkInteractions(ids, defs)` | Deduplicates selections/findings, sorts by severity, empty means “not recorded” |
| `buildHandoverNote(input, now)` | Copyable text from entered values only; never infers clinical data |
| `elapsedSince` / `formatElapsed` | Compact duration; future timestamps flagged |
| `bmi`, conversions, `assertRange`, `roundTo`, `formatDecimal` | Pure arithmetic/validation |

`EngineError` carries a typed `code` so the UI can distinguish invalid input
from an invalid content definition.

## Storage

Database `nrc-db` (Dexie v1):

- `cases` — key `id`, indexes `createdAt`, `updatedAt`.
- `settings` — key/value rows (`language`, `theme`, `disclaimerAccepted`).

`CaseRecord` (`schemaVersion: 1`) contains demographics, Last Known Well,
history, notes, saved scores, decision logs, and medication logs. The UI
currently writes demographics/history/notes; score/decision/med logs are ready
for Phase 2.

Backups use:

```json
{ "app": "nrc", "schemaVersion": 1, "exportedAt": "…", "cases": [], "settings": [] }
```

Import validates the whole file with Zod, then `bulkPut`s cases/settings in one
transaction. Wipe clears both tables after a typed `DELETE` confirmation.

## PWA and offline

- `VitePWA` generates `manifest.webmanifest` + Workbox service worker.
- Precaches JS/CSS/HTML/SVG/PNG/webmanifest; navigation fallback to
  `index.html`.
- App uses local fonts/system fonts only; no runtime CDN.
- Offline badge listens to `online`/`offline` events.

## Deployment

- Static hosting only: `npm run build` emits `dist/` with no server runtime.
- GitHub Pages via `.github/workflows/deploy-pages.yml` on pushes to `main`
  (and manual dispatch). The workflow runs `npm run check`, builds with
  `BASE_PATH=/<repo>/` for project sites (or `/` for `<user>.github.io`), adds
  `404.html` + `.nojekyll`, and publishes with `actions/deploy-pages`.
- `base` is read from `BASE_PATH` in `vite.config.ts`, so local builds and
  previews stay at `/`. The PWA manifest uses relative `start_url`/`scope` so
  the same artifact works at the domain root or under a repository path.
- Hash routing removes the need for SPA rewrite rules; `404.html` is only a
  safety net for hand-typed path URLs.
- Deployment adds no runtime network calls, analytics, or patient data. See
  `DECISIONS.md` D-015.

## Internationalization and RTL

- `applyLanguage` sets `<html lang dir>`; Arabic is the default.
- Arabic/English dictionaries are structurally identical (`Translation` type
  derived from `ar`).
- Medical terms and numeric metrics stay in Latin script; Arabic uses Latin
  digits for clinical numbers via `Intl` locale `ar-EG-u-nu-latn`.
- Layout uses logical properties (`ms-*`, `me-*`, `text-start`) and
  `rtl:rotate-180` for directional icons.

## Safety boundaries

- Draft content must not be presented as approved; the UI shows
  `Draft`/`Approved`/`Awaiting source` badges.
- The current demo score/tree/dose/interactions are non-clinical and labelled
  with “Demo” badges. They exist only to exercise the engines.
- Any real content must be added with a source row and reviewed before
  `status: 'approved'`.
- Phase 2 content must add an approved-only loader before production use.
  Today `src/content/catalog.ts` contains no real clinical values.

## Deviations from the original folder sketch

| Spec sketch | Actual | Reason |
|---|---|---|
| `/src/schemas` | Zod schemas in `engine/types.ts` and `db/db.ts` | Co-located with their types; easier to keep in sync. May split later. |
| `react-router` | Hash router | No server rewrites; smaller bundle. |
| `/features/scores`, `/algorithms` | `/features/clinical` | Shared tab shell; panels are split. |
| ESLint in T-001 | ESLint 10 flat config | Installed; React Hooks rules enforced. See `DECISIONS.md` D-010. |

## Testing strategy

- Engine tests cover conversions, range errors, score boundaries/incomplete
  results, algorithm paths/cycles/validation, dose caps/rounding/unit mismatch,
  interaction ordering/dedupe, elapsed formatting, and handover content.
- Manual smoke test: disclaimer → case create → autosave → handover copy →
  settings export/import/wipe → language/theme.
- Offline test: install the SW in production preview, stop the server, cold-open
  deep links (see D-012).
- Lighthouse runs on eight routes; accessibility/best-practices/SEO are 100.
- Playwright E2E (`e2e/`) runs against `vite preview` and covers the disclaimer,
  case lifecycle, settings/backup/wipe, print-to-PDF, and a true offline reload.
