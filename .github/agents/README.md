---
title: "ZTLO Agent Directory Convention"
version: "1.0.0"
revision_date: "2026-09-19"
last_updated: "2026-09-19"
status: "Active"
document_id: "WIKI_ZTLO_AgentDirectory_20260919_v01"
---

# ZTLO Agent Directory Convention

All custom agents live in `.github/agents/` and follow a shared file pattern:

- one agent per file
- file naming pattern: `<role>.agent.md`
- frontmatter with `name`, `description`, and `argument-hint`
- one clear mission statement and a short rule set
- a consistent tone focused on project constraints, not generic assistant behavior

## Standard Layout
Each agent file should include:
1. Frontmatter metadata
2. A short role title
3. A mission statement
4. Core rules or decision checks
5. Quality bar or verification notes

## Current Agents
- `antigravity.agent.md` — systems architecture and ECS safety
- `curriculum-mentor.agent.md` — stealth learning and Socratic puzzle design
- `pediatric-hci-reviewer.agent.md` — touch ergonomics and childhood-friendly UX
- `gameplay-systems.agent.md` — movement, state logic, and core interaction systems
- `puzzle-pacing.agent.md` — rhythm, progression, and room sequencing
- `qa-level-designer.agent.md` — gameplay validation, difficulty tuning, and level quality review

## Future Guidance
When adding a new custom agent:
- keep the role specialized and narrow
- use the same markdown structure as the existing files
- align with ZTLO constraints: ECS separation, touch-first play, offline-first, and child-safe interactions
- avoid overlapping responsibilities with another agent unless the difference is explicit and necessary
