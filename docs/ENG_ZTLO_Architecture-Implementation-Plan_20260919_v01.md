**PRE-MORTEM & FAILURE VECTORS (BRANCH 3 GATE)**
Assume this project fails completely within 14 days. 
*   **Vector 1 (UX Friction):** Virtual D-pads on tablets cause severe frustration for a 6-year-old's motor skills, leading to immediate abandonment. *Mitigation:* Implement NavMesh tap-to-move pathfinding and large swipe zones.
*   **Vector 2 (Scope Creep):** Attempting an interconnected open-world map violates the "micro-advancement" protocol, triggering burnout. *Mitigation:* Limit scope to disconnected, 3-to-5 room micro-dungeons (Shrines). 
*   **Vector 3 (Agent Context Collapse):** Feeding Google Antigravity monolithic game loops causes Gemini to hallucinate state changes. *Mitigation:* Enforce a strict Entity-Component-System (ECS) architecture.


**ENVIRONMENT & ASSUMPTIONS**
*   **User:** Zyra (Age 6). Cognitive sponge; limited frustration tolerance.
*   **Hardware:** iPad/Tablet via Web App (PWA). Touch-first interactions.
*   **Dev Pipeline:** Google Antigravity 2.0 (Manager View, asynchronous agent orchestration). 
*   **Pacing:** Incremental daily micro-advancements. Zero manual asset design.


---


### I. ENGINE TEARDOWN & SELECTION


| Engine | Viability | Friction Points | Verdict |
| :--- | :--- | :--- | :--- |
| **Solarus** | High (Native Zelda Clone) | C++/Lua base. Hard to wrap in modern responsive web/PWA structures. | **Reject** |
| **Godot 4.3** | High (Web Export) | Agents corrupt binary/text `.tscn` scene files during async generation. | **Reject** |
| **React + Phaser 3 + TS** | Maximum | 100% text-based (Agent friendly). Native PWA touch capabilities. ECS pattern ready. | **Execute** |


---


### II. SUBCONSCIOUS CURRICULUM MATRIX


Map educational vectors directly to core Zelda-style mechanics to ensure stealth learning. 


| Discipline | In-Game Mechanic | Subconscious Learning Outcome (Age 6) |
| :--- | :--- | :--- |
| **STEM / Logic** | Activating switches in sequential numeric or geometric order to open doors. | Pattern recognition, Boolean logic gating (AND/OR), sequencing. |
| **Physics (Optics)** | Angling mirrors to bounce a light beam across a room to a receptor. | Spatial reasoning, trajectory prediction, reflection angles. |
| **Physics (Mass)** | Pushing stone blocks (slow, stops instantly) vs. Ice blocks (slides until collision). | Friction, momentum, cause-and-effect causality. |
| **Psychology** | NPCs display "mood auras." Player cannot fight them; must find specific items to calm them. | Emotion regulation, Theory of Mind, empathy mapping. |
| **Sociology** | Repairing a broken bridge to connect two isolated NPC camps to enable item trading. | Resource interdependency, community roles, cooperation. |
| **Philosophy** | Choices on whether to harvest all resources in an area or leave some to regenerate. | Stewardship, delayed gratification, ethical environmentalism. |


---


### III. VISUAL & UI ARCHITECTURE


To minimize cognitive load and leverage Antigravity's UI generation, adhere to these constraints:


*   **Viewpoint:** Top-down 2.5D pixel art. High contrast for readability.
*   **Grid System:** 32x32 pixel tilemap basis. 
*   **Controls:** Touch-anywhere pathfinding. The agent calculates the route to avoid obstacles.


*   **UI Layer:** React handles the HUD, inventory menus, and dialogue overlays on top of the HTML5 Canvas. Phaser handles purely rendering and physics.


---


### IV. ANTIGRAVITY 2.0 EXECUTION PROTOCOL


Load these sequential prompt blocks into the Antigravity Manager View. Do not proceed to the next phase until the Agent generates verifiable Artifacts (browser recordings/diffs).


#### Phase 1: Core Scaffolding (Agent-Driven Development)
**Prompt to Agent:**
> Initialize a Next.js (TypeScript) PWA project. Install `phaser` and `@phaserjs/react`. Scaffold the folder structure for an Entity-Component-System (ECS) pattern. Create a responsive React overlay UI that sits above a 100vw/100vh Phaser canvas. Configure the canvas to maintain a 16:9 aspect ratio, scaling dynamically to fit iPad screens. Generate a dummy 32x32 grid tilemap. Output the architecture plan as an Artifact before executing code.


#### Phase 2: Input & Pathfinding (Review-Driven Development)
**Prompt to Agent:**
> Implement touch-based movement using a NavMesh or A* pathfinding algorithm on the tilemap grid. The player character should automatically navigate around static colliders when the user taps a destination coordinate. Do not use a virtual D-pad. Expose the touch coordinates to the React UI layer for visual feedback (a temporary "ping" animation where tapped). Provide a browser recording Artifact of the movement.


#### Phase 3: Physics & Puzzle Mechanics (Agent-Assisted Development)
**Prompt to Agent:**
> Create two block entities: `StoneBlock` and `IceBlock`. Implement grid-based pushing physics. `StoneBlock` moves one tile per push. `IceBlock` slides continuously until it hits a collider. Implement a `TriggerPlate` component that fires an event when a block rests on it. Log the trigger events to a React state to update the UI.


#### Phase 4: NPC Psychology System
**Prompt to Agent:**
> Implement an NPC class with a state machine tracking 'Emotional State' (e.g., Frustrated, Sad, Happy). Map these states to a visual particle aura above the NPC. Create an interaction radius that opens a React dialogue modal when tapped. The modal must accept an item from the player's inventory that changes the NPC state to Happy, triggering an environment unlock.


---


### V. ASSET AUTOMATION PIPELINE


Zero manual asset creation. Use the following automated pipeline to generate sprites and tilesets:
1.  **Generation:** Trigger an image generation API (e.g., Midjourney/DALL-E 3) via a simple Python script using prompts like: `Top-down 2D 32-bit pixel art sprite sheet, [Object/Character], transparent background, Zelda style`.
2.  **Processing:** Use a script with ImageMagick to snap assets to 32x32 grid structures and remove backgrounds automatically.
3.  **Ingestion:** Save directly into the `/public/assets` directory of the Antigravity workspace. The agent will dynamically map them into the Phaser preload manifest.