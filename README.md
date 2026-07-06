# AI Safety Inspection Agent

Kaggle AI Agents Capstone, Agents for Business track.

This repository contains a deterministic evidence pipeline for reviewing five synthetic Hong Kong Labour Department Form 3A-style construction safety reports. It converts one canonical fixture into daily observations, weekly summaries, a review workbook, bilingual PDFs, UI reference data, and an evidence-linked Safety Review Brief.

The project supports human review. It does not make legal findings, change recorded ratings, or replace a Safety Officer's judgment.

**[Open the public read-only review demo](https://ai-safety-inspection-agent.vercel.app)**

![AI Safety Inspection Agent Architecture](assets/architecture.png)

## Problem

Construction safety report review is repetitive and evidence-heavy. A Safety Officer, Project Manager, or Auditor may need to compare several weeks of ratings, locate the source page for each issue, check whether recommendations exist, and confirm whether corrective evidence followed.

Loose summaries can hide the details that reviewers need. This project retains report, page, section, item, date, weekday, rating, recommendation, and PDF references so a reviewer can trace each result.

## Completed Work Package 1

Work Package 1 uses a synthetic five-week Form 3A dataset and an official bilingual field catalogue. The completed pipeline produces:

- 2,275 report × item × day observations;
- 325 weekly summaries;
- eight source-supported recommendations;
- three extraction-review cases kept separate from safety findings;
- a seven-sheet XLSX workbook with frozen headers;
- five individual four-page PDFs and one combined twenty-page PDF;
- a UI projection for report switching and page references, displayed by a static read-only review dashboard;
- five `Pending` Safety Review Brief findings;
- a manifest with paths, counts, purposes, and SHA-256 checksums.

The Safety Review Brief identifies a repeated scaffold issue, an R04 improvement followed by an R05 recurrence, one ladder rating-recommendation inconsistency, a Poor housekeeping observation without a recommendation, and missing scaffold follow-up evidence.

## Artifact map

| Artifact | Purpose |
| --- | --- |
| [`data/form3a/canonical-five-week-fixture.json`](data/form3a/canonical-five-week-fixture.json) | Sole factual source for the synthetic story |
| [`generated/work-package-1/normalized-data.json`](generated/work-package-1/normalized-data.json) | Daily observations, weekly summaries, and recommendations |
| [`generated/work-package-1/normalized-data.xlsx`](generated/work-package-1/normalized-data.xlsx) | Review workbook |
| [`generated/work-package-1/pdfs/`](generated/work-package-1/pdfs/) | Five individual PDFs and one combined PDF |
| [`generated/work-package-1/ui-projection.json`](generated/work-package-1/ui-projection.json) | Report and page reference data |
| [`generated/work-package-1/safety-review-brief.json`](generated/work-package-1/safety-review-brief.json) | Evidence-linked findings for professional review |
| [`generated/work-package-1/manifest.json`](generated/work-package-1/manifest.json) | Artifact inventory and checksums |

See the [Work Package 1 handoff](docs/work-package-1-handoff.md) for the full data rules, artifact inventory, and QA notes.

## Read-only demo

The Vite, React, and TypeScript dashboard reads the committed manifest, UI projection, Safety Review Brief, and PDFs directly. It supports report switching, native browser PDF preview, clickable findings, evidence details, individual and combined page references, and visible verification and boundary notes.

Run it locally:

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

Build the deployable static site with `corepack pnpm build:frontend`. Vercel uses the committed `vercel.json`; no backend or environment variables are required.

## Reproduce and verify

Requirements:

- Node.js 24.14.1
- Corepack with pnpm 11.7.0

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm generate:gate6
corepack pnpm test:gate6
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test
```

`generate:gate6` regenerates the Work Package 1 artifacts in gate order, then writes the manifest. The final packaging review confirmed 86 automated tests total (82 Work Package 1 tests plus 4 frontend regression tests), 11 valid artifact checksums, byte-identical clean regeneration, and visual QA across all 20 combined PDF pages.

## Review rules

- `N/A` and blank remain distinct.
- Weekly G/S/P dominance excludes `N/A` and blank. Ties use P > S > G.
- `extraction_status` stays separate from `safety_review_status`.
- Findings remain `Pending` until professional review.
- The pipeline does not change ratings.
- Extraction-review cases describe data-quality questions, not safety findings.

## Architecture boundaries

Work Package 1 does not implement OCR, ADK, MCP, weather context, safety-alert context, database, authentication, Kaggle submission, or external integrations. The PDFs come from approved synthetic structured data rather than scanned-document extraction.

Packaging adds only a deployed static read-only viewer for the approved artifacts. It has no backend, upload, editing, rating changes, production workflow, or production-readiness claim. The other capabilities remain future work.

## Submission packaging

- [Kaggle writeup draft](docs/kaggle-submission-writeup.md)
- [Five-minute video storyboard and script](docs/kaggle-video-script.md)
- [Final submission checklist](docs/final-submission-checklist.md)

The repository does not contain a submitted Kaggle entry or a finished video.
