# AI Safety Inspection Agent

## Overview

AI Safety Inspection Agent is my Kaggle AI Agents Capstone project for the Agents for Business track.

The project addresses a practical HSE problem: safety inspection records are often messy, repetitive, semi-structured, and difficult to turn into reliable follow-up actions. In real inspection review work, a useful system should not merely summarize text fluently. It should preserve evidence, distinguish important data states such as blank versus N/A, generate recommendations only when supported by source records, and provide validation checks that make the outputs reviewable.

This project is therefore intentionally not a general chatbot. It is a controlled agent workflow for converting safety inspection report records into traceable daily observations, weekly summaries, and source-supported recommendations.

## Problem

Safety inspection reports can contain repeated observations, inconsistent wording, scattered recommendations, blank fields, and N/A values. When these records are reviewed manually, it can be difficult to answer basic but important questions:

- What exactly was observed?
- Which inspection item did it belong to?
- When did the issue appear?
- Did the same issue recur across multiple days or reports?
- Which recommendations are actually supported by source evidence?
- Can the generated summary be audited and reproduced?

In HSE work, these questions matter because inspection review is not only about communication. It is also about accountability, follow-up, and evidence handling. A fluent AI summary that cannot be traced back to source records is not enough.

## Why Agents

This task is a good fit for an agentic workflow because it requires multiple coordinated steps rather than one open-ended prompt.

The workflow needs to:

1. Read semi-structured inspection report records.
2. Extract observations at the report × item × calendar-day level.
3. Preserve source references.
4. Group observations into weekly summaries.
5. Generate recommendations only when supported by source evidence.
6. Validate the output artifacts against deterministic checks.

Agents are useful here because the task benefits from separation of responsibilities. Extraction, summarization, recommendation generation, and validation are different concerns. Treating them as a controlled workflow makes the system easier to reason about and safer than asking a single chatbot to produce a final answer in one step.

The core principle is evidence preservation. The agent workflow should support human reviewers by organizing inspection information, not replace professional judgment.

## Solution Architecture

The architecture can be summarized as:

Inspection report records  
→ Agent extraction workflow  
→ Structured observation model  
→ Weekly summary generation  
→ Recommendation-only output model  
→ Validation gates and artifact checks  
→ Auditable HSE review outputs

The current implementation focuses on the deterministic data foundation and validation workflow for five synthetic Hong Kong Labour Department Form 3A-style inspection reports.

The system produces:

- unique report × item × calendar-day observations;
- weekly summary records;
- recommendation-only outputs;
- source references;
- validation artifacts.

The design uses validation gates to make sure the generated outputs remain grounded, reproducible, and consistent with the canonical fixture. This is important because a safety-related workflow should not reward unsupported creativity. It should reward traceability and reviewability.

## Course Concepts Demonstrated

This capstone demonstrates several concepts from the AI Agents Intensive course.

### Agent / Multi-step Agent Workflow

The inspection review task is broken into extraction, summarization, recommendation, and validation responsibilities. This creates a clearer system boundary than a single general-purpose prompt.

### Agent Skills / AI-assisted Development Workflow

The project was developed through an agent-assisted coding workflow. Instead of only using AI to generate code, I used a gated implementation approach: define a narrow work package, implement it, review generated artifacts, and verify that the outputs can be regenerated consistently.

### Security and Controlled Boundaries

The repository avoids storing API keys, passwords, or private production credentials. The current data foundation uses synthetic inspection report data. The generated recommendation model is intentionally limited to source-supported outputs, and unsupported external context is excluded.

### Deployability and Reproducibility

The public repository includes runtime requirements, setup commands, test commands, validation notes, and documentation so that the project can be reviewed from GitHub.

## Validation Results

The implementation was reviewed with the following validation results:

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
- No review findings remained.
- Working tree was clean after validation.

These checks are the most important part of the project. In a safety workflow, the value of an AI agent is not only whether it can produce natural language. The value is whether the output can be trusted, checked, and reviewed.

## Development Journey

My development journey focused on reducing risk and keeping the project narrow enough to validate properly.

The first major decision was to avoid building a broad chatbot or a large unfinished platform. Instead, I focused on one practical HSE workflow: turning inspection records into structured, auditable outputs.

The second decision was to use a gate-based process. Each stage had to produce artifacts that could be checked. This helped keep the project grounded. The goal was not to make the system sound impressive, but to make the outputs stable and reviewable.

The third decision was to preserve important distinctions in the source records. For example, blank and N/A values should not be treated as the same thing. Source references should resolve. Recommendations should come from the canonical fixture. Regenerated artifacts should match committed artifacts.

This made the project more like a controlled inspection-review assistant than a generic AI demo.

## Limitations

The current implementation is not a full production HSE platform. It does not yet include production authentication, production database integration, live document ingestion from external systems, full PDF/OCR processing, or a hosted reviewer-facing dashboard.

These are planned future extensions rather than current claims.

## Future Work

Future extensions could include:

- PDF and scanned inspection report ingestion;
- reviewer-facing web dashboard;
- human approval workflow for recommendations;
- deployment as an internal HSE assistant;
- integration with project folders and document management systems;
- richer trend analysis across projects, contractors, and inspection categories.

## Conclusion

AI Safety Inspection Agent demonstrates how agent workflows can support real HSE review work by converting messy inspection records into structured, traceable, and validated outputs.

The main lesson from this project is that useful AI agents should not only generate text. In safety-related workflows, they should preserve evidence, enforce boundaries, and make their outputs reviewable.
