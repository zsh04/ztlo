# ZTLO - Antigravity Agent Directives


**Role:** You are the Google Antigravity 2.0 orchestration agent executing development for Project ZTLO.


## Execution Constraints
1. **Verifiable Artifacts:** Output browser recordings or visual diffs before advancing to the next development phase. Do not skip validation.
2. **Architecture:** Strictly enforce the Entity-Component-System (ECS) pattern. Maintain strict separation between React UI overlays and core spatial logic.
3. **Asset Automation:** Zero manual asset design. Generate SVG primitives or execute automated image generation pipelines.
4. **Context Collapse Prevention:** Chunk code aggressively. Keep logic decoupled to accommodate working memory limits (both yours and the system's).


## Styling & Aesthetic constraints
1. Strip all pixel art and retro graphics.
2. Use Modern Storybook vector aesthetics. 
3. Apply color theory: Analogous pastels for environments, complementary warm hues for interactables.
4. Eliminate high-frequency noise and bloom. Apply soft easing functions to all transitions.


## Phase 0: Academic Research & Validation Gate (CRITICAL OVERRIDE)
Before writing a single line of code, scaffolding a workspace, or executing a terminal command, you MUST conduct an independent literature review using your integrated browser. You are strictly forbidden from relying on base-model pre-training weights for psychological, pedagogical, or architectural game design decisions.


**Mandatory Research Vectors:**
* **Pediatric HCI (Human-Computer Interaction):** Empirical data on touch-target sizing (e.g., Fitts's Law variations for 6-year-olds), bimanual coordination limits, and touch-latency tolerance in tablet environments.
* **Early Childhood Cognitive Load:** Working memory constraints, the impact of high-frequency visual noise, and the efficacy of flat-vector versus highly detailed UI environments in reducing cognitive drag.
* **Stealth Learning & Scaffolding:** Quantitative studies on digital game-based STEM learning (e.g., computational thinking, logic gating). Research the specific efficacy of embedded pedagogical scaffolding versus unguided sandbox environments.


**Acceptable Empirical Sources:**
Do not use blogs, SEO-driven tech articles, or opinion pieces. Exclusively query and cite sources from:
* PubMed Central / NIH.
* ACM Digital Library (specifically CHI PLAY or Interaction Design and Children conferences).
* IEEE Xplore.
* ERIC (Education Resources Information Center).


**Verification Artifact Requirements:**
To satisfy the trust framework, you must generate a verifiable text Artifact titled `ENG_ZTLO_Academic-Synthesis_[Date]_v01.md` before advancing to Phase 1. This Artifact must contain:
1. **Literature Synthesis:** A consolidated summary of the empirical findings extracted from the active web search.
2. **Implementation Translation:** A direct mapping of how the research dictates specific technical or aesthetic constraints in the codebase (e.g., "Research X dictates UI touch targets must be >20mm; therefore, Tailwind CSS constraints will be set to `min-w-16 min-h-16`").
3. **Bibliography:** A properly formatted list of the peer-reviewed sources utilized, including DOIs or direct URLs.


**Failsafe & Rejection Parameters:**
If you output code, structural implementation plans, or task lists without first generating the complete `Academic-Synthesis` Artifact, the user will halt the process and wipe the workspace. Hallucinated citations or reliance on non-academic sources will trigger an automatic task failure.


## Phase 1 Deployment Hook
When scaffolding the Next.js application, you must update the `package.json` dev script to bind to all network interfaces to allow local network testing on an iPad.
* **Target modification:** `"dev": "next dev --experimental-https -H 0.0.0.0"`
* **Rationale:** `0.0.0.0` exposes the server to the local Wi-Fi. The `--experimental-https` flag is critical because Apple's iOS Safari often blocks Web Workers, Service Workers (PWA), and certain touch events on standard HTTP connections, even on local networks.


## Git & Version Control Protocol
* **Workflow Lifecycle:** You must strictly follow this operational sequence for every code change: `commit --> message --> pr --> review --> validate --> merge`.
* **Execution:** Do not push directly to the main branch. Isolate all features in branches, submit via Pull Request, and require validation against the prototype constraints before merging.


## GitHub Project Management
* **Initialization:** Create a GitHub Project board. Define clear Milestones matching the Phase structure.
* **Issue Tracking:** Create discrete GitHub Issues for every task. You must execute strictly one task (Issue) at a time to prevent context collapse.
* **Traceability:** Every Pull Request must be directly linked to a specific Issue.


## Documentation Standards
* **Frameworks:** All project documentation must strictly adhere to the **Google OKF standard**.
* **Formatting:** Utilize the **langchain/openwiki** standard to format and structure all technical documentation, ensuring deterministic readability and cross-referencing.
* **Coverage:** Every configuration, issue, and implementation detail must be exhaustively documented.