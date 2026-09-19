---
title: "Operational & Academic Constraints"
version: "1.0.0"
revision_date: "2026-09-19"
last_updated: "2026-09-19"
status: "Active"
standard: "Google OKF / langchain/openwiki"
document_id: "WIKI_ZTLO_Constraints_20260919_v01"
---

# Operational & Academic Constraints

**Document ID:** `WIKI_ZTLO_Constraints_20260919_v01`  
**Version:** `1.0.0`  
**Revision Date:** `2026-09-19`  
**Last Updated:** `2026-09-19`  
**Status:** Active  
**Standard:** Google OKF / langchain/openwiki Standard  
**Cross-References:** [[Home]], [[Architecture]], [[Curriculum]], [[Directives]]  

---

## 1. Operational & Architectural Directives

1. **No-Fluff Policy:** Zero pleasantries or conversational preambles. Direct, senior-architect-level technical communication. First-principles systems engineering.
2. **Burnout Protocol:** Radical scope minimization on low bandwidth. Strict micro-advancement pacing (discrete 3–5 room shrines).
3. **Deterministic File Naming:** `[Context]_[Entity]_[Summary-Details]_[Date]_[Status-or-Version].[ext]` (e.g., `ENG_ZTLO_Academic-Synthesis_20260919_v01.md`).

---

## 2. Phase 0 Empirical Hardware & HCI Constraints

Extracted from peer-reviewed academic literature (ACM CHI/IDC, PubMed Central, ERIC) to eliminate developmental guesswork:

| Parameter | Empirical Evidence | Codebase Rule | Tailwind / CSS Constraint |
| :--- | :--- | :--- | :--- |
| **Touch Target Size** | Vatavu et al. (2015), Soni et al. (2019): Target miss rate is $16.7\%-25\%$ at $9\text{ mm}$, stabilizing at $\ge 20\text{ mm} \times 20\text{ mm}$. | Interactables must measure $\ge 80\text{px} \times 80\text{px}$ on standard 264 ppi iPad screens. | `min-w-[80px] min-h-[80px]` (or `w-20 h-20`) with expanded touch padding (`before:-inset-2`). |
| **Target Separation** | Anthony et al. (2012): Landing centroid drift averages $3.2-4.8\text{ mm}$, inducing accidental adjacent touches. | Minimum $8\text{ mm}$ ($32\text{px}$) non-interactive gutter between targets. | CSS Grid: `gap-8` ($32\text{px}$) minimum separation. |
| **Control Scheme** | Fagard et al. (2016): Virtual D-pads induce contralateral motor overflow and spatial disorientation in 6-year-olds. | Complete prohibition of virtual joysticks and D-pads. Mandatory unimanual tap-to-move pathfinding. | Pointer event listening on grid cells; A* pathing dispatches single unimanual goals. |
| **Feedback Latency** | Jota et al. (2013): Latency $>50\text{ ms}$ degrades pointing throughput; $>100\text{ ms}$ causes repeated mis-taps. | Visual tap acknowledgement must render $\le 16.7\text{ ms}$ (1 frame at 60Hz). | Instantaneous CSS / SVG ripple animation triggered on touchdown before path calculation completes. |
| **Cognitive Load** | Cowan et al. (2015), Gathercole et al. (2004): 6-year-old working memory is bounded by $2\text{ to }3$ discrete chunks. | Rooms limited to 1 active puzzle goal and $\le 3$ interactable entities. | Micro-dungeon room schema enforcing maximum 2 blocks and 1 trigger plate per puzzle state. |
| **Visual Environment** | Fisher, Godwin, & Seltman (2014): Decorative visual clutter reduces learning gains by $\approx 30\%$ and increases off-task distraction. | Ban pixel art, dithering, bloom, and particle noise. Enforce flat-vector Modern Storybook SVG aesthetic. | Flat SVG vector graphics with rounded radii (`rx="8"`). Pure color fills, zero decorative noise filters. |
| **Color Signaling** | Mayer (2009) *Signaling Principle*: Visual contrast directs attentional resources. | Analogous pastels for passive environment; complementary warm tones for interactables. | Background: `#F0F4F8` / `#D9E2EC`. Interactables: `#F97316` / `#FB923C`. |
