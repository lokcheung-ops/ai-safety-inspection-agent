# Main Controller

1. Read `AGENTS.md`.
2. Read `docs/AUTORUN_STATE.md`.
3. Inspect `git status` and recent commits. Set the state to BLOCKED if they conflict with the state file or contain unexpected changes.
4. Execute only the implementation or repair prompt named by `active_prompt`.
5. Do not act when `required_next_role` is `Independent Reviewer`.
6. Do not review your own implementation or issue an independent PASS.
7. Do not advance after FAIL. Apply only the requested repair in a later Main run.
8. Run every test and validation command required by the active prompt.
9. Commit only after its acceptance criteria pass. Do not push, deploy, or submit.
10. Update `docs/AUTORUN_STATE.md` with the verified commit, results, role, next prompt, and allowed next states.
11. Stop after one state transition.

If the active prompt, role, state, or working tree conflicts with these rules, set or propose BLOCKED and report the exact conflict.
