# Gate 6 Implementation

## Required context

Read `AGENTS.md`, `docs/AUTORUN_STATE.md`, `prompts/main-controller.md`, all committed Work Package 1 contracts and artifacts, and prior review transitions. Confirm the active prompt and Main role.

## Scope

Complete generation orchestration, validation, deterministic manifest and checksums, concise documentation, full artifact QA, and the Work Package 1 handoff. Do not add later product features.

## Acceptance criteria

- One command regenerates every committed Work Package 1 artifact from the catalogue and canonical fixture.
- The manifest records fixture version, deterministic generation metadata, source path, output paths, SHA-256 checksums, report/PDF/page/observation/recommendation/review/finding counts, and no self-checksum.
- A clean regeneration produces matching artifacts or approved semantic comparisons for container formats.
- JSON, XLSX, PDFs, UI data, findings, extraction-review cases, and manifest are version controlled.
- Documentation states scope, commands, aggregation, statuses, source references, synthetic policy, visual QA, limitations, and later-work boundaries.
- All automated and visual checks pass without external services.

## Tests

Use test-first development for orchestration and manifest behavior. Run frozen install, full generation, full validation, every targeted suite, lint, typecheck, build, full tests, reproducibility checks, checksum verification, PDF visual QA, forbidden-field search, and `git diff --check`.

## Stop boundary

Commit only the Gate 6 closeout after all checks pass. Update state to `READY_FOR_GATE_6_REVIEW`, activate `prompts/gate-6-review.md`, require Reviewer, and stop. Do not push, deploy, submit to Kaggle, or start another work package.

## Final report

Return: commit, artifact inventory and counts, manifest/reproducibility evidence, automated and visual results, state update, issues, and confirmation that no later work began.
