# Gate 4C Review

## Required context

Read `AGENTS.md`, `docs/AUTORUN_STATE.md`, `prompts/reviewer-controller.md`, the documented PDF approach, committed PDFs, source data, code, tests, and QA checklist. Confirm the active prompt and Reviewer role.

## Scope

Review PDF structure, reproducibility, traceability, and visual quality. Remain read-only.

## Acceptance criteria

- Five PDFs contain four pages each and the combined PDF contains 20 pages.
- Bilingual labels render correctly and official sections stay on their assigned pages.
- Values, recommendations, signatures, dates, and notices trace to the fixture.
- All rendered pages are readable without clipping, overlap, broken borders, glyph defects, or extra pages.
- No Gate 4D or later implementation is present.

## Tests

Run targeted Gate 4C and prior-gate tests, lint, typecheck, build, full tests, PDF page/text checks, deterministic checks, visual page inspection, and `git diff --check`.

## Stop boundary

Do not edit PDFs, code, or QA records, repair defects, or create UI/findings artifacts.

## Final report

Return one verdict, reviewed commit, automated and visual evidence, commands, issues, and exact transition. PASS activates `prompts/gate-4d-implementation.md`; FAIL returns Main for Gate 4C repair; conflict sets BLOCKED.
