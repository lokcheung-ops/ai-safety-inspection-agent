# Gate 4C Implementation

## Required context

Read `AGENTS.md`, `docs/AUTORUN_STATE.md`, `prompts/main-controller.md`, and committed catalogue, fixture, and normalized outputs. Confirm the active prompt and Main role.

## Scope

Choose and document the bilingual PDF rendering and font approach, then generate five structurally aligned four-page Form 3A PDFs and one combined 20-page PDF from the canonical fixture. Add PDF QA support and tests only.

## Acceptance criteria

- The documented rendering approach supports official English and Chinese labels without broken glyphs. Set BLOCKED if required licensed font assets are unavailable.
- Each report has exactly four A4 pages in official section order; the combined PDF has 20 pages.
- Reports include daily values, Page 4 recommendations, fictional signatures and dates, and the synthetic demonstration notice.
- PDF metadata and ordering are reproducible.
- Automated assertions and a rendered-page visual checklist cover all 20 pages for clipping, overlap, borders, glyphs, page breaks, and readability.
- No UI projection or finding implementation begins.

## Tests

Use test-first development. Run targeted PDF tests, page-count checks, text assertions, deterministic checks, prior-gate tests, lint, typecheck, build, full tests, visual QA, and `git diff --check`.

## Stop boundary

Commit only Gate 4C after automated and visual checks pass. Update state to `READY_FOR_GATE_4C_REVIEW`, activate `prompts/gate-4c-review.md`, require Reviewer, and stop.

## Final report

Return: commit, rendering decision, PDF paths and page counts, visual QA result, commands, state update, issues, and confirmation that Gate 4D did not begin.
