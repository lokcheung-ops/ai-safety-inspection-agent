# Gate 5 Implementation

## Required context

Read `AGENTS.md`, `docs/AUTORUN_STATE.md`, `prompts/main-controller.md`, the canonical fixture expectations, normalized data, source-reference utilities, and prior tests. Confirm the active prompt and Main role.

## Scope

Implement deterministic findings and generate the expected findings artifact. Compare analysis results with the independent fixture acceptance expectations.

## Acceptance criteria

- Findings include scaffold repeated or worsening, scaffold improved then recurred, exactly one ladder `rating_recommendation_inconsistency`, and a Poor item without a recommendation.
- Missing follow-up evidence appears only when fixture evidence supports it.
- Every finding separates verified evidence, interpretation, suggested action, source references, and `safety_review_status: Pending`.
- Source references resolve, recorded ratings remain unchanged, and findings contain no weather, alert, legal, compliance, or causation claims.
- The analysis function does not generate its own expected oracle.
- No Gate 6 manifest or handoff work begins.

## Tests

Use test-first development. Compare deterministic output with fixture expectations; test each finding type, counts, evidence resolution, status vocabulary, forbidden fields, and deterministic regeneration. Run targeted Gate 5 tests, prior-gate tests, lint, typecheck, build, full tests, and `git diff --check`.

## Stop boundary

Commit only Gate 5 after all checks pass. Update state to `READY_FOR_GATE_5_REVIEW`, activate `prompts/gate-5-review.md`, require Reviewer, and stop.

## Final report

Return: commit, finding counts and types, expectation comparison, commands, state update, issues, and confirmation that Gate 6 did not begin.
