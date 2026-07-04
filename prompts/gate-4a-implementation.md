# Gate 4A Implementation

## Required context

Read `AGENTS.md`, `docs/AUTORUN_STATE.md`, `prompts/main-controller.md`, and the committed catalogue and Gate 3 fixture contracts. Confirm the active prompt and Main role.

## Scope

Generate normalized JSON, weekly summaries, resolvable source references, and `generated/work-package-1/extraction-review-cases.json` from the canonical fixture. Add only the derivation and validation code needed for these outputs.

## Acceptance criteria

- The observation grain is report by inspection item by calendar day, with deterministic ordering.
- Daily values, recommendations, source references, and extraction statuses derive from the fixture.
- G/S/P/N/A/blank counts preserve `N/A` and blank, exclude both from dominance, and resolve ties P over S over G.
- The scaffold dominant sequence is `S,P,P,S,P`.
- YES/NO summaries do not invent G/S/P dominance.
- Extraction-review output derives from fixture annotations and contains no OCR confidence.
- Generated JSON uses deterministic metadata and contains no prohibited field.
- No XLSX, PDF, UI projection, or findings implementation begins.

## Tests

Use test-first development. Test observation counts, ordering, aggregation, source resolution, extraction cases, deterministic regeneration, and forbidden fields. Run targeted Gate 4A tests, lint, typecheck, build, full tests, and `git diff --check`.

## Stop boundary

Commit only Gate 4A after all checks pass. Update state to `READY_FOR_GATE_4A_REVIEW`, activate `prompts/gate-4a-review.md`, require Reviewer, and stop.

## Final report

Return: commit, artifacts, counts, aggregation evidence, command results, state update, issues, and confirmation that Gate 4B did not begin.
