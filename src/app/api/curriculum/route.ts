import { NextResponse } from "next/server";
import { ALL_SHRINE_ROOMS } from "@/game/rooms";

export const dynamic = "force-dynamic";

export interface ShrineCurriculumItem {
  id: string;
  name: string;
  index: number;
  width: number;
  height: number;
  objective: string;
  hintKey: string;
  pedagogicalFocus: {
    coreConcept: string;
    description: string;
    subconsciousMechanic: string;
  };
  unlocked: boolean;
}

const PEDAGOGICAL_FOCUS_MAP: Record<
  string,
  { coreConcept: string; description: string; subconsciousMechanic: string }
> = {
  "shrine-00": {
    coreConcept: "Spatial Equilibrium & Discrete Impulse",
    description: "Introductory spatial causality where single stone push transmits immediate kinetic energy.",
    subconsciousMechanic: "1-tile stone translation onto pressure plate triggers mechanical gate unsealing.",
  },
  "shrine-01": {
    coreConcept: "Gravitational Inertia & Heavy Mass",
    description: "Reinforces discrete impulse with wide 16:9 spatial exploration.",
    subconsciousMechanic: "Pushing heavy mass directly along target vector without diagonal drift.",
  },
  "shrine-02": {
    coreConcept: "Frictionless Momentum & Conservation of Kinetic Energy",
    description: "Contrasts stone friction with infinite frictionless ice glide until collision.",
    subconsciousMechanic: "Ice block slides continuously along impulse vector until encountering boundary or wall.",
  },
  "shrine-03": {
    coreConcept: "Dual-Circuit Boolean AND Logic & Parallel Constraints",
    description: "Multi-plate concurrent actuation requiring coordinating disparate physical materials.",
    subconsciousMechanic: "Gate door remains sealed until ALL required pressure plates are simultaneously depressed.",
  },
  "shrine-04": {
    coreConcept: "Emotional Regulation & Guided Empathy",
    description: "Social-emotional learning through soothing interactions and synchronous pacing.",
    subconsciousMechanic: "Interactive co-breathing rhythm transitions NPC state and unseals barrier.",
  },
  "shrine-05": {
    coreConcept: "Optics & Angular Reflection",
    description: "Manipulating angles of incidence and reflection to guide radiant beams across physical obstacles.",
    subconsciousMechanic: "Rotating prism mirrors to redirect starlight beam into the solar receptor.",
  },
};

export async function GET() {
  const curriculum: ShrineCurriculumItem[] = ALL_SHRINE_ROOMS.map((room, index) => ({
    id: room.id,
    name: room.name,
    index,
    width: room.width,
    height: room.height,
    objective: room.objective,
    hintKey: room.hintKey,
    pedagogicalFocus: PEDAGOGICAL_FOCUS_MAP[room.id] ?? {
      coreConcept: "Spatial Problem Solving",
      description: "Tactile experimentation and physical causality.",
      subconsciousMechanic: "Direct manipulation.",
    },
    unlocked: index === 0, // Canonical progression: first shrine unlocked by default
  }));

  return NextResponse.json({
    curriculum,
    totalShrines: curriculum.length,
    version: "1.0.0",
  });
}
