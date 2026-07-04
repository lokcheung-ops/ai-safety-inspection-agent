# Work Package 1 Handoff

## Completed scope

Work Package 1 provides a deterministic evidence foundation for the capstone story. It starts from one canonical synthetic Form 3A fixture and the official bilingual field catalogue, then produces normalized records, review artifacts, and a traceable Safety Review Brief.

The completed flow is:

1. Five canonical synthetic Form 3A reports define the sole factual story.
2. Gate 4A produces 2,275 daily observations, 325 weekly summaries, eight recommendations, and three extraction-review cases.
3. Gate 4B exports the same reviewed data to a seven-sheet XLSX workbook.
4. Gate 4C renders five four-page PDFs and one combined twenty-page PDF.
5. Gate 4D provides report switching and one-page-at-a-time PDF references as data only.
6. Gate 5 produces five evidence-linked findings in the Safety Review Brief.
7. Gate 6 regenerates the complete artifact set and records SHA-256 checksums in the manifest.

## Artifact inventory

| Path | Purpose |
| --- | --- |
| `data/form3a/canonical-five-week-fixture.json` | Sole factual source for the synthetic five-week story |
| `data/form3a/field-catalogue.json` | Official four-page Form 3A field and item structure |
| `generated/work-package-1/normalized-data.json` | Daily observations, weekly summaries, and recommendations |
| `generated/work-package-1/extraction-review-cases.json` | Separate extraction data-quality review queue |
| `generated/work-package-1/normalized-data.xlsx` | Seven-sheet professional review workbook |
| `generated/work-package-1/pdfs/F3A-R01.pdf` through `F3A-R05.pdf` | Five individual four-page Form 3A reports |
| `generated/work-package-1/pdfs/form3a-five-week-combined.pdf` | One combined twenty-page report |
| `generated/work-package-1/ui-projection.json` | Report switching and single-page PDF reference model |
| `generated/work-package-1/safety-review-brief.json` | Five deterministic findings with verified evidence and suggested actions |
| `generated/work-package-1/manifest.json` | Artifact paths, purposes, counts, and SHA-256 checksums |

The manifest deliberately has no self-checksum.

## Data and review rules

- Daily observations retain report, page, section, item, date, weekday, rating, recommendation, and display source references.
- Weekly G/S/P dominance excludes `N/A` and blank values. `N/A and blank` remain distinct. Ties use severity order P > S > G.
- `extraction_status` describes extraction confidence and remains separate from `safety_review_status`, which is `Pending` for every generated finding.
- Recommendations and findings remain subject to professional review. No rating is changed automatically.
- Extraction-review cases are data-quality items and are not safety findings.
- All data is synthetic and uses fictional project, company, personnel, signature, and site details.

## Reproducibility

Required runtime: Node.js 24.14.1 and pnpm 11.7.0 through Corepack.

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm generate:gate6
corepack pnpm test:gate6
corepack pnpm test:gate5
corepack pnpm test:gate4d
corepack pnpm test:gate4c
corepack pnpm test:gate4b
corepack pnpm test:gate4a
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test
```

`corepack pnpm generate:gate6` runs the Gate 4A, 4B, 4C, 4D, and 5 generators in order, then creates the manifest. Deterministic metadata is used for XLSX and PDF container formats, so a clean regeneration is checked byte-for-byte.

## Verification and visual QA

Automated checks cover schema and source resolution, aggregation rules, workbook structure and frozen headers, PDF page counts and bilingual text, UI page references, finding expectations, artifact counts, SHA-256 checksums, and deterministic regeneration.

PDF visual QA uses Poppler and does not modify the committed PDFs:

```bash
corepack pnpm render:gate4c
```

The command renders all twenty combined pages under `tmp/pdfs/gate4c/`. Review every page for clipping, overlap, broken borders, missing glyphs, page-order errors, and unreadable text.

## Architecture boundaries

- OCR is not implemented.
- ADK is not implemented.
- MCP is not implemented.
- weather context is not implemented.
- safety-alert context is not implemented.
- frontend is not implemented.
- database is not implemented.
- authentication is not implemented.
- deployment is not implemented.
- Kaggle submission is not implemented.

Work Package 1 also does not provide live external integrations, production document ingestion, legal or accident-causation conclusions, automatic rating changes, or operational approval. The PDFs are generated from approved synthetic structured data; they are not OCR results.

## Later packaging handoff

After independent Gate 6 review, later capstone packaging may reference the committed manifest, architecture image, artifact inventory, reproducibility evidence, and concise finding examples. Packaging must keep the synthetic-data notice, human-review boundary, and unimplemented-feature statements intact. Submission, presentation media, external context, and product implementation remain separate later work.
