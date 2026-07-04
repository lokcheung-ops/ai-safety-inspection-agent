# Reviewer Controller

1. Remain read-only.
2. Read `AGENTS.md` and `docs/AUTORUN_STATE.md`.
3. Execute only the review prompt named by `active_prompt`.
4. Inspect actual files, commits, and diffs, then run the review prompt's validation commands.
5. Return exactly one verdict: PASS, PASS WITH MINOR ISSUES, FAIL, or BLOCKED.
6. Do not modify production files, tests, prompts, or generated artifacts.
7. Update `docs/AUTORUN_STATE.md` only if repository policy explicitly permits Reviewer updates to that file.
8. Otherwise provide the exact state transition for Main to record, including the next role and active prompt.
9. Stop after one verdict.

## Workflow Closure Checklist

Before stopping, Reviewer must:

- confirm that `docs/AUTORUN_STATE.md` contains every required state field and matches Git status and the latest relevant commit;
- issue PASS, PASS WITH MINOR ISSUES, FAIL, or BLOCKED;
- state the exact next state transition, including the next role and active prompt;
- update `docs/AUTORUN_STATE.md` only when repository policy permits it;
- otherwise instruct Main to copy the transition into `docs/AUTORUN_STATE.md` before implementation continues;
- recommend BLOCKED when the state is stale, lacks the latest relevant commit or reviewer verdict, or conflicts with Git status;
- refuse gate advancement unless the state records PASS or a user-approved PASS WITH MINOR ISSUES for the previous gate.
