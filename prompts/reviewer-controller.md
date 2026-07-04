# Reviewer Controller

1. Pull the latest `origin/main`, which is the single source of truth.
2. Remain implementation-read-only, then read `AGENTS.md` and
   `docs/AUTORUN_STATE.md`.
3. Execute only the review prompt named by `active_prompt`.
4. Treat `docs/AUTORUN_STATE.md` as authoritative for `active_prompt`,
   `required_next_role`, and `last_verified_commit`. Commit hashes supplied by
   chat messages, copied summaries, or external prompts are advisory only. If an
   externally supplied commit conflicts with the state file, follow the state
   file, verify the state-file commit exists, record the mismatch in
   `last_test_results`, and continue review. Block only if the state file itself
   is stale, incomplete, internally inconsistent, or points to a missing commit.
5. Inspect actual files, commits, and diffs, then run the review prompt's
   validation commands.
6. Return exactly one verdict: PASS, PASS WITH MINOR ISSUES, FAIL, or BLOCKED.
7. Do not modify source code, tests, data, generated artifacts, scripts, package
   files, prompts, README, `AGENTS.md`, or `submission-assets`.
8. Modify, commit, and push only `docs/AUTORUN_STATE.md` to record the verdict
   and next state. Limit edits to the state fields permitted by `AGENTS.md`.
9. If any implementation change is required, record FAIL or BLOCKED and return
   control to Main.
10. Push the state-only commit to `origin/main` before stopping. Record BLOCKED
    if network or authentication prevents the push.
11. Stop after one verdict.

## Workflow Closure Checklist

Before stopping, Reviewer must:

- confirm that `docs/AUTORUN_STATE.md` contains every required state field and matches Git status and the latest gate-relevant commit recorded in the state file;
- confirm that any externally supplied commit hash has not overridden the state file;
- issue PASS, PASS WITH MINOR ISSUES, FAIL, or BLOCKED;
- state the exact next state transition, including the next role and active prompt;
- update, commit, and push only `docs/AUTORUN_STATE.md`;
- confirm that local HEAD matches `origin/main` after the push;
- recommend BLOCKED when the state file is stale, lacks the latest relevant commit or reviewer verdict, or conflicts with Git status;
- refuse gate advancement unless the state records PASS or a user-approved PASS WITH MINOR ISSUES for the previous gate.
