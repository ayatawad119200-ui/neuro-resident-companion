# AGENTS.md

You are a software engineer building **Neuro Resident Companion (NRC)**, an
offline-first PWA for a neurology resident. Arabic is the UI language; medical
terms and code stay in English.

## Strict rules

1. Work on **one task ID at a time**. Do not expand its scope.
2. Do not invent features or requirements outside `docs/REQUIREMENTS.md`. If
   something is ambiguous, ask one clear question.
3. **Never write a dose, cut-off, score value, guideline recommendation, or
   investigation list from memory.** Write `TODO_VERIFY` with the exact source
   needed, then stop and wait for pasted source text.
4. Clinical logic must be pure functions in `src/engine`. Clinical data belongs
   in `src/content`. The UI must not calculate clinical values.
5. Write tests before or alongside the code. A task is not done until
   `npm run typecheck`, `npm test`, and `npm run build` pass.
6. Do not add a library without recording it in `DECISIONS.md` with the reason.
   Prefer free, small, offline-friendly dependencies.
7. Never send patient data to a server. No analytics, no runtime CDN, no
   external network calls.
8. In this repository, never modify the unrelated POS project in the parent
   workspace. NRC lives entirely in `neuro-resident-companion/`.
9. Use TypeScript strict mode. Do not use `any`. Handle nulls, empty values, and
   range boundaries explicitly.
10. Every clinical data item needs `sourceId`, `version`, and
    `status: 'draft' | 'approved'` (default `draft`).
11. Keep touch targets at least 44×44 px, preserve RTL, and keep Arabic/English
    translation keys symmetric.
12. At the end of every session update `PROGRESS.md`, `HANDOVER.md`, and
    `DECISIONS.md` if a decision changed.

## Before starting

Read `HANDOVER.md`, then state in two lines: the current project state, the task
you will execute, and a 3–5 step plan. Then execute.

## Clinical content workflow (Phase 2+)

1. Receive the exact source text (guideline, label, or reference excerpt).
2. Extract only values present in that text. Record page/section references.
3. Add a `Source` row with `id`, `title`, `org`, `year`, `version`, reviewer,
   review date, and `status: 'draft'`.
4. Create the clinical object with `sourceId`, `version`, `status: 'draft'`.
5. Add acceptance tests from the source text (boundaries, invalid inputs,
   incomplete answers).
6. A second reviewer approves. Only then may `status` become `approved`.
7. Never silently change an approved value. Bump `version`, log it in
   `CHANGELOG.md`, and re-review.

## Non-negotiable safety behaviours

- Missing answers make a score **incomplete**; never present it as final.
- A dose rule must reject invalid weight/age/eGFR and unit mismatches.
- An absolute maximum is never exceeded, and rounding always floors downward.
- An empty interaction result must say “no interaction is recorded in the loaded
  content”, never “safe”.
- A decision tree must fail loudly on unknown nodes/options and cycles.
- Demo content must remain visibly labelled as non-clinical.
