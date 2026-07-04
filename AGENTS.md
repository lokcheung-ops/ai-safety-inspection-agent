## Safety Inspection Capstone — Frozen Rules

- Work Package 1 uses one canonical fixture as the sole factual source.
- Do not create or use a `remark` or `remarks` field.
- Narrative content is stored only as `recommendation`.
- Use `rating_recommendation_inconsistency`, not a remarks-based name.
- Sunday normally uses `N/A` because the synthetic site has no Sunday work.
- `N/A` and blank are different.
- Weekly dominant rating uses G/S/P daily counts.
- Exclude N/A and blank from dominance.
- Resolve ties by severity: P > S > G.
- Preserve daily observations and full rating counts.
- Keep `extraction_status` separate from `safety_review_status`.
- OCR is an architecture boundary and is not implemented.
- Do not implement ADK, MCP, external context, database, authentication,
  deployment, or frontend redesign inside Work Package 1.

## Instruction Maintenance

- AGENTS.md may be amended when a durable, cross-gate engineering rule is
  discovered.
- Do not add temporary task instructions, current defect details, or
  gate-specific implementation steps.
- Any AGENTS.md change must be explicitly reported, reviewed, and committed.
- Test-only verification oracles must never be imported by production code
  or used to generate production artifacts.

## Controlled Gate Workflow

- GitHub `origin/main` is the single source of truth for workflow state. Pull
  the latest `origin/main` before each Main or Reviewer run.
- Gate prompts are stored under `prompts/`; workflow state is stored in
  `docs/AUTORUN_STATE.md`.
- Each run executes one state transition only. Main and Reviewer use separate
  sessions, and Main cannot issue its own independent PASS.
- Gate advancement requires Reviewer PASS or an explicitly accepted PASS WITH
  MINOR ISSUES. FAIL returns control to Main for repair.
- State conflict, failed tests, unexpected dirty files, permission failure, or
  usage limits set the workflow to BLOCKED.
- Main may commit and push implementation, generated artifacts, tests, docs,
  and `docs/AUTORUN_STATE.md` only after the active gate's validation passes
  and the intended commit leaves the working tree clean.
- Independent Reviewer remains implementation-read-only. Reviewer may modify,
  commit, and push only `docs/AUTORUN_STATE.md` to record its verdict and next
  state.
- Reviewer state-only commits may update `reviewer_verdict`, `current_gate`,
  `current_role`, `current_state`, `last_completed_gate`,
  `last_verified_commit`, `active_prompt`, `required_next_role`,
  `allowed_next_states`, `blocker`, `last_commands`, `last_test_results`, and
  `updated_at`.
- Reviewer must not modify source code, tests, data, generated artifacts,
  scripts, package files, prompts, README, `AGENTS.md`, or
  `submission-assets` during review.
- If Reviewer requires an implementation change, it must record FAIL or
  BLOCKED in `docs/AUTORUN_STATE.md` and return control to Main.
- Every Main and Reviewer run must push its permitted committed state to
  `origin/main` before stopping, unless network or authentication failure is
  recorded as BLOCKED.
- Do not deploy or submit to Kaggle automatically.
- Read and execute only the prompt named by `active_prompt`; do not preload
  future gate prompts.
- Every completed Main run must update `docs/AUTORUN_STATE.md` before stopping.
- Every completed Reviewer run must update, commit, and push
  `docs/AUTORUN_STATE.md`.
- `docs/AUTORUN_STATE.md` must contain `current_gate`, `current_role`,
  `current_state`, `last_completed_gate`, `last_verified_commit`,
  `active_prompt`, `required_next_role`, `allowed_next_states`, `blocker`,
  `last_commands`, `last_test_results`, `reviewer_verdict`, and `updated_at`.
- Before Main stops, it must confirm a clean `git status --short` unless a dirty
  tree caused BLOCKED, and record the latest relevant commit, test results,
  next role, and active prompt in `docs/AUTORUN_STATE.md`.
- Before Reviewer stops, it must issue PASS, PASS WITH MINOR ISSUES, FAIL, or
  BLOCKED, record the exact next transition, and push the state-only commit.
- A stale state file, missing latest relevant commit, missing reviewer verdict,
  or Git-status conflict requires BLOCKED. Do not continue to the next gate.
- A gate may advance only when the state file records PASS for the previous
  gate, or PASS WITH MINOR ISSUES that the user explicitly accepted.
