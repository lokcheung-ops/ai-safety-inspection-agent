# Gate 4D Implementation

## Required context

Read `AGENTS.md`, `docs/AUTORUN_STATE.md`, `prompts/main-controller.md`, and committed catalogue, fixture, normalized outputs, and PDF artifact paths. Confirm the active prompt and Main role.

## Scope

Generate a UI-friendly data projection with report switching and one-page-at-a-time PDF references. Do not build or redesign a frontend.

## Acceptance criteria

- UI data derives from canonical or already derived records and uses stable IDs.
- Each of five reports exposes four ordered page references, current report metadata, observations, summaries, recommendations, and extraction-review queue data required by the planned UI.
- Page references resolve to committed PDFs and support previous/next navigation with a page indicator.
- Output ordering and metadata are reproducible.
- No frontend component or finding analysis begins.

## Tests

Use test-first development. Verify report/page counts, canonical ID resolution, PDF paths, ordering, forbidden fields, deterministic output, and no duplicated story data. Run targeted Gate 4D tests, prior-gate tests, lint, typecheck, build, full tests, and `git diff --check`.

## Stop boundary

Commit only Gate 4D after all checks pass. Update state to `READY_FOR_GATE_4D_REVIEW`, activate `prompts/gate-4d-review.md`, require Reviewer, and stop.

## Final report

Return: commit, UI artifact path and counts, reference evidence, commands, state update, issues, and confirmation that Gate 5 did not begin.
