**PRE-MORTEM & FAILURE VECTORS (BRANCH 3 GATE) - V2 UPDATE**
Assume this project fails completely within 14 days. 
*   **Vector 4 (Thermal/Battery Drain):** Local AI inference on an iPad throttles the GPU, dropping game framerates and draining battery. *Mitigation:* Cap LLM generation to 15 tokens/sec and use aggressively quantized small models (q4f16).
*   **Vector 5 (Overstimulation):** Modern graphics often rely on high-frequency noise and bloom, overwhelming a 6-year-old. *Mitigation:* Enforce strict flat-vector rendering, low-contrast pastel palettes, and minimal particle effects.


**ENVIRONMENT & ASSUMPTIONS - V2 UPDATE**
*   **Target Engine:** Phaser 3 + React (PWA).
*   **Aesthetic:** Modern Storybook / Soft Vector (Zero pixel art).
*   **AI Architecture:** 100% Offline via WebGPU / WebLLM.


---


### I. LOCALIZED AI COMPANION (100% OFFLINE)


Zyra requires an embedded companion capable of contextual hints and Socratic questioning without risking internet exposure. 


| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Inference Engine** | **WebLLM via WebGPU** | Runs entirely in the browser using the iPad's native GPU capabilities. Zero server, zero API costs, 100% private, and functional without Wi-Fi. |
| **Language Model** | **SmolLM2 (135M / 360M) or Qwen2.5-0.5B** | Designed specifically for on-device applications. The q4f16 quantized versions require minimal VRAM and load directly into the browser's IndexedDB. |
| **System Prompt** | **Socratic Scaffolding** | *"You are a gentle mentor. When the user is stuck, do not give the answer. Ask a simple question about the objects in the room."* |
| **State Sync** | **ECS Bridge** | The React UI passes the current Phaser room state (objects present, player coordinates) as hidden system context before appending Zyra's prompt. |


*Execution Flow:* The PWA downloads the model weights (~400MB) upon initial installation over Wi-Fi. Subsequent launches read from local cache. The companion manifests visually as a softly glowing geometric shape (e.g., a "light orb") that pulses smoothly when processing.


---


### II. VISUAL AESTHETIC PIVOT


Scrap the retro pixel art. We shift to a "Modern Storybook" visual language grounded in color theory to manage cognitive load and direct attention subconsciously.


*   **Geometry:** Soft, rounded corners (vector-based SVG assets instead of PNG sprites). Flat 2D or soft isometric perspective.
*   **Color Theory Implementation:**
    *   **Backgrounds/Environment:** Monochromatic or analogous pastel tones (e.g., soft sage greens, muted lavenders) to reduce visual noise.
    *   **Interactables/Objectives:** High-value complementary colors (e.g., warm peach/coral against cool backgrounds) so the eye is naturally drawn to the objective without needing UI arrows or flashing indicators.
    *   **Character:** Neutral tones to avoid clashing with interactables, accented by a bright, consistent primary color to track movement.


---


### III. ANTIGRAVITY 2.0 EXECUTION PROTOCOL (PHASES 5 & 6)


Add these blocks to the Antigravity Manager View to overwrite the Phase 1 visual constraints and implement the offline AI.


#### Phase 5: Aesthetic Overhaul (Agent-Driven)
**Prompt to Agent:**
> Refactor the Phaser rendering pipeline. Strip all pixel art assets. Implement a flat vector aesthetic using primitive shapes and SVG path drawing for environments. Use an analogous pastel color palette for the background grid and complementary warm tones for interactable blocks. Implement a soft easing function (Anime.js or native Phaser tweens) for all movement transitions to remove rigid grid snapping. Generate a visual browser artifact.


#### Phase 6: WebLLM Integration (Agent-Assisted)
**Prompt to Agent:**
> Install the `@mlc-ai/web-llm` package in the React layer. Implement a local inference module targeting the `SmolLM2-360M-Instruct-q4f16_1-MLC` model. Create a UI overlay for the "Mentor Companion" that accepts text/voice-to-text input. Write an initialization hook that caches the model to IndexedDB on first load and displays a loading progress bar. Ensure the chat module functions fully while the browser network tab is set to 'Offline'. Output the connection code and system prompt logic for review.