# Tasks

Status: `TODO | DOING | REVIEW | DONE | BLOCKED`
Definition of Done: code + green tests + sourced content (if clinical) +
`PROGRESS.md`/`HANDOVER.md` updated + clear commit.

## Phase 0 — Setup

| ID | Task | Status | Notes |
|---|---|---|---|
| T-001 | Vite + React + TS + Tailwind + Vitest + ESLint | DONE | ESLint 10 flat config installed; `npm run check` = lint + typecheck + tests |
| T-002 | PWA manifest, service worker, icons, offline test | DONE | Workbox precache; offline cold-open verified with server stopped (D-012) |
| T-003 | Dexie schema + case CRUD | DONE | Autosave, list, create, edit, delete |
| T-004 | i18n ar/en + RTL + light/dark/system | DONE | Symmetric dictionaries, persisted preferences |
| T-005 | Disclaimer + settings + wipe | DONE | Gate, re-open modal, export/import, typed `DELETE` wipe |

## Phase 1 — Engine & content framework

| ID | Task | Status | Notes |
|---|---|---|---|
| T-010 | Zod schemas + content validator + source registry | DONE | Schemas in `engine/types.ts`; empty registry + planned list |
| T-011 | Generic score engine + tests | DONE | `calculateScore`, 8 tests |
| T-012 | Decision-tree runner + tests | DONE | Walker, validator, 16 tests |
| T-013 | Dose engine + units + hard limits + tests | DONE | Caps, floor rounding, range checks, 14 tests |
| T-014 | Interaction engine + tests | DONE | Severity sort + dedupe, 7 tests |

## Phase 2 — Clinical modules

**All blocked until the exact source text is pasted and a source row is
created. Do not fill these from memory.**

| ID | Task | Status | Depends on |
|---|---|---|---|
| T-020 | History templates (Stroke first) | BLOCKED | FR-102/103 source text |
| T-021 | Exam forms + GCS + NIHSS | BLOCKED | FR-201, FR-301 |
| T-022 | Remaining scores (batches of 3) | BLOCKED | FR-301, FR-302 |
| T-023 | Algorithm: acute ischemic stroke | BLOCKED | FR-401/402 |
| T-024 | Algorithms: ICH + SAH | BLOCKED | FR-401/402 |
| T-025 | Algorithm: status epilepticus | BLOCKED | FR-401/402 |
| T-026 | Bulbar/swallow screen | BLOCKED | FR-601/602 |
| T-027 | Antithrombotics + reversal | BLOCKED | FR-501–505 |
| T-028 | Lipid-lowering | BLOCKED | FR-506 |
| T-029 | Antiepileptics | BLOCKED | FR-501–504 |
| T-030 | Investigations library | BLOCKED | FR-701–703 |

## Phase 3 — Polish

| ID | Task | Status | Notes |
|---|---|---|---|
| T-040 | Export/import + handover note | DONE | JSON backup/restore, text handover, and print-to-PDF view |
| T-041 | E2E + Lighthouse + a11y | DONE | Lighthouse a11y/best-practices/SEO 100 on 8 routes; 6 Playwright E2E tests pass |
| T-042 | Five-doctor pilot + feedback | TODO | Requires approved content first |
| T-043 | Deployment + CHANGELOG v0.1 | DOING | CHANGELOG v0.1 written; GitHub Pages workflow + `BASE_PATH` added; publishing in progress |

## Immediate next step

Do **not** start Phase 2. Wait for the user to paste the first source text
(recommended: acute ischemic stroke guideline section). Then:

1. Create a `Source` row with version and review fields.
2. Add one draft score/algorithm/drug object.
3. Add boundary tests from the source text.
4. Keep `status: 'draft'` until second-person review.
