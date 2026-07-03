# Work Package 1 Plan

## Scope

Work Package 1 establishes a deterministic, auditable data foundation aligned with the official four-page Hong Kong Labour Department Form 3A. OCR is not implemented; later normalized observations will represent reviewed post-extraction synthetic demonstration data.

## Phase gates

1. Gate 2: official bilingual field catalogue and catalogue validation.
2. Gate 3: canonical five-week synthetic fixture and independent story acceptance expectations.
3. Gate 4A: normalized JSON and weekly summaries.
4. Gate 4B: normalized XLSX.
5. Gate 4C: Form 3A PDFs and visual QA; the bilingual rendering strategy will be decided before this gate.
6. Gate 4D: UI demo projection with page-level PDF references.
7. Gate 5: deterministic expected findings validated against fixture expectations.
8. Gate 6: manifest, reproducibility checks, full validation, and handoff.

Each gate stops after its own acceptance criteria pass.

## Frozen data rules

- One canonical fixture will be the sole factual source for the five-week story.
- Narrative content is stored only as `recommendation`.
- The inconsistency identifier is `rating_recommendation_inconsistency`.
- `N/A` and blank remain distinct.
- Extraction review and safety finding review use separate statuses.
- Generated artifacts must use deterministic metadata or `SOURCE_DATE_EPOCH`; uncontrolled runtime timestamps are excluded from reproducibility comparisons.

## Future generated artifacts

Final PDFs, normalized JSON, XLSX, UI data, expected findings, extraction review cases, and the manifest will be version controlled. The extraction review output path will be:

`generated/work-package-1/extraction-review-cases.json`

It will be generated from the canonical fixture and will not be independently maintained.

The Gate 3 fixture will contain explicit acceptance expectations for the scaffold sequence `S,P,P,S,P`, required finding types, exactly one intentional ladder `rating_recommendation_inconsistency`, and at least one Poor item without a linked recommendation. Findings will be compared with these independent expectations rather than generating both result and oracle from one analysis function.

## Non-goals

Work Package 1 does not implement OCR, OCR confidence scoring, ADK, MCP, weather or alert retrieval, databases, authentication, deployment, frontend redesign, legal conclusions, or automatic rating changes.
