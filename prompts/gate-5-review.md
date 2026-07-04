# Gate 5 Review

## Required context

Read `AGENTS.md`, `docs/AUTORUN_STATE.md`, `prompts/reviewer-controller.md`, fixture expectations, committed finding logic, findings artifact, source utilities, and tests. Confirm the active prompt and Reviewer role.

## Scope

Review deterministic findings against the independent fixture expectations. Remain read-only.

## Acceptance criteria

- Required findings and exact ladder inconsistency count match fixture expectations.
- Evidence and sources resolve; interpretation and action remain separate from verified facts.
- Safety review status is valid and observations have no safety review status.
- Findings contain no unsupported external context, legal conclusion, causation claim, rating change, or prohibited field.
- No Gate 6 implementation is present.

## Tests

Run targeted Gate 5 and prior-gate tests, lint, typecheck, build, full tests, expectation comparison, source-resolution checks, deterministic checks, forbidden-field search, and `git diff --check`.

## Stop boundary

Do not edit findings or code, repair defects, or create the final manifest and handoff.

## Final report

Return one verdict, reviewed commit, evidence, commands, issues, and exact transition. PASS activates `prompts/gate-6-implementation.md`; FAIL returns Main for Gate 5 repair; conflict sets BLOCKED.
