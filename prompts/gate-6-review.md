# Gate 6 Review

## Required context

Read `AGENTS.md`, `docs/AUTORUN_STATE.md`, `prompts/reviewer-controller.md`, all committed Work Package 1 artifacts, manifest, documentation, code, tests, and QA records. Confirm the active prompt and Reviewer role.

## Scope

Perform the final read-only Work Package 1 review.

## Acceptance criteria

- Every required artifact exists, derives from the approved sources, and is version controlled.
- Manifest paths, counts, and checksums match the files.
- Clean regeneration and validation succeed under the pinned runtime.
- JSON/XLSX/UI semantics agree; PDFs pass structural and visual checks; findings match independent expectations.
- Documentation reports OCR and later systems as unimplemented boundaries.
- The repository contains no prohibited field, external service, frontend redesign, database, authentication, deployment, or later-work implementation.

## Tests

Run frozen install, full generation to a controlled temporary location where supported, full validation, all targeted suites, lint, typecheck, build, full tests, checksum and reproducibility checks, PDF visual QA, forbidden-field search, and `git diff --check`.

## Stop boundary

Do not modify or publish anything. Do not push, deploy, submit to Kaggle, or begin another work package.

## Final report

Return PASS, PASS WITH MINOR ISSUES, or FAIL; reviewed commit; artifact and manifest evidence; exact command results; issues; and the exact final state transition. PASS proposes `WORK_PACKAGE_1_COMPLETE`; FAIL returns Main for Gate 6 repair; conflict sets BLOCKED.
