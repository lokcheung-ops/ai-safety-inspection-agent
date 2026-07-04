# Reviewer Controller

1. Remain read-only.
2. Read `AGENTS.md` and `docs/AUTORUN_STATE.md`.
3. Execute only the review prompt named by `active_prompt`.
4. Inspect actual files, commits, and diffs, then run the review prompt's validation commands.
5. Return exactly one verdict: PASS, PASS WITH MINOR ISSUES, or FAIL.
6. Do not modify production files, tests, prompts, or generated artifacts.
7. Update `docs/AUTORUN_STATE.md` only if repository policy explicitly permits Reviewer updates to that file.
8. Otherwise provide the exact state transition for Main to record, including the next role and active prompt.
9. Stop after one verdict.
