# Zyra & The Light Orb (ZTLO) 🌟

[![CI Pipeline](https://github.com/zsh04/ztlo/actions/workflows/ci.yml/badge.svg)](https://github.com/zsh04/ztlo/actions/workflows/ci.yml)
[![PWA Build](https://github.com/zsh04/ztlo/actions/workflows/deploy.yml/badge.svg)](https://github.com/zsh04/ztlo/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Zyra and The Light Orb is a touch-first educational puzzle adventure for children aged six. The game nurtures problem solving, spatial reasoning, emotional regulation, and ethical reflection without lectures or scores.

---

## 🎯 Educational Curriculum Matrix

| Discipline | In-Game Mechanic | Subconscious Learning Outcome |
| :--- | :--- | :--- |
| **STEM / Logic** | Activating switches in sequential numeric or geometric order | Pattern recognition, Boolean logic gating (AND/OR), algorithm sequencing |
| **Physics (Optics)** | Angling mirrors to bounce light beams across rooms to receptors | Spatial reasoning, trajectory prediction, reflection angles |
| **Physics (Mass & Friction)** | Pushing stone blocks (friction snap) versus ice blocks (momentum slide) | Friction, momentum, causality, kinematic prediction |
| **Psychology** | Non-Player Character (NPC) mood auras; calming them via items and breathing | Emotion regulation, Theory of Mind, empathy mapping |
| **Sociology** | Restoring paths and bridges to connect isolated NPC camps | Interdependency, community roles, cooperative solutions |
| **Philosophy & Ethics** | Harvesting resources completely versus leaving regenerative seeds | Environmental stewardship, delayed gratification, ethical choices |

---

## 🕹️ Tablet & Touch-First Design Philosophy

- **Zero Virtual Directional Pads (D-Pads):** Virtual joysticks create severe motor friction for young hands. Movement relies exclusively on tap-to-move pathfinding.
- **Immediate Visual & Audio Feedback:** Every touch emits glowing ripples, and the avatar routes around obstacles automatically.
- **Micro-Dungeons (Shrines):** Self-contained chambers deliver clear milestones within short attention spans.
- **Storybook Visual Atmosphere:** Hand-painted temple sanctuaries feature volumetric golden sunbeams, floating motes, and soft drop shadows.

---

## 🏗️ Technical Architecture

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Framework** | Next.js 15 (React 19), TypeScript | App Router with Edge Middleware for Content Security Policy (CSP) and Cross-Origin Isolation |
| **Game Engine** | Phaser 3.80 + React Head-Up Display (HUD) | 60fps WebGL canvas with non-blocking parchment dialogue bubbles |
| **State & Logic** | Pure Entity Component System (ECS) | Decoupled entities, components, and systems in `/src/ecs` |
| **AI Companion** | WebLLM (`@mlc-ai/web-llm`) + SmolLM2-360M | In-browser model executed via Web Worker with deterministic Socratic fallback |
| **Pathfinding** | A* search algorithm (`/src/lib/pathfinding.ts`) | Dynamic obstacle avoidance with touch targets meeting the 80px minimum |
| **Audio** | Procedural Web Audio API synthesis | Step, stone thud, ice chime, gate chord, and night chimes without static audio files |
| **Offline Storage** | Progressive Web App (PWA) Service Worker | Offline asset precaching, landscape viewport locking, and touch normalization |
| **Health UX** | Bedtime Manager (`BedtimeManager.ts`) | 15-minute gentle session limit with twilight dusk transition |
| **Parent Portal** | `/dashboard` route with arithmetic gate | Curriculum mastery tracking with zero personally identifiable information |

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

### Installation & Local Execution
```bash
# Clone repository
git clone https://github.com/zsh04/ztlo.git
cd ztlo

# Install dependencies
npm install

# Run development server
npm run dev

# Run automated tests (143/143 passing)
npm test

# Run type checks and linter
npm run typecheck
npm run lint

# Compile production build
npm run build

# Start production server
npm start
```

---

## 🗺️ Project Milestones & Roadmap

All six planned project milestones are **100% complete** with 143 passing tests, 0 lint errors, and 0 type errors.

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
   - [x] Gentle rewind system (PR #29)
   - [x] Pre-defined Socratic inquiry chips (PR #33)
   - [x] Native Web Speech Text-to-Speech (TTS) and Speech-to-Text (STT) (PR #33)

3. **Phase 3: Curriculum & NPC Empathy (Completed ✅)**
   - [x] NPC Emotion Regulation & Guided Co-Breathing — Shrine 04 (PR #36)
   - [x] Optics Puzzle — Light Beam Reflection & Rotatable Mirrors — Shrine 05 (PR #39)
   - [x] Sequential Logic Switch Gates & Glowing Conduits — Shrine 06 (PR #42)

4. **Phase 4: Production, PWA & Polish (Completed ✅)**
   - [x] PWA CacheStorage precache, Edge CSP, REST APIs (PR #37)
   - [x] iPad full-screen viewport lock & landscape manifest (PR #35)
   - [x] Bedtime Twilight Transition & 15-min screen-time off-ramp (PR #43)
   - [x] Parent / Educator Curriculum Mastery Dashboard (PR #44)

5. **Phase 5: Production Storybook Art & UX Asset Pipeline (Completed ✅)**
   - [x] 41 hand-crafted SVG vector master sprites and ambient tiles (PR #53, #54)
   - [x] Character animation suites: Zyra idle, walk, push, celebrate (PR #57)
   - [x] Light Orb dynamic facial expressions and starlight trail (PR #58)
   - [x] Dual WebP texture atlases compiled under 0.50 MB payload (PR #57)

6. **Phase 6: Storybook Visual Atmosphere Overhaul (Completed ✅)**
   - [x] Sunlit overgrown sanctuary background with volumetric golden sunbeams (Commit `3d8f734`)
   - [x] Hand-carved limestone rune block, bronze lotus dais, and cosmic portal (Commit `3d8f734`)
   - [x] Grounded soft directional drop shadows under characters and entities (Commit `3d8f734`)
   - [x] Parchment UI HUD and thought bubble styling with gold borders (Commit `3d8f734`)
   - [x] Automated Chrome DevTools Protocol (CDP) end-to-end playtest verification (Commit `3d8f734`)

---

## 📄 License
MIT © 2026 Zsh Malik
