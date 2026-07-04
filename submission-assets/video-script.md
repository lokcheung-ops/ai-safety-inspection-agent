# 5-Minute Video Script

## Target

Kaggle AI Agents Capstone video, maximum 5 minutes.

Must cover:
- problem statement;
- why agents are appropriate;
- project architecture;
- demonstration;
- build process and tools used.

---

## 0:00–0:30 — Opening / Problem

Hi, this is my Kaggle AI Agents Capstone project: AI Safety Inspection Agent.

The project is built for the Agents for Business track. It addresses a practical HSE problem: safety inspection records are often messy, repetitive, semi-structured, and difficult to turn into reliable follow-up actions.

In real inspection review work, a useful system should not only produce a fluent summary. It should preserve evidence, distinguish important data states such as blank versus N/A, and generate recommendations only when supported by source records.

---

## 0:30–1:10 — Why Agents

This is why I built the project as an agent workflow rather than a general chatbot.

Inspection review requires multiple coordinated steps. The system needs to read semi-structured inspection records, extract observations at the report, item, and calendar-day level, preserve source references, group observations into weekly summaries, generate recommendations only where supported, and finally validate the generated artifacts.

A single open-ended prompt would be too loose for this kind of safety-related workflow. The value of the agent workflow is that each step has a clearer responsibility and a clearer boundary.

---

## 1:10–2:00 — Architecture

The architecture starts with inspection report records.

Those records go through an agent extraction workflow. The output becomes a structured observation model. The observations are then grouped into weekly summaries. Recommendations are generated through a recommendation-only output model. Finally, validation gates and artifact checks verify whether the outputs are grounded, reproducible, and reviewable.

In short:

Inspection report records
to agent extraction workflow
to structured observations
to weekly summaries
to recommendations
to validation gates
to auditable HSE review outputs.

The most important design principle is evidence preservation. This assistant is designed to support human HSE reviewers, not replace professional judgment.

---

## 2:00–3:25 — Demonstration

Here is the public GitHub repository for the project.

The README explains the problem, solution, architecture, setup commands, validation results, limitations, and future work.

The current implementation focuses on five synthetic Hong Kong Labour Department Form 3A-style inspection reports.

The validation results are the strongest part of the project.

The implementation produced 2,275 unique report × item × calendar-day observations and 325 weekly summaries.

It also preserved the distinction between N/A and blank values, reconciled rating subtotals, resolved all source references, preserved the recommendation-only model, and confirmed that committed artifacts matched in-memory regeneration byte-for-byte and by SHA-256.

This means the project is not only generating outputs. It is checking whether the outputs remain stable, grounded, and reviewable.

---

## 3:25–4:20 — Build Process / Tools

The project was developed with an agent-assisted coding workflow.

Instead of asking AI to build a large general-purpose app in one step, I used a gated implementation approach. Each work package had a narrow scope, produced artifacts, and required validation before moving forward.

The AI tools helped with implementation, review, and packaging. But the project design intentionally keeps the system controlled: no API keys, no private production credentials, synthetic data only, and no unsupported external context added into recommendations.

This reflects the main lesson from the course for me: useful agents should not only be creative. They should also be bounded, reviewable, and safe for the workflow they support.

---

## 4:20–5:00 — Conclusion / Future Work

The current version is not a full production HSE platform yet. It does not include production authentication, live document ingestion, PDF or OCR processing, or a hosted reviewer dashboard.

Future work could add PDF and scanned report ingestion, a reviewer-facing web dashboard, a human approval workflow, project folder integration, and richer trend analysis across projects and contractors.

AI Safety Inspection Agent shows how agent workflows can support real HSE review work by converting messy inspection records into structured, traceable, and validated outputs.

The main lesson is simple: in safety-related workflows, useful AI agents should preserve evidence, enforce boundaries, and make their outputs reviewable.
