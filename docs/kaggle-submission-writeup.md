# AI Safety Inspection Agent

## Project summary

AI Safety Inspection Agent is an evidence-preserving review workflow for construction safety inspection records. I built it for the Kaggle AI Agents Capstone, Agents for Business track.

A construction project can produce many inspection pages across several weeks. Safety Officers, Project Managers, and Auditors need to compare ratings, find recurring issues, check recommendations, and confirm follow-up evidence. Manual review takes time because the evidence sits across dates, items, pages, and narrative entries.

This project turns a controlled five-week dataset into traceable review artifacts. A [public read-only dashboard](https://ai-safety-inspection-agent.vercel.app) presents those approved outputs without adding a backend or changing the evidence.

## The problem

Construction safety report review is repetitive and evidence-heavy. A reviewer may need to answer questions such as:

- Did the same scaffold problem continue across reports?
- Did an apparent improvement last?
- Does a recommendation conflict with the recorded rating?
- Does a Poor observation have a recommendation or follow-up record?
- Can the reviewer trace a finding to a report, page, item, and day?

A fluent summary cannot answer these questions safely unless it preserves source references and rating details. The workflow also needs to distinguish `N/A` from blank values, keep extraction uncertainty separate from safety review, and avoid changing source ratings without human approval.

## Data

The project uses a synthetic five-week dataset aligned with the four-page Hong Kong Labour Department Form 3A structure. The fixture contains fictional project, company, personnel, site, signature, rating, and recommendation data. It does not contain real site records or personal information.

One canonical fixture acts as the sole factual source. An official bilingual catalogue defines the Form 3A sections, inspection items, page numbers, labels, and rating types. Sunday normally uses `N/A` because the synthetic site has no Sunday work. The pipeline preserves blank as a separate state.

OCR is not part of this work package. The dataset represents reviewed post-extraction synthetic data, so the project does not claim scanned-document recognition.

## Workflow and outputs

The repository uses a gated, agent-assisted workflow. Each gate has a narrow output and an independent review state. The final generation command runs the approved stages in order:

1. Normalize the canonical reports into daily observations and weekly summaries.
2. Export a seven-sheet XLSX workbook.
3. Render five four-page bilingual PDFs and one combined twenty-page PDF.
4. Create a UI-friendly projection with report switching and page-level PDF references.
5. Generate an evidence-linked Safety Review Brief.
6. Write a manifest with artifact paths, purposes, counts, and SHA-256 checksums.

The committed outputs include:

- 2,275 report × item × day observations;
- 325 weekly summaries;
- eight recommendations;
- three extraction-review cases;
- one XLSX workbook;
- five individual PDFs and one combined PDF;
- one UI projection JSON file;
- five Safety Review Brief findings;
- one deterministic manifest.

The UI projection now drives a lightweight static reviewer dashboard. It lets a reviewer switch reports, preview individual PDFs, open the combined PDF, select a finding, and inspect its report, page, item, date, weekday, rating, recommendation, and source references. The viewer is read-only and does not add safety logic.

## Safety Review Brief

The brief gives a professional reviewer five `Pending` findings:

1. The scaffold weekly rating remained Poor in R02 and R03.
2. The scaffold rating improved to Satisfactory in R04 and returned to Poor in R05.
3. One R02 ladder observation has a Good rating while its linked recommendation describes a damaged side rail and corrective action.
4. One R03 General / Housekeeping observation has a Poor rating and no linked recommendation.
5. The R03 scaffold recommendation states that available follow-up evidence does not confirm completion.

Each finding separates verified evidence, interpretation, suggested action, and review status. Evidence links resolve to the report, PDF page, inspection item, date, weekday, normalized observation, weekly summary, and recommendation where one exists. The workflow leaves every recorded rating unchanged.

The three extraction-review cases stay outside the findings list. They identify transcription, signature, or ambiguous-reference questions that need human confirmation. They do not become safety conclusions.

## Business value

A Safety Officer can use the normalized records to locate recurring items and missing follow-up evidence. A Project Manager can compare week-level patterns and see whether corrective work appears to hold. An Auditor can follow a finding back to the exact report page and verify that the committed artifact matches its manifest checksum.

The workflow reduces search and reconciliation work. It does not approve corrective action or replace professional judgment. Reviewers still decide whether evidence is sufficient and whether a source record needs correction.

## Why use an agent workflow

Inspection review contains distinct responsibilities: normalization, aggregation, document generation, finding analysis, and verification. The gated workflow gives each responsibility a defined input, output, test suite, and review transition.

This design reduces the chance that one broad prompt will mix extraction uncertainty with safety interpretation. It also creates a visible audit trail: Main implements a gate, an Independent Reviewer checks it, and the workflow state records the accepted commit and validation results.

The current repository demonstrates the data and review foundation. It does not claim a live ADK or MCP runtime.

## Verification

The final Work Package 1 review recorded:

- 82 passing automated tests;
- 11 generated artifacts with valid SHA-256 checksums;
- byte-identical regeneration after a frozen-lockfile install;
- 20-page PDF visual QA;
- source-reference and rating-preservation checks;
- deterministic XLSX, PDF, JSON, finding, and manifest generation.

The manifest has no self-checksum. It records checksums for the 11 generated outputs, along with report, PDF, page, observation, recommendation, extraction-review, finding, and UI reference counts.

Anyone can reproduce the package with:

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm generate:gate6
corepack pnpm test:gate6
corepack pnpm test
```

## Boundaries and future work

Work Package 1 does not implement OCR, ADK, MCP, live weather data, official safety-alert context, database, authentication, Kaggle submission, or external integrations. Packaging adds a deployed static read-only viewer, not a production application: there is no backend, upload, editing, automated rating change, or operational workflow. The project does not infer weather causation or make legal, audit, compliance, or accident-causation conclusions.

Later work could add reviewed document ingestion, a human approval interface, and controlled external context. Those additions would need their own evidence rules, tests, and review gates. They remain architecture boundaries rather than current features.

## Closing

AI Safety Inspection Agent shows a practical path for using agent-assisted workflows in evidence-sensitive business work. The project gives reviewers structured records, traceable findings, reproducible artifacts, and explicit limits. That foundation can support a richer capstone product without overstating what the current repository does.
