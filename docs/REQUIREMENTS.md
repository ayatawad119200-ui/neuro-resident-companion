# Requirements — traceability

Statuses: **DONE**, **PARTIAL**, **TODO**, **BLOCKED** (needs source text).
Source of truth: the NRC Spec Kit, sections 3–9.

## Functional requirements

### M1 — Case & history

| ID | Requirement | Status | Evidence / next step |
|---|---|---|---|
| FR-101 | Case demographics: age, sex, weight, height, pregnancy, Cr/eGFR, Child-Pugh, allergies | DONE (Child-Pugh not stored) | `src/db/db.ts`, `CaseFormPage` |
| FR-102 | Nine complaint templates | PARTIAL | Labels in `src/content/catalog.ts`; detailed template prompts are Phase 2 |
| FR-103 | HPI/PMH/drug/family/social fields | PARTIAL | Free-text fields done; structured prompts and red flags pending |
| FR-104 | Last Known Well + elapsed time | DONE | `lastKnownWell`, `elapsedSince`, `formatElapsed` |
| FR-105 | Red-flag banner | TODO | Needs source-verified red-flag content |

### M2 — Neuro exam

| ID | Requirement | Status | Evidence / next step |
|---|---|---|---|
| FR-201 | GCS E/V/M with intubated V=T | BLOCKED | Requires source text; planned score item |
| FR-202 | Cranial nerves I–XII | BLOCKED | Phase 2 |
| FR-203 | Motor MRC 0–5, tone, bulk | BLOCKED | Phase 2 |
| FR-204 | Reflexes, sensory, cerebellar, gait, meningeal, neglect/aphasia | BLOCKED | Phase 2 |
| FR-205 | Exam summary in handover | BLOCKED | Depends on FR-201–204 |

### M3 — Scores

| ID | Requirement | Status | Evidence / next step |
|---|---|---|---|
| FR-301 | Planned score list (NIHSS, GCS, mRS, ABCD2, CHA2DS2-VASc, HAS-BLED, ICH, Hunt & Hess, WFNS, Modified Fisher, ASPECTS, Hoehn & Yahr, Ashworth, MRC sum, ALSFRS-R, Epworth, MoCA, ROSIER) | PARTIAL | Catalogue in `catalog.ts`; no real definitions loaded |
| FR-302 | Generic score arithmetic + interpretation | DONE | `calculateScore` + 8 tests |
| — | Missing answers never presented as final | DONE | `complete` flag + UI warning |
| — | Invalid option values rejected | DONE | `EngineError('INVALID_OPTION')` |

### M4 — Algorithms

| ID | Requirement | Status | Evidence / next step |
|---|---|---|---|
| FR-401 | Decision-tree nodes with options | DONE (framework) | `walkAlgorithm`, `validateAlgorithm` |
| FR-402 | Absolute/relative contraindication handling | TODO | Needs a content field and approved rules |
| FR-403 | Save decisions to the case Decision Log | PARTIAL | Schema + `decisions[]` exist; UI logging not wired |
| — | Unknown node/option and cycle fail loudly | DONE | Typed engine errors + tests |

### M5 — Drugs

| ID | Requirement | Status | Evidence / next step |
|---|---|---|---|
| FR-501 | Drug JSON: indications, dosing, adjustments, contraindications, monitoring, pregnancy, interactions | PARTIAL | Zod schema done; no real content |
| FR-502 | Planned drug classes | PARTIAL | Catalogue only |
| FR-503 | Weight/age/eGFR dose calculator with total-dose limits | DONE (engine) | `calculateDose` + 14 tests; demo rule only |
| FR-504 | Interaction checker with four severities | DONE (engine) | `checkInteractions` + 7 tests; demo drugs only |
| FR-505 | Anticoagulation timing after stroke/ICH | BLOCKED | Needs source text |
| FR-506 | Lipid-lowering module | BLOCKED | Needs source text |
| FR-507 | Confirm screen + hard stops | PARTIAL | Dose result/steps screen and hard input limits; no confirm-and-log flow |

### M6 — Bulbar / swallow

| ID | Requirement | Status | Evidence / next step |
|---|---|---|---|
| FR-601 | Bedside swallow screen | BLOCKED | Phase 2 |
| FR-602 | Dysarthria/dysphagia checklist + respiratory red flags | BLOCKED | Phase 2 |

### M7 — Investigations

| ID | Requirement | Status | Evidence / next step |
|---|---|---|---|
| FR-701 | Immediate/urgent/routine/selective lists | BLOCKED | Needs approved content |
| FR-702 | Stroke/investigation library | BLOCKED | Needs approved content |
| FR-703 | Investigation picker per case | BLOCKED | Depends on FR-701/702 |

### M8 — Export

| ID | Requirement | Status | Evidence / next step |
|---|---|---|---|
| FR-801 | Handover/admission note + PDF | DONE | Copyable text note + print/PDF view (`CasePrintPage`) |
| FR-802 | JSON backup export/import | DONE | `exportBackup`, `importBackup`, typed schema |

### M9 — Guideline registry

| ID | Requirement | Status | Evidence / next step |
|---|---|---|---|
| FR-901 | Guideline library + version registry | PARTIAL | `Source` schema, `/sources` page, planned list; registry empty |
| FR-902 | Draft/Approved badge per content item | DONE | `StatusBadge` on engine content; real content pending |

### M10 — Settings

| ID | Requirement | Status | Evidence / next step |
|---|---|---|---|
| — | Language ar/en + RTL | DONE | `i18n`, `preferences`, `Layout` |
| — | Theme light/dark/system | DONE | `preferences`, `SettingsPage` |
| — | Disclaimer gate | DONE | `DisclaimerGate` |
| — | Wipe all data | DONE | Typed `DELETE` confirmation |

## Non-functional requirements

| ID | Requirement | Status | Evidence / next step |
|---|---|---|---|
| NFR-01 | PWA: manifest, service worker, installable, offline | DONE | `vite-plugin-pwa`, Workbox, icons; cold deep-link served with preview server stopped |
| NFR-02 | LCP < 2 s; JS bundle < 300 KB gzip | PARTIAL | JS ≈ 140.5 KB gzip, CSS ≈ 6.6 KB gzip; LCP not measured on device |
| NFR-03 | Privacy: IndexedDB only, no patient identifiers, no analytics, wipe | DONE | No network calls; schema rejects nothing extra, but UI warns |
| NFR-04 | Accessibility: RTL, 44px targets, labels | DONE | Lighthouse Accessibility 100 on 8 routes; 44px targets; RTL verified |
| NFR-05 | Pure logic + high test coverage | PARTIAL | 56 unit + 6 E2E tests pass; line coverage not measured |
| NFR-06 | Content separate from code + schema validation | DONE (framework) | Zod schemas; content objects in `src/content` |
| NFR-07 | Versioning + CHANGELOG | DONE | `0.1.0`, `CHANGELOG.md` |
| NFR-08 | Disclaimer + footer | DONE | Gate, footer, settings re-open |

## Acceptance tests written so far

| Spec example | Coverage |
|---|---|
| Score maximum / minimum / item boundaries | `calculateScore` tests (sum, min/max, band boundaries) |
| Incomplete score is not final | `complete: false` test + UI warning |
| GCS min 3 / max 15, V=T | **Not written** — needs approved GCS content |
| CHA2DS2-VASc boundary ages/sex | **Not written** — needs approved content |
| Dose weight zero/negative/huge rejected | Dose tests (`WEIGHT_OUT_OF_RANGE`) |
| Wrong unit rejected | `INVALID_UNIT` test |
| Drug with itself / no interaction message | Interaction dedupe + empty-result tests |
| Offline after first load | Workbox cold-start (manual) + Playwright `setOffline` reload/deep-link test |
