# Pedagogical Curriculum & Level Progression: Shrines 1-1 to 1-5

**Document ID:** `ENG_ZTLO_Curriculum-Progression-Shrines-1-to-5_20260919_v01`  
**Status:** **ACTIVE SPECIFICATION**  
**Date:** 2026-09-19  
**Target Demographic:** Zyra (Early Childhood Learner, Age 6)  
**Standard:** SOP-WRT-001 / Google OKF Standard  

---

## 1. Pedagogical Design Framework

Early childhood cognitive development operates on concrete physical intuition rather than abstract symbolic manipulation. In *Zyra & The Light Orb (ZTLO)*, every shrine introduces exactly **one new mental model** using gameplay mechanics, verified through the Zone of Proximal Development (Vygotsky, 1978) and cognitive load minimization (Sweller, 1988).

```
   ┌────────────────────────────────────────────────────────────────────────┐
   │                       Level Progression Spine                          │
   │                                                                        │
   │  Shrine 1-1: Equilibrium        ──►  Mass, Friction, 1-Switch Circuit  │
   │  Shrine 1-2: Glacial Velocity   ──►  Continuous Momentum, Redirects    │
   │  Shrine 1-3: Concurrency        ──►  Boolean AND Gate (Dual Pressure)  │
   │  Shrine 1-4: Radiant Optics     ──►  Law of Reflection (45° Prisms)    │
   │  Shrine 1-5: Harmonic Empathy   ──►  Theory of Mind & Vagal Breathing   │
   └────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Micro-Dungeon Specifications

### Shrine 1-1: Shrine of Equilibrium (Introductory Physics & Mass)
- **Primary Concept:** Classical Mechanics (High Friction vs. Mass).
- **Core Entities:** `Zyra`, `Light Orb`, `StoneBlock`, `PressurePlate`, `ExitDoor`.
- **Mechanic:** Pushing a heavy stone block advances exactly 1 tile per impulse with immediate grid snapping due to high floor friction ($\mu \approx 0.8$).
- **Success Condition:** Push `StoneBlock` onto `PressurePlate` to de-energize the exit door barrier.
- **Corner Trap Recovery:** If pushed into a non-plate corner, Light Orb suggests 1-tap Rewind.
- **Subconscious STEM Outcome:** Cause-and-effect causality, friction, mass displacement.

---

### Shrine 1-2: Shrine of Glacial Velocity (Kinetic Momentum & Sliding)
- **Primary Concept:** Classical Mechanics (Newton's First Law / Frictionless Momentum).
- **Core Entities:** `Zyra`, `IceBlock`, `StaticPillars`, `PressurePlate`.
- **Mechanic:** Pushing an `IceBlock` sends it gliding continuously along the push vector across the slick floor until it collides with a wall or obstacle pillar.
- **Puzzle Structure:** The pressure plate is offset from the starting line. Zyra must first position a `StoneBlock` as an intermediary "bumper" to stop the `IceBlock` directly above the switch.
- **Subconscious STEM Outcome:** Momentum conservation, trajectory planning, spatial intermediate goals.

---

### Shrine 1-3: Shrine of Concurrency (Boolean Logic Circuits)
- **Primary Concept:** Computational Thinking & Boolean Logic Gating.
- **Core Entities:** Dual `PressurePlates` ($A$ and $B$), illuminated floor energy conduits, `LogicANDGateDoor`.
- **Mechanic:** Door barrier remains energized unless **both** switches are concurrently held down:
  $$\text{DoorState} = \text{Plate}_A \land \text{Plate}_B$$
- **Puzzle Structure:** One switch can be weighed down by `StoneBlock`; the second switch must be occupied by Zyra herself or an `IceBlock`. Glowing green conduits illuminate across the floor to give immediate visual feedback on circuit completion.
- **Subconscious STEM Outcome:** Concurrent state evaluation, Boolean AND logic, algorithmic sequencing.

---

### Shrine 1-4: Shrine of Radiant Optics (Geometric Reflection)
- **Primary Concept:** Physics & Geometric Optics (Angle of Incidence and Reflection).
- **Core Entities:** `LightEmitterPedestal`, `RotatablePrismMirror` ($45^\circ$), `SolarReceptorCrystal`.
- **Mechanic:** A radiant beam of light emits continuously from the pedestal. Tapping a rotatable crystal mirror rotates it in $45^\circ$ increments ($0^\circ \to 45^\circ \to 90^\circ \to 135^\circ$).
- **Physics Rule:**
  $$\theta_i = \theta_r = 45^\circ$$
- **Puzzle Structure:** The light beam must be redirected $90^\circ$ around an impassable stone column into a photosensitive receptor crystal that unseals the sanctuary gate.
- **Subconscious STEM Outcome:** Spatial geometric visualization, angle calculation, optics causality.

---

### Shrine 1-5: Grove of Harmonic Empathy (Social-Emotional Learning)
- **Primary Concept:** Theory of Mind & Physiological Self-Regulation.
- **Core Entities:** `Zyra`, `Light Orb`, `Sprout the Forest Spirit`.
- **Mechanic (Non-Combat):** Zyra encounters Sprout trembling with a jagged, prickly amber mood aura (`#F59E0B`). Touching Sprout opens an empathy modal: *"The shadows felt too loud..."*
- **Resolution Path:**
  1. Zyra offers a soothing forest wildflower found in the chamber.
  2. Zyra engages in a visual **4-second Co-Breathing Ring** ($4\text{s}$ expansion for inhale, $4\text{s}$ contraction for exhale).
  3. Sprout's emotional aura transforms into a tranquil, serene sky-blue glow (`#06B6D4`), granting a Starlight Key.
- **Subconscious Psychological Outcome:** Emotion identification, non-violent conflict resolution, vagal nerve self-soothing.

---

## 3. Pediatric Safety & Scaffolding Matrix

| Safeguard | Architectural Implementation | Pedagogical Benefit |
| :--- | :--- | :--- |
| **Zero Failure Penalties** | No health bars, game overs, or loss of progress. | Eliminates performance anxiety and cultivates growth mindset. |
| **Instantaneous Rewind** | $\ge 80\text{px}$ HUD Undo button steps back last push. | Empowers low-stakes experimentation without fear of corner deadlocks. |
| **Socratic Question Chips** | 3 pre-defined inquiry prompts on Light Orb tap. | Scaffolds metacognitive reflection without spoiling solutions. |
| **Session Bedtime Off-Ramp** | Automatic transition to starry twilight at $15\text{ min}$. | Eliminates digital tantrums and supports family screen-time boundaries. |
