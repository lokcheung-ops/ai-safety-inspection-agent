# Five-Minute Video Storyboard and Script

Target duration: 4:45 to 5:00 at about 135 words per minute.

## 0:00–0:25 | Opening

**Visual**

Open the [public read-only dashboard](https://ai-safety-inspection-agent.vercel.app). Show the title, package counts, synthetic-data notice, and read-only notice.

**Narration**

Construction safety report review takes time because the evidence sits across many items, dates, pages, and recommendations. AI Safety Inspection Agent organizes that evidence into traceable review outputs. This is my Kaggle AI Agents Capstone project for the Agents for Business track.

## 0:25–1:05 | Problem and users

**Visual**

Use the report selector to switch from R01 to R03. Scroll to the embedded four-page Form 3A PDF, then point to the report period, workforce, and combined-PDF link.

**Narration**

A Safety Officer may need to find repeated Poor ratings. A Project Manager may need to check whether corrective work lasted. An Auditor may need to trace a finding back to one report page and confirm that nobody changed the source rating.

Manual review becomes repetitive across several weeks. A loose summary can miss the distinction between blank and N/A, combine extraction questions with safety findings, or lose the link to the original page. This project keeps those details visible.

## 1:05–1:45 | Data and boundaries

**Visual**

Show the repository architecture diagram, canonical fixture, and bilingual field catalogue. Return to the dashboard with “Synthetic data” and “Read-only” visible.

**Narration**

The demonstration uses five weeks of synthetic Hong Kong Labour Department Form 3A-style data. One canonical fixture supplies the factual story. A bilingual catalogue defines the official four-page structure, sections, items, page numbers, and rating types.

The data uses fictional project, company, personnel, signature, and site details. OCR is not implemented. These records represent reviewed post-extraction synthetic data, so I do not claim scanned-document recognition.

## 1:45–2:30 | Gated workflow

**Visual**

Animate the gate sequence: normalized JSON, XLSX, PDFs, UI projection, Safety Review Brief, manifest.

**Narration**

I built the project as a gated, agent-assisted workflow. Each gate has a narrow output, tests, and an independent review transition.

Gate 4A creates daily observations and weekly summaries. Gate 4B exports a seven-sheet workbook. Gate 4C renders five individual four-page PDFs and one combined twenty-page PDF. Gate 4D creates report-switching and page-reference data. Gate 5 generates the Safety Review Brief. Gate 6 regenerates the package and records checksums in the manifest.

This separation keeps normalization, presentation, finding analysis, and verification from becoming one uncontrolled step.

## 2:30–3:20 | Artifact demonstration

**Visual**

In the dashboard, switch among R01 to R05 and show the native PDF preview. Open the combined-PDF link in a new tab. Briefly show the workbook's frozen headers, then return to the dashboard.

**Narration**

The package contains 2,275 report-by-item-by-day observations and 325 weekly summaries. It preserves eight recommendations and three extraction-review cases.

The workbook gives a reviewer seven structured sheets. The PDFs preserve the bilingual, page-by-page Form 3A layout. The UI projection links five reports to their four individual pages and to the correct pages in the combined PDF. This static dashboard reads those approved artifacts directly; it does not add or edit evidence.

## 3:20–4:05 | Findings and business value

**Visual**

Select “Scaffold improvement followed by recurrence,” switch between its R03, R04, and R05 evidence tabs, and show the report, page, item, date, rating, recommendation, source string, and both PDF links. Then select the ladder inconsistency finding.

**Narration**

The Safety Review Brief contains five Pending findings. It identifies repeated Poor scaffold ratings in R02 and R03. It records improvement in R04 followed by recurrence in R05. It flags one Good ladder rating linked to a damaged-ladder recommendation, one Poor housekeeping observation without a recommendation, and one scaffold recommendation with unconfirmed follow-up evidence.

Each finding separates verified evidence, interpretation, and suggested action. A reviewer can trace the evidence to the report, page, item, day, weekly summary, recommendation, and PDF. The workflow does not change recorded ratings.

## 4:05–4:35 | Verification

**Visual**

Show the dashboard verification card, then the terminal running `corepack pnpm test`. Briefly show `manifest.json` with artifact counts and SHA-256 values.

**Narration**

The final review recorded 82 passing tests. A clean frozen-lockfile installation regenerated all artifacts byte for byte. The manifest verifies 11 artifact checksums and has no self-checksum. Reviewers also checked all 20 combined PDF pages for layout, bilingual glyphs, borders, page order, and readability.

## 4:35–5:00 | Boundaries and close

**Visual**

Show the dashboard boundary card, then the public GitHub repository and deployment URL.

**Narration**

The public dashboard is a static read-only viewer. It does not implement OCR, ADK, MCP, weather or safety-alert context, a backend, database, authentication, upload, editing, or automatic rating changes. Those remain future work and need separate validation.

The completed package gives Safety Officers, Project Managers, and Auditors a reproducible evidence base for inspection review. The public repository contains the source data, generated artifacts, tests, manifest, and handoff documentation.

## Recording checklist

- Keep the synthetic-data notice visible when showing reports.
- Start from `https://ai-safety-inspection-agent.vercel.app` and test it before recording.
- Record at 1080p or higher and keep terminal text readable.
- Use the committed files; do not edit ratings or findings for the demo.
- Show page references resolving to the correct PDF page.
- Describe the frontend only as a deployed static read-only viewer; avoid claiming OCR, live integrations, backend processing, or operational approval.
- Keep the final edit at five minutes or less.
