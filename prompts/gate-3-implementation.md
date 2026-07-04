# Gate 3 Implementation

## Required context

Read `AGENTS.md`, `docs/AUTORUN_STATE.md`, `prompts/main-controller.md`, the committed catalogue contracts, tests, and `docs/work-package-1-plan.md`. Confirm `active_prompt` names this file and Main is the required role.

## Scope

Create the canonical five-week synthetic fixture, its schema, fixture-only validation, extraction-review annotations, signatures, recommendations, and independent story acceptance expectations. Use the catalogue IDs. Follow test-first development.

## Acceptance criteria

- Exactly five consecutive Sunday-to-Saturday reports cover 2026-05-31 through 2026-07-04.
- All identities and signatures are clearly fictional.
- Every catalogue item has seven daily values; Sunday normally uses `N/A`, and blank stays distinct.
- Recommendations are Page 4 entries linked to catalogue items.
- The fixture includes at least two `Needs review` extraction cases without OCR confidence.
- Independent expectations specify scaffold `S,P,P,S,P`, required finding types, exactly one ladder `rating_recommendation_inconsistency`, and at least one Poor item without a recommendation.
- No normalized output, generator, finding implementation, PDF, XLSX, UI data, or manifest is created.

## Tests

Add focused fixture tests, then run the targeted Gate 3 suite, lint, typecheck, build, full tests, and `git diff --check` under the pinned runtime.

## Stop boundary

Commit only Gate 3 after all criteria pass. Update the state to `READY_FOR_GATE_3_REVIEW`, set Reviewer as the next role, activate `prompts/gate-3-review.md`, and stop.

## Final report

Return: commit hash, files changed, fixture counts, acceptance evidence, exact command results, state update, unresolved issues, and confirmation that Gate 4A did not begin.
