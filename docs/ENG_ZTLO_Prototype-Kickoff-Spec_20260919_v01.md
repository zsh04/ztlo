**ENVIRONMENT & ASSUMPTIONS**
*   **Target:** Next.js (React 19) PWA.
*   **Engine:** CSS Grid + React DOM (Zero Phaser/Canvas). CSS Grid is inherently fluid and supported by ~96% of modern browsers, making it superior to `<canvas>` for this specific low-friction, touch-first prototype. React handles SVG DOM updates hyper-efficiently without external plugins.
*   **AI:** Deterministic state-machine dialogue (Zero WebLLM/GPU load).
*   **Aesthetic:** Modern Storybook / Soft Vector / CSS primitives. 


Load the following sequence into the Google Antigravity Manager View. Do not execute the next step until the agent provides a verified artifact (browser diff or screen recording).


<Sequence>
  <Step subtitle="Scaffold Next.js PWA" title="Initialize the DOM Sandbox">
    **Prompt to Agent:**
    Initialize a Next.js 15 project with Tailwind CSS and Framer Motion. Configure `next-pwa` for 100% offline support. Lock the viewport to `landscape` and disable pinch-to-zoom in the meta tags. Create a global CSS Grid layout representing a 16x9 room. Background should use a soft pastel analogous palette (e.g., `#F0F4F8` to `#D9E2EC`). Provide the build artifact.
  </Step>
  
  <Step subtitle="Zero Virtual D-Pads" title="Implement Touch-Grid Movement">
    **Prompt to Agent:**
    Build an Entity-Component-System (ECS) data structure in standard React state. Map a `Player` entity to a grid coordinate. Implement touch-to-move using an A* pathfinding algorithm across the CSS grid. When a cell is tapped, use Framer Motion to animate the `Player` SVG avatar smoothly across the grid cells to the destination. Output a browser recording of the movement.
  </Step>
  
  <Step subtitle="Frictionless vs Heavy" title="Build the STEM Physics Entities">
    **Prompt to Agent:**
    Create two new SVG entity types: `StoneBlock` and `IceBlock`. Render them in high-contrast complementary colors (e.g., warm peach/coral). 
    - `StoneBlock`: When the player moves into its grid cell, update its state by +1 cell in that direction. 
    - `IceBlock`: When bumped, recursively update its coordinate in that direction until it hits a wall or another entity. 
    Add a `PressurePlate` entity that glows when a block rests on it. Provide a recorded artifact of both block behaviors.
  </Step>
  
  <Step subtitle="State-Machine Socratic Trees" title="Deterministic Mentor AI">
    **Prompt to Agent:**
    Build a floating SVG "Light Orb" component in the corner of the UI. Hook it into the ECS state. Create a deterministic rule engine:
    1. If the player hasn't moved in 15 seconds, Orb pulses.
    2. If tapped, Orb evaluates the grid state.
    3. If a `StoneBlock` is misaligned with a `PressurePlate`, output text: "What happens if we push the heavy block one more time?"
    4. If an `IceBlock` is stuck against a wall, output: "Ice slides fast! Is there something we can put in its way to stop it earlier?"
    Render dialogue in a soft overlay modal.
  </Step>
</Sequence>


### PROTOTYPE VALIDATION GATE
Once the agent completes this sequence, deploy immediately to Zyra's iPad via local network. 


**Pass Criteria:** She engages with the tap-to-move mechanics for >5 minutes without expressing motor-control frustration.
**Fail Criteria:** She abandons it due to touch latency or logic confusion. 


If it passes, we move to V2 (Phaser + WebLLM). If it fails, we iterate the DOM logic. Zero wasted engineering bandwidth.