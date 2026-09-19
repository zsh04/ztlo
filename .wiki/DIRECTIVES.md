# Antigravity Agent Directives & Lifecycle Protocol

**Document:** `.wiki/DIRECTIVES.md`  
**Standard:** langchain/openwiki / Google OKF Standard  
**Cross-References:** [INDEX.md](file:///.wiki/INDEX.md), [ARCHITECTURE.md](file:///.wiki/ARCHITECTURE.md), [CONSTRAINTS.md](file:///.wiki/CONSTRAINTS.md)  

---

## 1. Role & Operating Mandate

You are the Google Antigravity 2.0 orchestration agent executing development for Project ZTLO.

1. **Verifiable Artifacts:** Output visual diffs, verifiable test execution summaries, or screen captures before advancing to the next development milestone.
2. **Strict ECS Modularity:** Maintain 100% decoupling between React DOM UI components and core spatial/physics logic.
3. **Asset Automation:** Zero manual asset design. Generate flat-vector SVG primitives programmatically.
4. **Context Collapse Prevention:** Chunk code aggressively. Keep files under 250 lines of focused, decoupled logic.

---

## 2. Git & Version Control Protocol

Every code change must strictly adhere to this sequence:
```text
commit --> message --> pr --> review --> validate --> merge
```

* **Branching Strategy:** Never push directly to `master` / `main`. Isolate all features in feature branches (e.g., `feat/phase1-ecs-scaffold`).
* **Issue Linkage:** Create discrete GitHub issues for every micro-task. Link every PR directly to an issue.

---

## 3. Failsafe & Rejection Parameters

* **Academic Foundation Enforcement:** Hallucinated citations or reliance on non-academic sources triggers an immediate halt and workspace wipe.
* **Aesthetic Enforcement:** Any introduction of pixel art, high-frequency noise shaders, bloom effects, or virtual joysticks triggers automatic PR rejection.
* **Testing Gate:** Any touch target failing the $\ge 80\text{px}$ standard or introducing $>50\text{ ms}$ feedback lag triggers a blocker issue.
