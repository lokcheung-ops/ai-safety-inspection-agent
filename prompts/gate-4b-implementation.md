# Gate 4B Implementation

## Required context

Read `AGENTS.md`, `docs/AUTORUN_STATE.md`, `prompts/main-controller.md`, and committed Gate 3 and Gate 4A contracts and outputs. Confirm the active prompt and Main role.

## Scope

Generate the normalized XLSX workbook from canonical and derived data using the approved repository XLSX dependency. Do not introduce another factual source.

## Acceptance criteria

- The workbook contains Reports, Observations, Recommendations, Extraction Review, Weekly Summaries, Expected Findings, and Field Catalogue sheets. Before Gate 5, Expected Findings contains only fixture expectation records clearly identified as expectations, not generated findings.
- Machine-readable sheets use typed dates, filters, frozen headers, stable IDs, readable widths, and no unnecessary merged cells.
- Workbook observation semantics match normalized JSON.
- Workbook metadata and ordering are reproducible.
- No PDF, UI projection, or finding analysis begins.

## Tests

Use test-first development. Verify sheet names, headers, types, counts, JSON parity, IDs, forbidden columns, and deterministic semantics. Run targeted Gate 4B tests, prior-gate tests, lint, typecheck, build, full tests, and `git diff --check`.

## Stop boundary

Commit only Gate 4B after all checks pass. Update state to `READY_FOR_GATE_4B_REVIEW`, activate `prompts/gate-4b-review.md`, require Reviewer, and stop.

## Final report

Return: commit, workbook path, sheet counts, parity evidence, commands, state update, issues, and confirmation that Gate 4C did not begin.
