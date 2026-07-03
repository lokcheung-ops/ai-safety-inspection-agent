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