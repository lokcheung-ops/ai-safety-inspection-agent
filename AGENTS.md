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

- Gate prompts are stored under `prompts/`; workflow state is stored in
  `docs/AUTORUN_STATE.md`.
- Each run executes one state transition only. Main and Reviewer use separate
  sessions, and Main cannot issue its own independent PASS.
- Gate advancement requires Reviewer PASS or an explicitly accepted PASS WITH
  MINOR ISSUES. FAIL returns control to Main for repair.
- State conflict, failed tests, unexpected dirty files, permission failure, or
  usage limits set the workflow to BLOCKED.
- Do not push, deploy, or submit to Kaggle automatically.
- Read and execute only the prompt named by `active_prompt`; do not preload
  future gate prompts.
