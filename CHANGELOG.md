# Changelog

All notable changes to NRC are recorded here. Versions follow SemVer.
Clinical content changes must also record the source version and review date.

## [0.1.0] — 2026-11-04

### Added

- Phase 0 scaffold: Vite 6, React 18, TypeScript strict, Tailwind CSS v4.
- Offline-first PWA: manifest, generated 192/512 PNG + SVG icons, Workbox
  service worker, offline badge.
- Arabic RTL / English LTR UI, light/dark/system theme, persisted preferences.
- Mandatory disclaimer gate with settings re-open.
- Case list, create/edit form, detail view with autosave, Last Known Well
  elapsed time, BMI, and copyable handover note.
- Dexie database with Zod-validated case/settings schemas.
- Local JSON backup export/import and typed `DELETE` wipe.
- Source registry page with governance card, planned sources, status legend,
  app/content versions.
- Pure engine: unit conversions, generic score calculator, decision-tree walker
  and validator, dose calculator with hard limits and floor rounding, interaction
  matcher, handover builder.
- Content framework: Zod schemas with `sourceId`/`version`/`status`, planned
  score/algorithm/drug-class/source catalogues, clearly-labelled demo objects.
- 56 Vitest engine tests covering boundaries, invalid inputs, cycles, caps,
  rounding, unit mismatch, interaction ordering, and handover output.
- ESLint 10 flat config with `typescript-eslint` and React Hooks rules; new
  `npm run lint` and `npm run check` scripts.
- `public/robots.txt` with `Disallow: /`; not indexed by search engines.
- Playwright E2E: 6 tests against the production build covering the disclaimer
  gate, case create/autosave/handover copy, validation, settings/backup/wipe,
  print-to-PDF, and a true network-offline reload with deep links.
- Print/PDF export: dedicated `#/cases/:id/print` handover view with A4 print
  styles and a “Print / PDF” action (D-014).
- GitHub Pages deployment: `BASE_PATH`-driven Vite base, relative PWA
  `start_url`/`scope`, Actions workflow, `.nojekyll`, and a `404.html` fallback
  for path URLs (D-015).
- Documentation: README, AGENTS, PRD, requirements traceability, architecture,
  task list, progress, handover, decisions.

### Fixed

- i18next interpolation placeholders now use `{{var}}`; counts, age labels,
  score maximum, interaction count, and import totals render correctly.
- Algorithm result nodes no longer require an empty `options` array.
- Segmented controls and reminder chips now meet the 44×44 px touch-target
  minimum.
- `CaseDetailPage` no longer calls `setState` synchronously inside an effect;
  LKW input loading moved into the async callback and case pages are keyed by
  route ID.

### Verified

- Offline cold start: service worker activated, preview server stopped, deep
  links opened from cache with no console errors.
- Lighthouse (production preview, 8 routes): Accessibility 100, Best Practices
  100, SEO 100.
- Playwright (production preview): 6/6 E2E tests, including a print-generated
  PDF (`%PDF-`) and an offline reload with cached deep link.
- `npm run check` and `npm run build` pass; 56/56 unit tests.

### Security / privacy

- No patient identifiers in the case schema.
- No analytics, no runtime network calls, no remote fonts or CDNs.
- All data stays in IndexedDB on the device.
- `robots.txt` disallows indexing of the clinical app.

### Known gaps

- Real clinical content is intentionally absent; Phase 2 is blocked on source
  text.
- Deployment is pending.
- `npm audit` advisory endpoint was unreachable; the 18 advisories reported at
  install time are not yet triaged.
