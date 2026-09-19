---
title: "Subconscious Pedagogical Curriculum Matrix"
version: "1.0.0"
revision_date: "2026-09-19"
last_updated: "2026-09-19"
status: "Active"
standard: "Google OKF / langchain/openwiki"
document_id: "WIKI_ZTLO_Curriculum_20260919_v01"
---

# Subconscious Pedagogical Curriculum Matrix

**Document ID:** `WIKI_ZTLO_Curriculum_20260919_v01`  
**Version:** `1.0.0`  
**Revision Date:** `2026-09-19`  
**Last Updated:** `2026-09-19`  
**Status:** Active  
**Standard:** Google OKF / langchain/openwiki Standard  
**Cross-References:** [[Home]], [[Architecture]], [[Constraints]], [[Directives]]  

---

## 1. Pedagogical Philosophy: Stealth Learning

In alignment with empirical findings on early childhood education (Bers et al., 2014; Mayer, 2004), pedagogical objectives are embedded invisibly into the spatial mechanics of gameplay. The learner interacts with game objects to solve concrete goals; the underlying mathematical and psychological schemas form through active manipulation and causal observation.

---

## 2. Core Curriculum Matrix

| Discipline | In-Game Mechanic | Subconscious Learning Outcome (Age 6) | Cognitive Mechanism |
| :--- | :--- | :--- | :--- |
| **STEM / Logic** | Activating switch sequences to unlock doors; multi-plate AND/OR gates. | Sequential execution, algorithmic order, conditional logic. | Cause-and-effect state machines. Concrete visual confirmation within $\le 16\text{ ms}$. |
| **Physics (Mass & Friction)** | `StoneBlock` moves 1 grid cell per push. `IceBlock` slides continuously until collision. | Surface friction, momentum conservation, predictive trajectory mapping. | Kinesthetic mental simulation; calculating barrier requirements to stop sliding bodies. |
| **Physics (Optics)** | Directing light beams via rotatable reflective prisms to photo-receptors. | Angle of reflection, linear propagation of light, spatial geometric reasoning. | Visuospatial rotation and ray tracing in working memory. |
| **Psychology & EQ** | NPCs with visual "Mood Auras" (sad, frustrated, calm); calming requires specific soothing items. | Emotion regulation, Theory of Mind, empathy mapping, non-violent de-escalation. | Associating external behavioral states with internal needs rather than hostility. |
| **Sociology** | Connecting isolated camps via bridge construction to initiate resource trading. | Mutual interdependence, community cooperation, resource stewardship. | Understanding division of labor and mutual benefit. |
| **Philosophy & Ethics** | Foraging puzzles where leaving seed stock enables plant regeneration. | Delayed gratification, sustainable stewardship, consequence forecasting. | Overcoming immediate consumption impulses to preserve future optionality. |

---

## 3. Socratic Scaffolding Protocol

As demonstrated by Chi et al. (2001) and Lepper & Woolverton (2002), the Mentor Companion ("Light Orb") strictly avoids didactic answer delivery. When the player encounters a plateau:

1. **Inactivity Threshold:** 15 seconds of zero input $\rightarrow$ Light Orb pulses softly (`scale: [1, 1.15, 1]`).
2. **Stagnation Threshold:** 3 oscillating back-and-forth movements without state progress $\rightarrow$ Light Orb displays attention cue.
3. **Socratic Inquiry:**
   * *Misaligned Stone Block:* "What happens if we push the heavy block one more time?"
   * *Unstopped Ice Block:* "Ice slides fast! Is there something we can put in its way to stop it earlier?"
   * *Dual Switches:* "One plate is glowing, but the door is still shut! What does the other plate need?"
