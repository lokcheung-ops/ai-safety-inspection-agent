# Final Kaggle Submission Checklist

## Repository

- [ ] Confirm `origin/main` contains the approved Work Package 1 and packaging commits.
- [ ] Confirm the GitHub repository is public and opens without authentication.
- [ ] Read the public README from a signed-out browser session.
- [ ] Check every README and submission-document link.
- [ ] Open `https://ai-safety-inspection-agent.vercel.app` in a signed-out browser and test R01–R05, findings, and PDF links.
- [ ] Confirm no secrets, private data, API keys, or local absolute paths appear in tracked files.
- [ ] Confirm `git status --short` is empty.

## Reproducibility

- [ ] Use Node.js 24.14.1 and pnpm 11.7.0.
- [ ] Run `corepack pnpm install --frozen-lockfile` in a clean checkout.
- [ ] Run `corepack pnpm generate:gate6`.
- [ ] Run `corepack pnpm test:gate6` and `corepack pnpm test`.
- [ ] Confirm all 11 artifact checksums match `generated/work-package-1/manifest.json`.
- [ ] Confirm the manifest has no self-checksum.
- [ ] Open the XLSX workbook and confirm all seven sheets and frozen headers.
- [ ] Open the combined PDF and confirm 20 pages in R01 to R05 order.

## Kaggle writeup

- [ ] Copy from `docs/kaggle-submission-writeup.md` and retain the under-2,500-word limit.
- [ ] Add the public GitHub repository link.
- [ ] State that the dataset is synthetic and Form 3A-style.
- [ ] Describe the users: Safety Officer, Project Manager, and Auditor.
- [ ] Describe normalized data, workbook, PDFs, UI projection data, Safety Review Brief, and manifest.
- [ ] Include deterministic regeneration, tests, checksums, and traceability evidence.
- [ ] Describe the deployed frontend precisely as a static read-only viewer; keep OCR, ADK, MCP, weather, safety alerts, backend, database, authentication, and external integrations in future work.
- [ ] Do not claim legal conclusions, accident causation, automatic rating changes, or operational approval.
- [ ] Proofread the final Kaggle-rendered version.

## Video

- [ ] Record from `docs/kaggle-video-script.md`.
- [ ] Keep the finished video at five minutes or less.
- [ ] Show the synthetic-data notice in report footage.
- [ ] Show the dashboard report selector, PDF preview, five findings, evidence details, verification card, and boundary card.
- [ ] Show the workbook, individual and combined PDFs, manifest, and verification commands.
- [ ] Keep terminal text and JSON references readable at normal playback speed.
- [ ] Add captions and check technical terms, IDs, and numbers.
- [ ] Remove notifications, account details, tokens, and unrelated browser tabs.
- [ ] Upload the final video to the accepted hosting service.
- [ ] Test the video link in a signed-out browser session.

## Kaggle submission form

- [ ] Add the final title and Agents for Business track.
- [ ] Add the writeup, cover image, public repository link, and video link.
- [ ] Check media ordering and thumbnail crops.
- [ ] Confirm links open from the preview page.
- [ ] Review the submission against current Kaggle rules and deadline.
- [ ] Save a local copy or screenshot of the final preview.

## Boundary check

- [ ] Confirm no text claims that OCR processes the PDFs.
- [ ] Confirm no text claims a live ADK or MCP integration.
- [ ] Confirm no text claims live weather or official safety-alert context.
- [ ] Confirm the frontend is described as a static read-only demo viewer, not a production workflow.
- [ ] Confirm no text claims a backend, upload, editing, database, authentication, or external integration.
- [ ] Confirm findings remain `Pending` and ratings remain unchanged.
- [ ] Keep extraction-review cases separate from safety findings.

## Final human action

- [ ] Ask one person to review the writeup, video, links, and boundary claims.
- [ ] Submit to Kaggle manually.
- [ ] Record the submission URL and timestamp after Kaggle confirms receipt.
