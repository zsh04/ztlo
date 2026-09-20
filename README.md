# Zyra & The Light Orb (ZTLO) 🌟

[![CI Pipeline](https://github.com/zsh04/ztlo/actions/workflows/ci.yml/badge.svg)](https://github.com/zsh04/ztlo/actions/workflows/ci.yml)
[![PWA Build](https://github.com/zsh04/ztlo/actions/workflows/deploy.yml/badge.svg)](https://github.com/zsh04/ztlo/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Zyra & The Light Orb** is a stealth-educational, touch-first puzzle adventure designed for early childhood cognitive development (targeting Age 6). It fosters critical thinking, problem-solving, emotional regulation, and ethical reasoning without explicit didactic lecturing.

---

## 🎯 Core Educational Curriculum Matrix

| Discipline | In-Game Mechanic | Subconscious Learning Outcome |
| :--- | :--- | :--- |
| **STEM / Logic** | Activating switches in sequential numeric or geometric order | Pattern recognition, Boolean logic gating (AND/OR), algorithm sequencing |
| **Physics (Optics)** | Angling mirrors to bounce light beams across rooms to receptors | Spatial reasoning, trajectory prediction, reflection angles |
| **Physics (Mass & Friction)**| Pushing `StoneBlock` (grid-snap friction) vs. `IceBlock` (momentum slide) | Friction, momentum, causality, kinematic prediction |
| **Psychology** | NPC "mood auras" (Frustrated, Sad, Anxious); calming them via items | Emotion regulation, Theory of Mind, empathy mapping |
| **Sociology** | Restoring paths/bridges to connect isolated NPC camps for trade | Interdependency, community roles, cooperative solutions |
| **Philosophy & Ethics** | Choices to harvest resources completely vs. leaving regenerative seeds | Stewardship, delayed gratification, ethical environmentalism |

---

## 🕹️ Tablet & Touch-First Design Philosophy

- **Zero Virtual D-Pads:** Virtual joysticks create severe motor-control friction for young children. Navigation is powered by touch-anywhere NavMesh / A* pathfinding.
- **Immediate Visual & Audio Feedback:** Every tap creates responsive ripples, and characters navigate around obstacles automatically.
- **Micro-Dungeons (Shrines):** Self-contained 3-to-5 room puzzle shrines to maintain attention span and deliver regular dopamine milestones.

---

## 🏗️ Technical Architecture

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Framework** | Next.js 15 (React 19), TypeScript | App Router, Edge Middleware for CSP & Cross-Origin Isolation |
| **Game Engine** | Phaser 3.80 + React HUD overlay | 60fps canvas rendering, React for dialogue modals & dashboard |
| **State & Logic** | Pure ECS (`/src/ecs`) | Components, Systems (Movement, Optics, Logic), World manager |
| **AI Mentor** | WebLLM (`@mlc-ai/web-llm`) + SmolLM2-360M | Offline in-browser LLM via Web Worker; deterministic fallback |
| **Pathfinding** | A* solver (`/src/lib/pathfinding.ts`) | Dynamic collider avoidance, Fitts's Law touch targets ≥80px |
| **Audio** | Web Audio API procedural synthesis | Step, stone thud, ice chime, gate chord, night chime — zero asset files |
| **PWA / Offline** | Service Worker + CacheStorage precache | Full offline capability, landscape manifest, iPad viewport lock |
| **Curriculum API** | REST endpoints (`/api/health`, `/api/curriculum`, `/api/telemetry`) | 6-shrine pedagogical metadata, session telemetry |
| **Parent Dashboard** | `/dashboard` route with `ParentGate` | Arithmetic challenge gate, mastery progress, COPPA/FERPA zero-PII |
| **Screen-Time** | `BedtimeManager` + `TwilightOverlay` | 15-min session limit, twilight dusk transition, gentle off-ramp |

### Shrine Curriculum (7 Shrines)

| # | Shrine | Grid | Core Mechanic | Learning Outcome |
| :-- | :--- | :--- | :--- | :--- |
| 00 | Shrine of Equilibrium | 8×6 | Stone push → pressure plate | Spatial causality, discrete impulse |
| 01 | Shrine of Still Weight | 16×9 | Heavy stone across wide room | Gravitational inertia, mass |
| 02 | Shrine of Glacial Flow | 16×9 | Frictionless ice slide | Momentum conservation, friction contrast |
| 03 | Shrine of Harmony Gates | 16×9 | Dual-switch circuit (stone + ice) | Boolean AND logic, parallel constraints |
| 04 | Shrine of Empathy | 8×6 | NPC mood aura + co-breathing | Emotion regulation, Theory of Mind |
| 05 | Chamber of Reflections | 8×6 | Rotatable mirrors + light beams | Optics, reflection angles, trajectory |
| 06 | Chamber of Logic | 8×6 | Sequential switch gates + conduits | Pattern sequencing, ordered operations |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm 10+

### Installation & Local Run
```bash
# Clone the repository
git clone https://github.com/zsh04/ztlo.git
cd ztlo

# Install dependencies
npm install

# Run the development server
npm run dev

# Run linting & type checks
npm run lint
npm run typecheck

# Build for production
npm run build
```

---

## 🗺️ Project Milestones & Roadmap

All four phases are **100% complete** with 130 passing tests, 0 lint errors, and 0 type errors.

1. **Phase 1: Prototype (Completed ✅)**
   - [x] Scaffold touch-first responsive viewport (PR #15 / PR #16)
   - [x] NavMesh / A* tap-to-move pathfinding with touch ripples (PR #17)
   - [x] Grid physics entities: `StoneBlock`, `IceBlock`, `PressurePlate` (PR #20)
   - [x] Socratic Light Orb mentor V1 state machine (PR #23)
   - [x] iPad touch-friction validation gate (PR #25)
2. **Phase 2: Engine & AI Migration (Completed ✅)**
   - [x] Phaser 3 canvas engine with React HUD overlay (PR #28)
   - [x] WebLLM in-browser AI companion with SmolLM2-360M (PR #34)
   - [x] ECS-to-WebLLM prompt serializer & Socratic scaffolding (PR #38)
   - [x] Gentle undo/rewind system (PR #29)
   - [x] Pre-defined Socratic inquiry chips (PR #33)
   - [x] Native Web Speech TTS/STT (PR #33)
3. **Phase 3: Curriculum & NPC Empathy (Completed ✅)**
   - [x] NPC Emotion Regulation & Guided Co-Breathing — Shrine 04 (PR #36)
   - [x] Optics Puzzle — Light Beam Reflection & Rotatable Mirrors — Shrine 05 (PR #39)
   - [x] Sequential Logic Switch Gates & Glowing Conduits — Shrine 06 (PR #42)
4. **Phase 4: Production, PWA & Polish (Completed ✅)**
   - [x] PWA CacheStorage precache, Edge CSP, REST APIs (PR #37)
   - [x] iPad full-screen viewport lock & landscape manifest (PR #35)
   - [x] Bedtime Twilight Transition & 15-min screen-time off-ramp (PR #43)
   - [x] Parent / Educator Curriculum Mastery Dashboard (PR #44)

See [GitHub Milestones](https://github.com/zsh04/ztlo/milestones) and [Closed Issues](https://github.com/zsh04/ztlo/issues?q=is%3Aissue+is%3Aclosed) for the full audit trail.

---

## 📄 License
MIT © 2026 Zsh Malik
