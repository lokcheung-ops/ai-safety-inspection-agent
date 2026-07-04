# Gate 4D Review

## Required context

Read `AGENTS.md`, `docs/AUTORUN_STATE.md`, `prompts/reviewer-controller.md`, and the committed UI projection, canonical data, PDF artifacts, code, and tests. Confirm the active prompt and Reviewer role.

## Scope

Review the UI data projection and page-level artifact references. Remain read-only.

## Acceptance criteria

- All reports, IDs, pages, paths, observations, summaries, recommendations, and review cases resolve to committed sources.
- Navigation data exposes one page at a time and does not embed a frontend redesign.
- Output is deterministic and contains no independent story source or prohibited field.
- No Gate 5 implementation is present.

## Tests

Run targeted Gate 4D and prior-gate tests, lint, typecheck, build, full tests, reference-resolution checks, deterministic checks, forbidden-field search, and `git diff --check`.

## Stop boundary

Do not edit data or code, repair defects, build frontend components, or generate findings.

## Final report

Return one verdict, reviewed commit, evidence, commands, issues, and exact transition. PASS activates `prompts/gate-5-implementation.md`; FAIL returns Main for Gate 4D repair; conflict sets BLOCKED.
