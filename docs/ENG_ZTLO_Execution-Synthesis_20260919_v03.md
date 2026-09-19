### IV. ANTIGRAVITY 2.0 EXECUTION PROTOCOL (PHASES 7 & 8)


To finalize the development loop, the local AI must be connected to the game's physical reality, and the application must be packaged for native iPad execution.


#### Phase 7: Context-Aware ECS Bridge (Agent-Assisted)
**Prompt to Agent:**
> Create a serialization bridge between the Phaser ECS and the React UI layer. Every 500ms, output a read-only JSON payload containing the current room state: Player coordinates, active interactables (switches, blocks, coordinates), and NPC emotional states. When the WebLLM module triggers an inference call, inject this JSON payload invisibly into the system prompt so the Mentor Companion has precise spatial awareness of the puzzle the player is failing to solve.


#### Phase 8: PWA Deployment & Service Worker (Agent-Driven)
**Prompt to Agent:**
> Configure `next-pwa` for the Next.js application. Generate a `manifest.json` locking the orientation to landscape. Register all static vector assets, React chunks, and the WebLLM model weights into the service worker cache. Ensure the application passes Lighthouse PWA audits for 100% offline capability. Provide the command to build and serve the production artifact.


---


### V. SYNTHESIS & PATHWAY ROUTING (MASTER ENGINE P2)


Evaluating the architectural plan against current operational bandwidth and the goal of minimizing cognitive drag.


| Path | Strategy | Upstream Effects | Downstream Effects |
| :--- | :--- | :--- | :--- |
| **Path 1: Consensus** | Execute the full React + Phaser + WebLLM stack as scoped. | High initial prompting friction. High risk of Antigravity context collapse during Phase 7. | Highly scalable. Genuine AI interaction. Best alignment with original curriculum goals. |
| **Path 2: Contrarian** | Scrap WebLLM. Use deterministic state-machine dialogue trees for the Mentor. | Eliminates Phase 6 and 7 entirely. Reduces iPad thermal/battery load by ~80%. | Zero hallucination risk. Socratic questions are hardcoded, limiting replayability but guaranteeing educational accuracy. |
| **Path 3: Minimization** | Scrap Phaser 3. Build the entire game purely in React DOM using absolute positioning, CSS grids, and React Spring for physics. | Antigravity agents write DOM/CSS 10x more reliably than canvas-based Phaser code. Massive velocity increase. | Complex collisions (e.g., sliding ice blocks) become mathematically annoying to calculate without a native physics engine. |


**Final Recommendation:**
Execute **Path 3 (Minimization) + Path 2 (Contrarian) Hybrid** for the Prototype (v0.1). 


To protect your bandwidth prior to your upcoming start date, do not build the WebLLM integration or the Phaser canvas yet. Build a 3-room React-DOM-only prototype with hardcoded text-based Mentor hints. 


Deploy this to Zyra's iPad immediately. If she abandons the game after 5 minutes because touch-to-move pathfinding still frustrates her, you have successfully falsified the UX assumption without spending 40 hours debugging WebGPU memory leaks. If she engages, you have the green light to incrementally migrate to Phaser (Phase 1) and inject WebLLM (Phase 6).