# ZTLO - Task Tracker

**Version:** 2.0  
**Updated:** 2026-09-19  
**Status:** In-Progress (Phase 1 Active)  
**Standard:** Google OKF / langchain/openwiki  

---

## 🎯 Phase 1: Prototype (CSS Grid Sandbox)

- [x] **Scaffold Sandbox:** Initialize Next.js PWA with offline support, locked landscape viewport, and CSS Grid layout. *(Completed: PR #15 / PR #16)*
- [x] **Movement Mechanics (Issue #2):** Implement touch-to-move NavMesh/A* pathfinding on CSS Grid. Zero virtual D-pads. *(Completed: PR #17, Merged to main)*
- [x] **Physics Entities (Issue #3):** Build `StoneBlock` (grid-snap push), `IceBlock` (continuous slide), and `PressurePlate` (trigger). *(Completed: PR #20, Merged to main)*
- [x] **Mentor AI V1 (Issue #4):** Build deterministic state-machine "Light Orb" for Socratic hinting. *(Completed: PR #23, Merged to main)*
- [ ] **GATE - Prototype Validation (Issue #5):** Deploy to iPad. Require >5 min engagement with zero motor-control frustration before proceeding.

---

## 🗺️ Phase 2: Engine & AI Migration

- [ ] **Aesthetic Overhaul (Issue #6):** Migrate logic to Phaser 3 if prototype validates. Enforce flat vector rendering. *(Assigned Engine: Antigravity)*
- [ ] **Local LLM Integration (Issue #7):** Install `@mlc-ai/web-llm` targeting `SmolLM2-360M-Instruct-q4f16_1-MLC`. *(Assigned Engine: Antigravity)*
- [ ] **Context-Aware ECS Bridge (Issue #8):** Connect Phaser room state JSON directly to WebLLM system prompts. *(Assigned Engine: Copilot/Antigravity)*

---

## 🧩 Phase 3: Educational Systems & NPC Empathy

- [ ] **NPC Emotion Regulation & Mood Auras (Issue #9):** Calming mechanics via items; empathy mapping. *(Assigned Engine: Copilot)*
- [ ] **Optics Puzzle Reflection Mechanics (Issue #10):** Mirror reflection angle calculations. *(Assigned Engine: Antigravity)*
- [ ] **Sequential Logic Switches (Issue #11):** Boolean logic gates (AND/OR). *(Assigned Engine: Copilot)*

---

## 📦 Phase 4: Production & PWA Offline Packaging

- [ ] **PWA Service Worker Offline Caching (Issue #12):** Offline asset and model weight pre-caching. *(Assigned Engine: Copilot)*
- [ ] **iPad / Tablet Viewport Fullscreen Polish (Issue #13):** Native browser viewport address-bar locking and touch normalization. *(Assigned Engine: Copilot)*

---

## 📋 Handoff & Dispatch Telemetry

| Issue | Title | Engine | Status | Branch / PR |
| :--- | :--- | :--- | :--- | :--- |
| #1 | Scaffold responsive viewport | Antigravity | **MERGED** | PR #15 / PR #16 |
| #2 | NavMesh / A* Tap-to-Move | Antigravity | **MERGED** | PR #17 |
| #3 | Grid Physics Entities | Antigravity | **MERGED** | PR #20 |
| #4 | Socratic Light Orb FSM V1 | Antigravity | **MERGED** | PR #23 |
