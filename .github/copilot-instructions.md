# GitHub Copilot & Coding Agent Directives — Zyra & The Light Orb (ZTLO)

Welcome, AI Agent. You are developing **Zyra & The Light Orb (ZTLO)**, a stealth-educational, touch-first puzzle adventure designed for early childhood cognitive development (targeting Age 6).

---

## 1. Core Architectural Mandates
1. **Strict Entity-Component-System (ECS):**
   - All spatial, movement, and puzzle logic MUST live in `/src/ecs` (`components.ts`, `entities.ts`, `systems/`, `world.ts`).
   - React components in `/src/components` are strictly for DOM rendering, HUD overlay, dialogue modals, and touch capture. NEVER embed game loops, collision math, or coordinate mutation inside React component state.
2. **Context Collapse Prevention:**
   - Keep files modular and under 250 lines. Decouple systems cleanly.
3. **PWA & Offline-First:**
   - Code must run completely offline without external network or API calls during gameplay.
4. **Local Network Testing:**
   - Dev server runs on HTTPS bound to `0.0.0.0` (`next dev --experimental-https -H 0.0.0.0`) to support physical iPad testing over Wi-Fi.

---

## 2. Pediatric HCI & Touch Constraints (Empirical Baseline)
- **Zero Virtual D-Pads:** Virtual joysticks or d-pads induce severe motor overflow and frustration for a 6-year-old child. ONLY implement direct tap-to-move pathfinding (A* algorithm) and large swipe zones.
- **Minimum Touch Target:** All interactive elements must measure $\ge 80\text{px} \times 80\text{px}$ on standard 264 ppi iPad screens (`min-w-20 min-h-20` / `w-20 h-20` with `before:-inset-2` touch gutter).
- **Target Separation:** Minimum $32\text{px}$ (`gap-8`) non-interactive gutter between targets to prevent landing centroid drift mis-taps.
- **Instant Visual Feedback:** Touchdown must trigger an instant visual ripple/acknowledgement within $\le 16.7\text{ms}$ (1 frame at 60Hz) before path calculation completes.
- **Cognitive Load Bounds:** Limit puzzle states to $\le 3$ simultaneously interactable entities and $1$ active goal.

---

## 3. Styling & Aesthetics
- **Modern Storybook Aesthetic:** Flat SVG vector graphics with rounded radii (`rx="8"`), clean soft fills.
- **Forbidden:** Pixel art, dithering textures, screen-space bloom, high-frequency visual particle clutter.
- **Palette Theory:**
  - Ambient environment: Analogous pastels (`#F0F4F8`, `#D9E2EC`).
  - Interactables & Objectives: Complementary warm accents (`#F97316`, `#FB923C`, gold `#F59E0B`).

---

## 4. Subconscious Stealth Pedagogy
Never output didactic, lecturing dialogue. Educational mechanisms must be embedded in spatial mechanics:
- **STEM / Logic:** Sequential switches, multi-plate AND/OR circuit gating.
- **Physics (Mass & Friction):** `StoneBlock` (1-tile discrete push) vs. `IceBlock` (continuous momentum slide).
- **Physics (Optics):** Rotating mirrors on grid to direct light beams to photo-receptors.
- **Psychology & EQ:** NPCs with emotional "mood auras" (Frustrated, Sad); calmed through empathy and comforting items.
- **Socratic Light Orb Companion:** The companion asks guiding inquiry questions rather than giving away solutions.

---

## 5. Git & Verification Protocol
- Operational sequence: `commit --> message --> pr --> review --> validate --> merge`.
- Never push directly to `main`. Create scoped feature branches (e.g. `feat/issue-number-description`).
- Every PR must link to a specific GitHub issue (`Closes #X`).
- **Required Verification Commands:**
  ```bash
  npm run lint       # Must pass with 0 warnings/errors
  npm run typecheck  # tsc --noEmit must pass with 0 errors
  npm run build      # Next.js production build must succeed
  ```

---

## 6. Documentation Standard
- All technical and design documentation must adhere to the **Google OKF / langchain/openwiki standard**.
- Include machine-readable YAML frontmatter with `title`, `version`, `revision_date`, `last_updated`, `status`, and `document_id`.
