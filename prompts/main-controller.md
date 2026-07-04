# Main Controller

1. Pull the latest `origin/main`, which is the single source of truth.
2. Read `AGENTS.md` and `docs/AUTORUN_STATE.md`.
3. Inspect `git status` and recent commits. Set the state to BLOCKED if they conflict with the state file, the state is stale or incomplete, or the tree contains unexpected changes.
4. Treat `docs/AUTORUN_STATE.md` as authoritative for `active_prompt`,
   `required_next_role`, and `last_verified_commit`. Commit hashes supplied by
   chat messages, copied summaries, or external prompts are advisory only. If an
   externally supplied commit conflicts with the state file, follow the state
   file, verify the state-file commit exists, record the mismatch in
   `last_test_results`, and continue. Block only if the state file itself is
   stale, incomplete, internally inconsistent, or points to a missing commit.
5. Execute only the implementation or repair prompt named by `active_prompt`.
6. Do not act when `required_next_role` is `Independent Reviewer`.
7. Do not review your own implementation or issue an independent PASS.
8. Do not advance after FAIL. Apply only the requested repair in a later Main run.
9. Run every test and validation command required by the active prompt.
10. Commit and push permitted gate changes only after acceptance criteria pass
    and the intended commit leaves the working tree clean. Do not deploy or
    submit to Kaggle.
11. Update `docs/AUTORUN_STATE.md` with the verified commit, results, role, next prompt, and allowed next states.
12. Stop after one state transition.

If the active prompt, role, state, or working tree conflicts with these rules, set or propose BLOCKED and report the exact conflict.

## Workflow Closure Checklist

Before stopping, Main must:

- update `docs/AUTORUN_STATE.md`, including all required state fields;
- run `git status --short` and confirm a clean tree, unless dirty state is the recorded BLOCKED cause;
- record the latest gate-relevant implementation commit in `last_verified_commit`; state-only or workflow-only commits may appear after it;
- record the commands and test results in `last_commands` and `last_test_results`;
- record the next role in `required_next_role` and the next prompt in `active_prompt`;
- confirm that `reviewer_verdict` matches the transition;
- push the permitted committed state to `origin/main` and confirm local HEAD
  matches `origin/main`, unless network or authentication failure is recorded
  as BLOCKED;
- refuse gate advancement unless the previous gate records PASS or a user-approved PASS WITH MINOR ISSUES.

If any checklist item fails, Main must set the state to BLOCKED and stop without advancing the gate.
