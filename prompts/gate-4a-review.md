# Gate 4A Review

## Required context

Read `AGENTS.md`, `docs/AUTORUN_STATE.md`, `prompts/reviewer-controller.md`, and the committed catalogue, fixture, normalization code, outputs, and tests. Confirm the active prompt and Reviewer role.

## Scope

Review normalized JSON, weekly summaries, source references, and extraction-review output. Remain read-only.

## Acceptance criteria

- Outputs derive only from the fixture and preserve daily observation grain.
- Counts, dominance, tie-breaking, scaffold sequence, and YES/NO treatment are correct.
- Every source reference resolves.
- Regeneration is deterministic and committed outputs match regenerated semantics.
- No Gate 4B or later implementation is present.

## Tests

Run targeted Gate 4A and prior-gate tests, lint, typecheck, build, full tests, deterministic regeneration checks, forbidden-field search, and `git diff --check`.

## Stop boundary

Do not modify outputs or code, repair failures, or create XLSX/PDF/UI/findings artifacts.

## Final report

Return one verdict, reviewed commit, evidence, commands, issues, and exact transition. PASS activates `prompts/gate-4b-implementation.md`; FAIL returns Main for Gate 4A repair; conflict sets BLOCKED.
