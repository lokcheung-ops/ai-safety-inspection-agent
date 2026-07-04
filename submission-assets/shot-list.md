# Video Shot List

## Goal

Create a concise 5-minute Kaggle AI Agents Capstone walkthrough video.

The video should show:
- the problem;
- why agents are appropriate;
- architecture;
- public GitHub repository;
- validation results;
- build process and tools;
- future direction.

---

## Recording Setup

Recommended format:
- Screen recording with voiceover.
- 16:9 aspect ratio.
- Clear browser zoom, around 110% to 125%.
- Keep desktop clean.
- Use GitHub, VS Code, and terminal only.
- Avoid showing private files, API keys, tokens, browser bookmarks, or unrelated tabs.

Recommended apps:
- Screen recording: macOS Screenshot / QuickTime / OBS.
- Editing: iMovie, CapCut, Canva, or any simple editor.
- Upload: YouTube unlisted is acceptable.

---

## 0:00–0:30 — Opening / Problem

### Voiceover
Use the opening section from `video-script.md`.

### Screen
Show a title slide or GitHub README top section.

Suggested visual text:
- AI Safety Inspection Agent
- Kaggle AI Agents Capstone
- Agents for Business
- Evidence-preserving HSE review assistant

### Action
Open the GitHub repo homepage and slowly scroll the first README section.

---

## 0:30–1:10 — Why Agents

### Voiceover
Use the “Why Agents” section.

### Screen
Show the README sections:
- Problem
- Why Agents

### Action
Highlight or point to:
- report × item × calendar-day observations
- source references
- weekly summaries
- source-supported recommendations
- validation artifacts

---

## 1:10–2:00 — Architecture

### Voiceover
Use the “Architecture” section.

### Screen
Show either:
1. the architecture block in README; or
2. a simple architecture diagram if available.

Architecture:
Inspection report records
→ Agent extraction workflow
→ Structured observation model
→ Weekly summary generation
→ Recommendation-only output model
→ Validation gates and artifact checks
→ Auditable HSE review outputs

### Action
Slowly scroll the README architecture section or show `assets/architecture.png`.

---

## 2:00–3:25 — Demonstration

### Voiceover
Use the “Demonstration” section.

### Screen
Show:
1. README validation results.
2. `generated/` folder.
3. Any output artifacts that show observations, weekly summaries, or recommendations.
4. Terminal test/validation commands if useful.

### Action
Recommended sequence:
- Show README Validation Results.
- Open `generated/`.
- Open one generated artifact.
- Show `package.json` scripts or terminal commands:
  - corepack pnpm test:catalogue
  - corepack pnpm lint
  - corepack pnpm typecheck
  - corepack pnpm build
  - corepack pnpm test

### Key numbers to show
- 2,275 unique report × item × calendar-day observations
- 325 weekly summaries
- source references resolve
- committed artifacts match regeneration by SHA-256
- no unsupported external context

---

## 3:25–4:20 — Build Process / Tools

### Voiceover
Use the “Build Process / Tools” section.

### Screen
Show:
- AGENTS.md
- prompts/
- docs/
- submission-assets/
- VS Code or Antigravity workspace if safe
- Git commit history if useful

### Action
Show the project was built through gated implementation:
- Work package scope
- Reviewer checks
- Artifact regeneration
- Documentation and packaging

Mention verbally:
- Codex
- Antigravity / agent-assisted development workflow
- GitHub as source of truth

Do not show:
- API keys
- private credentials
- unrelated personal files
- old Google Drive folder

---

## 4:20–5:00 — Conclusion / Future Work

### Voiceover
Use the conclusion section.

### Screen
Show:
- README Limitations
- README Future Work
- README Project Positioning

### Action
End on the GitHub repo top or a simple final slide:
AI Safety Inspection Agent
Structured. Traceable. Reviewable.

---

## Minimum Viable Recording Plan

If time is limited, record only this:

1. GitHub README top.
2. README Why Agents.
3. README Architecture.
4. README Validation Results.
5. generated/ folder.
6. AGENTS.md or prompts/ folder.
7. README Future Work.

This is enough for a clean 5-minute submission video.

---

## Final Video Checklist

- [ ] Under 5 minutes.
- [ ] Problem clearly explained.
- [ ] Why agents clearly explained.
- [ ] Architecture shown.
- [ ] Demo shown.
- [ ] Build process/tools mentioned.
- [ ] No secrets visible.
- [ ] GitHub repo link visible.
- [ ] Audio is clear.
- [ ] Uploaded to YouTube.
- [ ] YouTube link added to README.
