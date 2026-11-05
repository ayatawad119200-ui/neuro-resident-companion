# PRD — Neuro Resident Companion (NRC)

## 1. Product summary

NRC is an offline-first, installable web app that gives a neurology resident a
structured workspace for case history, clinical scores, decision trees, drug
dosing/interactions, and handover notes. It is a **decision-support tool**, not
an autonomous prescriber and not a replacement for the local protocol.

## 2. Problem

Residents often work with fragmented notes, memory-based score arithmetic,
unclear guideline provenance, and unreliable connectivity. NRC aims to:

- keep a local, identifier-free case record;
- make calculations reproducible from source-verified content;
- show the provenance and review status of every clinical value;
- work fully offline after the first load.

## 3. Users

- Primary: neurology residents on call.
- Secondary: supervising consultants reviewing a handover.
- Not for patients or non-clinical users.

## 4. Goals (MVP)

1. Offline-first installable PWA with an Arabic RTL interface and English
   medical terminology.
2. Local case records with demographics, Last Known Well, history, notes, BMI,
   and a copyable handover note.
3. A pure clinical engine for scores, decision trees, dosing, and interactions.
4. A source registry and draft/approved governance for clinical content.
5. Local JSON backup/restore and a typed destructive wipe.

## 5. Non-goals

- No cloud sync, accounts, analytics, telemetry, or runtime network calls.
- No patient identifiers (name, file number, phone, national ID).
- No AI-generated clinical advice at runtime.
- No claim of regulatory approval or replacement for local protocols.
- No real clinical content in Phase 0/1; it is added only from pasted sources.

## 6. Safety principles

- The AI never writes a dose, cut-off, score value, recommendation, or
  investigation list from memory. Missing values are `TODO_VERIFY`.
- Every clinical item is tied to a source, version, and review status.
- Draft content is not presented as approved. Demo content is explicitly
  non-clinical.
- Scores with missing items are marked incomplete.
- Dose caps are absolute and rounding always floors downward.
- Interaction absence means “not found in loaded content”, never “safe”.
- The treating physician remains responsible; the disclaimer gate is mandatory.

## 7. Module status

| Module | Scope | Phase 0/1 status |
|---|---|---|
| M1 History | Case, complaints, history, LKW | Core case CRUD done; templates/red flags pending |
| M2 Neuro exam | GCS, cranial nerves, motor, reflexes | Not started |
| M3 Scores | 18 planned scores | Generic engine done; content pending |
| M4 Algorithms | Decision trees | Runner + validation done; content pending |
| M5 Drugs | Dosing + interactions | Engines + demo UI done; content pending |
| M6 Bulbar/swallow | Swallow screen | Not started |
| M7 Investigations | Immediate/urgent/routine lists | Not started |
| M8 Export | Handover + JSON backup | Text handover, print/PDF view, and JSON backup done |
| M9 Guideline registry | Sources + versions | Registry page/schema done; empty by design |
| M10 Settings | Language, theme, data controls | Done |

## 8. Success criteria

- App loads and all screens work with the network disabled after first load.
- `npm run typecheck`, `npm test`, and `npm run build` pass.
- No clinical value exists without a source and status.
- Every score/dose boundary case in the acceptance tests is covered.
- A resident can create a case, reopen it, and copy a handover note without
  entering an identifier.

## 9. Roadmap

- **Phase 0 (done):** setup, PWA, Dexie, i18n/RTL/theme, disclaimer/settings.
- **Phase 1 (done):** schemas, source registry scaffold, score/algorithm/dose/
  interaction engines and tests.
- **Phase 2 (blocked on source text):** real clinical modules, one item at a
  time, draft → review → approved.
- **Phase 3:** five-doctor pilot and deployment.
  (PDF export, Lighthouse/a11y, offline verification, and Playwright E2E are done.)
