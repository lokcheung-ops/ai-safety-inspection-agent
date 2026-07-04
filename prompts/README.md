# Controlled Gate Prompts

Use one Main session for implementation or repair and a separate Independent Reviewer session for review. Every session reads `AGENTS.md` and `docs/AUTORUN_STATE.md`, then executes only the file named by `active_prompt`.

- Main follows `prompts/main-controller.md`.
- Reviewer follows `prompts/reviewer-controller.md`.
- A run stops after one implementation, repair, state-recording, or verdict transition.
- Future prompts remain unread until the state file activates them.

The Reviewer returns an exact state transition. Main records that transition in a later run because Reviewer sessions remain read-only.
