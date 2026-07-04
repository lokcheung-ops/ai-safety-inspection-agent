# Gate 3 Review

## Required context

Read `AGENTS.md`, `docs/AUTORUN_STATE.md`, `prompts/reviewer-controller.md`, the committed Gate 3 fixture, contracts, tests, and the prior catalogue. Confirm the active prompt and Reviewer role.

## Scope

Review the canonical fixture and its independent story expectations. Remain read-only.

## Acceptance criteria

- The fixture is the sole factual story source and uses only valid catalogue IDs.
- Dates, daily values, recommendations, signatures, and extraction cases meet Gate 3 requirements.
- The scaffold sequence and required anomaly expectations are explicit fixture assertions, not results from a later analysis function.
- No Gate 4 or later artifact or generator exists.

## Tests

Run the targeted Gate 3 tests, catalogue tests, lint, typecheck, build, full tests, forbidden-field search, and `git diff --check` under the pinned runtime.

## Stop boundary

Do not modify files, repair defects, generate normalized data, or read future gate prompts.

## Final report

Return: PASS, PASS WITH MINOR ISSUES, or FAIL; reviewed commit; evidence; commands; issues; and an exact state transition. PASS activates `prompts/gate-4a-implementation.md`; FAIL returns Main to a Gate 3 repair; conflict sets BLOCKED.
