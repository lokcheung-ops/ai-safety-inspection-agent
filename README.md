# AI Safety Inspection Agent

Kaggle AI Agents Capstone — Agents for Business

AI Safety Inspection Agent is a controlled agent workflow for turning semi-structured safety inspection report records into traceable daily observations, weekly summaries, and source-supported recommendations.

This project is intentionally not a general chatbot. It is designed as an evidence-preserving HSE review assistant: every generated output should remain grounded in source records, reproducible through validation, and suitable for human review.

## Problem

Safety inspection records are often messy, repetitive, and difficult to turn into reliable follow-up actions. In practical HSE work, a reviewer needs more than a fluent summary. They need to know:

- what was observed;
- when it was observed;
- which inspection item it belongs to;
- whether the same issue appeared across multiple days or reports;
- which recommendations are actually supported by the source material;
- whether generated summaries can be audited and regenerated consistently.

Manual review is slow and inconsistent, especially when records contain repeated descriptions, blank fields, N/A values, and scattered recommendations.

## Solution

This repository implements the data foundation and validation workflow for an AI Safety Inspection Agent.

The system converts inspection report records into:

- unique report × item × calendar-day observations;
- weekly summary records;
- recommendation-only outputs;
- source references;
- validation artifacts that check consistency and reproducibility.

The core design goal is trustworthiness. The agent workflow should not invent unsupported information. It should preserve source evidence, distinguish blank values from N/A values, and generate outputs that can be checked.

## Why Agents

This task is a good fit for an agentic workflow because safety inspection review requires multiple coordinated steps rather than one open-ended generation:

1. Read semi-structured inspection report records.
2. Extract observations at the report × item × calendar-day level.
3. Normalize repeated observations without losing source traceability.
4. Group extracted observations into weekly summaries.
5. Generate recommendations only when supported by source evidence.
6. Validate the generated artifacts against deterministic rules.

The project uses agents and agent-assisted development practices to support this workflow through gated implementation and review.

## Architecture

![AI Safety Inspection Agent Architecture](assets/architecture.png)

```text
Inspection report records
        ↓
Agent extraction workflow
        ↓
Structured observation model
        ↓
Weekly summary generation
        ↓
Recommendation-only output model
        ↓
Validation gates and artifact checks
        ↓
Auditable HSE review outputs
```

### Key design principles

- **Evidence first:** outputs must remain traceable to source records.
- **Recommendation boundary:** recommendations are generated only from supported source material.
- **Deterministic validation:** generated artifacts must reconcile and regenerate consistently.
- **Human review:** the system is designed to assist HSE reviewers, not replace professional judgment.
- **No hidden context:** external unsupported context is not added to the generated outputs.

## Course Concepts Demonstrated

The capstone demonstrates the following AI Agents Intensive course concepts:

### Agent / multi-step agent workflow

The inspection review task is broken into extraction, summarization, recommendation, and validation responsibilities. This gives the system clearer boundaries than a single general-purpose prompt.

### Agent skills / AI-assisted development workflow

The project was developed through an agent-assisted coding workflow with implementation gates, reviewer checks, and artifact regeneration. The build process is part of the final demonstration.

### Security and controlled boundaries

The repository avoids storing API keys, passwords, or private production credentials. The generated recommendation model is intentionally limited to supported source-derived outputs.

### Deployability and reproducibility

The repository includes setup commands, runtime requirements, tests, and validation steps so that the project can be reviewed and reproduced from the public repository.

## Current Scope

The current implementation focuses on the deterministic data foundation and validation workflow for five synthetic Hong Kong Labour Department Form 3A-style inspection reports.

Included:

- report/item/day observation extraction;
- weekly summary generation;
- recommendation-only output validation;
- source-reference checks;
- artifact regeneration checks;
- unit, lint, typecheck, build, and test commands.

Not included in the current implementation:

- production authentication;
- production database integration;
- live document ingestion from external systems;
- full reviewer-facing frontend;
- deployment to a hosted HSE system.

These are planned future extensions rather than current claims.

## Validation Results

The Gate 4A reviewer validated the implementation with the following results:

- 2,275 unique report × item × calendar-day observations.
- 325 weekly summaries.
- Rating subtotals reconcile.
- N/A and blank values remain distinct.
- R02 scaffold is 3P/3S and resolves to P.
- Scaffold sequence is S, P, P, S, P.
- All source references resolve.
- Recommendations and three extraction cases derive exactly from the canonical fixture.
- Committed artifacts match in-memory regeneration byte-for-byte and by SHA-256.
- Recommendation-only model is preserved.
- No prohibited fields or unsupported external context were added.
- No Gate 4B or later artifacts were introduced.
- No review findings remained.
- Working tree was clean after validation.

These checks are important because the project is designed for safety-related review work, where reliable evidence handling matters more than fluent but unverifiable summaries.

## Runtime Requirements

- Node.js 24.14.1
- Corepack with pnpm 11.7.0

## Setup

```bash
corepack enable
corepack pnpm install --frozen-lockfile
```

## Useful Commands

```bash
corepack pnpm test:catalogue
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test
```

## Suggested Review Flow

For a reviewer or judge, the recommended review path is:

1. Read this README.
2. Inspect the architecture and validation sections.
3. Run the setup commands.
4. Run the validation/test commands.
5. Review the generated artifacts and source-reference checks.
6. Watch the 5-minute capstone video for the end-to-end explanation.

## Security Notes

- Do not commit API keys, credentials, or private production data.
- The current data foundation uses synthetic inspection report data.
- External unsupported context is intentionally excluded from generated recommendations.
- Human review remains required before using any output for operational HSE decisions.

## Limitations

This version proves the controlled inspection-review workflow, but it is not yet a full production HSE platform. The current scope does not include live PDF/OCR ingestion, authentication, role-based access control, or a hosted reviewer dashboard.

## Future Work

Potential future extensions include:

- PDF and scanned inspection report ingestion;
- reviewer-facing web dashboard;
- human approval workflow for recommendations;
- deployment as an internal HSE assistant;
- integration with project folders and document management systems;
- richer trend analysis across projects, contractors, and inspection categories.

## Project Positioning

AI Safety Inspection Agent is a practical Agents for Business capstone. It shows how agent workflows can support real HSE review work by converting messy inspection records into structured, traceable, and validated outputs.

The main lesson is that useful AI agents should not only generate text. In safety-related workflows, they should preserve evidence, enforce boundaries, and make their outputs reviewable.

## Demo Video

A 5-minute Kaggle capstone walkthrough will cover:

- the HSE inspection review problem;
- why an agent workflow is appropriate;
- the project architecture;
- validation results;
- the AI-assisted build process.

YouTube link: coming soon.
