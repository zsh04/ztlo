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

### Phase 1 (Current Prototype)
- **Framework:** Next.js 15 (React 19), TypeScript
- **Rendering & Layout:** CSS Grid, CSS Transform / Framer Motion, absolute positioning
- **State & Logic:** Entity-Component-System (ECS) architecture (`/src/ecs`)
- **Offline Mentor:** Deterministic Socratic state machine ("Light Orb Companion")

### Phase 2 (Target Architecture)
- **Engine Migration:** Phaser 3 + React overlay (React for HUD & dialogue modals, Phaser for 60fps canvas rendering and physics)
- **Local AI Mentor:** In-browser WebLLM (`@mlc-ai/web-llm`) running quantized local models (e.g. `SmolLM2-360M-Instruct`) completely offline on device.

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
See [GitHub Milestones](https://github.com/zsh04/ztlo/milestones) and [Issues](https://github.com/zsh04/ztlo/issues) for active roadmap tracking:
1. **Phase 1: Prototype** — Touch-first CSS Grid sandbox, ECS movement, grid physics, deterministic Socratic mentor.
2. **Phase 2: Engine & AI Migration** — Phaser 3 integration + local WebLLM companion.
3. **Phase 3: Curriculum & NPC Empathy** — Mood auras, empathy mapping, optics reflection puzzles.
4. **Phase 4: Production & PWA Packaging** — Offline asset pre-caching, full tablet optimization.

---

## 📄 License
MIT © 2026 Zsh Malik
