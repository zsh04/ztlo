# ZTLO - Task Tracker


## Phase 1: Prototype (Path 3 Minimization)
- [ ] **Scaffold Sandbox:** Initialize Next.js PWA with offline support, locked landscape viewport, and CSS Grid layout.
- [ ] **Movement Mechanics:** Implement touch-to-move NavMesh/A* pathfinding on CSS Grid. Zero virtual D-pads.
- [ ] **Physics Entities:** Build `StoneBlock` (grid-snap push), `IceBlock` (continuous slide), and `PressurePlate` (trigger).
- [ ] **Mentor AI (V1):** Build deterministic state-machine "Light Orb" for hardcoded Socratic hinting.
- [ ] **GATE - Prototype Validation:** Deploy to iPad. Require >5 min engagement with zero motor-control frustration before proceeding.


## Phase 2: Engine & AI Migration
- [ ] **Aesthetic Overhaul:** Migrate logic to Phaser 3 if prototype validates. Enforce flat vector rendering.
- [ ] **Local LLM Integration:** Install `@mlc-ai/web-llm` targeting `SmolLM2-360M-Instruct-q4f16_1-MLC`.
- [ ] **Context-Aware ECS Bridge:** Connect Phaser room state JSON directly to WebLLM system prompts invisibly.
- [ ] **Offline Deployment:** Finalize PWA Service Worker caching for weights and assets.