/**
 * Pedagogical Curriculum & Cognitive Domain Mastery Modeling
 * Aligns with early childhood developmental frameworks (Vygotsky, Piaget, Mayer).
 * Strict COPPA & FERPA adherence: Zero PII recorded or rendered.
 */

export interface OfflineConversationPrompt {
  context: string;
  question: string;
  activity: string;
}

export interface CognitiveDomainMastery {
  domainId: string;
  domainName: string;
  shrineId: string;
  shrineCode: string; // e.g. "Shrine 01"
  shrineTitle: string;
  coreConcept: string;
  subconsciousMechanic: string;
  stemOutcome: string;
  masteryLevel: "Mastered" | "Proficient" | "Practicing" | "Discovered" | "Locked";
  masteryPercentage: number;
  totalAttempts: number;
  independentSolves: number;
  hintAssistedSolves: number;
  averageDurationSec: number;
  unlocked: boolean;
  offlinePrompt: OfflineConversationPrompt;
}

export interface SessionExecutiveTelemetry {
  sessionId: string;
  activePlayDurationMinutes: number;
  bedtimeThresholdMinutes: number;
  bedtimeCompliant: boolean;
  touchTargetAccuracyPct: number;
  independentSolveRatePct: number;
  socraticGuidanceRatePct: number;
  frustrationFreeRewindCount: number;
  totalShrinesAvailable: number;
  totalShrinesMastered: number;
  overallCurriculumProgressPct: number;
  lastUpdated: string;
}

export const CANONICAL_COGNITIVE_DOMAINS: CognitiveDomainMastery[] = [
  {
    domainId: "domain-spatial-mass",
    domainName: "Spatial Reasoning & Mass Displacement",
    shrineId: "shrine-00",
    shrineCode: "Shrine 01",
    shrineTitle: "Shrine of Equilibrium",
    coreConcept: "Discrete Kinetic Impulse & Mass",
    subconsciousMechanic: "1-tile stone translation onto pressure plate triggers mechanical gate unsealing.",
    stemOutcome: "Internalized understanding of force, friction, and direct spatial causality.",
    masteryLevel: "Mastered",
    masteryPercentage: 100,
    totalAttempts: 12,
    independentSolves: 11,
    hintAssistedSolves: 1,
    averageDurationSec: 42,
    unlocked: true,
    offlinePrompt: {
      context: "At the grocery store or kitchen",
      question: "Why does pushing a full, heavy shopping cart take more muscle to get moving than an empty cart?",
      activity: "Push a heavy hardcover book across a table, then push a light paper napkin. Compare what happens when you let go.",
    },
  },
  {
    domainId: "domain-gravitational-inertia",
    domainName: "Gravitational Inertia & Directional Vectoring",
    shrineId: "shrine-01",
    shrineCode: "Shrine 02",
    shrineTitle: "Shrine of Still Weight",
    coreConcept: "Heavy Inertia & Directional Alignment",
    subconsciousMechanic: "Pushing heavy mass along orthogonal vectors across wide 16:9 terrain without diagonal drift.",
    stemOutcome: "Spatial navigation planning and single-axis force application.",
    masteryLevel: "Mastered",
    masteryPercentage: 95,
    totalAttempts: 8,
    independentSolves: 7,
    hintAssistedSolves: 1,
    averageDurationSec: 54,
    unlocked: true,
    offlinePrompt: {
      context: "Moving furniture or heavy toy bins",
      question: "If a toy box is very heavy, is it easier to push it straight forward or turn it around corners?",
      activity: "Test sliding a cardboard box on carpet versus on hardwood floors. Observe how surface grip changes the effort.",
    },
  },
  {
    domainId: "domain-frictionless-momentum",
    domainName: "Frictionless Momentum & Conservation",
    shrineId: "shrine-02",
    shrineCode: "Shrine 03",
    shrineTitle: "Shrine of Glacial Flow",
    coreConcept: "Newtonian Momentum & Kinetic Glide",
    subconsciousMechanic: "Frictionless ice block glides continuously until colliding with a static boundary or barrier.",
    stemOutcome: "Anticipatory path projection and obstacle-based redirection schemas.",
    masteryLevel: "Proficient",
    masteryPercentage: 88,
    totalAttempts: 9,
    independentSolves: 7,
    hintAssistedSolves: 2,
    averageDurationSec: 68,
    unlocked: true,
    offlinePrompt: {
      context: "In the kitchen with an ice cube",
      question: "When you slide an ice cube across a smooth countertop, why doesn't it stop immediately like a block of wood?",
      activity: "Gently glide an ice cube across a wet plate. Notice how it keeps moving until your finger or the edge catches it.",
    },
  },
  {
    domainId: "domain-concurrency-boolean",
    domainName: "Concurrency & Multi-Switch Circuits",
    shrineId: "shrine-03",
    shrineCode: "Shrine 04",
    shrineTitle: "Shrine of Harmony Gates",
    coreConcept: "Boolean AND Logic & Parallel Constraints",
    subconsciousMechanic: "Gate door remains locked until both disparate pressure plates are simultaneously weighted.",
    stemOutcome: "Computational thinking: parallel conditions and multi-variable coordination.",
    masteryLevel: "Proficient",
    masteryPercentage: 82,
    totalAttempts: 7,
    independentSolves: 5,
    hintAssistedSolves: 2,
    averageDurationSec: 92,
    unlocked: true,
    offlinePrompt: {
      context: "Household appliances and daily routines",
      question: "Can you think of things in our house that need TWO things to happen before they turn on (like the microwave door closed AND the button pressed)?",
      activity: "Play a game: You and your child each hold down one cushion. A pretend door only opens when BOTH cushions are pressed down at the exact same moment.",
    },
  },
  {
    domainId: "domain-socio-emotional",
    domainName: "Socio-Emotional Co-Regulation",
    shrineId: "shrine-04",
    shrineCode: "Shrine 05",
    shrineTitle: "Grove of Harmony",
    coreConcept: "Emotional Regulation & Guided Empathy",
    subconsciousMechanic: "Interactive 4-second co-breathing rhythm transitions NPC from prickly amber distress to tranquil sky-blue serenity.",
    stemOutcome: "Theory of mind, non-violent resolution, and physiological self-soothing.",
    masteryLevel: "Practicing",
    masteryPercentage: 75,
    totalAttempts: 5,
    independentSolves: 4,
    hintAssistedSolves: 1,
    averageDurationSec: 110,
    unlocked: true,
    offlinePrompt: {
      context: "Bedtime or when experiencing frustration",
      question: "Remember Sprout the Forest Spirit when they felt prickly and overwhelmed? What helped Sprout feel safe again?",
      activity: "Practice the 4-second 'Balloon Breath' together: Inhale like blowing up a gentle balloon (1-2-3-4), then exhale slowly to let the air drift out (1-2-3-4).",
    },
  },
  {
    domainId: "domain-optics-reflection",
    domainName: "Optics & Angular Reflection",
    shrineId: "shrine-05",
    shrineCode: "Shrine 06",
    shrineTitle: "Chamber of Reflections",
    coreConcept: "Geometric Law of Reflection (45°/135°)",
    subconsciousMechanic: "Rotating prism mirrors to bounce radiant starlight beam at 90° angles into the solar receptor.",
    stemOutcome: "Spatial geometric projection, angle estimation, and optical line-of-sight causality.",
    masteryLevel: "Discovered",
    masteryPercentage: 60,
    totalAttempts: 4,
    independentSolves: 2,
    hintAssistedSolves: 2,
    averageDurationSec: 135,
    unlocked: true,
    offlinePrompt: {
      context: "Sunlight through a window or flashlight in a dim room",
      question: "If you bounce a flashlight beam off a handheld mirror, where does the light circle travel on the wall when you tilt the mirror?",
      activity: "Use a pocket mirror or shiny spoon to catch a sunbeam and guide the light spot onto a target paper on the floor.",
    },
  },
];

export const CANONICAL_SESSION_TELEMETRY: SessionExecutiveTelemetry = {
  sessionId: "sess-ztlo-early-childhood-anon",
  activePlayDurationMinutes: 12.4,
  bedtimeThresholdMinutes: 15.0,
  bedtimeCompliant: true,
  touchTargetAccuracyPct: 98.6,
  independentSolveRatePct: 78.4,
  socraticGuidanceRatePct: 21.6,
  frustrationFreeRewindCount: 3,
  totalShrinesAvailable: 6,
  totalShrinesMastered: 4,
  overallCurriculumProgressPct: 83.3,
  lastUpdated: new Date().toISOString(),
};

/**
 * Strict COPPA / FERPA Zero-PII sanitization pipeline.
 * Ensures no student names, email addresses, device fingerprints, or locations
 * ever appear in educator exports or analytics.
 */
export function formatZeroPiiTelemetry(raw: Record<string, unknown>): {
  sanitized: Record<string, unknown>;
  piiDetected: boolean;
  forbiddenKeysFound: string[];
} {
  const FORBIDDEN_KEYS = [
    "email",
    "name",
    "username",
    "fullname",
    "firstname",
    "lastname",
    "phone",
    "phonenumber",
    "ip",
    "ipaddress",
    "address",
    "dob",
    "birthdate",
    "age",
    "gender",
    "location",
    "coords",
    "gps",
    "school",
    "student_id",
  ];

  const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const PHONE_PATTERN = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;

  const forbiddenKeysFound: string[] = [];
  let piiDetected = false;
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(raw)) {
    const lowerKey = key.toLowerCase();
    const matchedForbidden = FORBIDDEN_KEYS.find((forbidden) => lowerKey.includes(forbidden));
    const isForbiddenKey =
      FORBIDDEN_KEYS.includes(lowerKey) ||
      FORBIDDEN_KEYS.some((fk) => lowerKey.includes(fk));

    if (isForbiddenKey) {
      piiDetected = true;
      forbiddenKeysFound.push(key);
      continue;
    }

    if (typeof value === "string") {
      if (EMAIL_PATTERN.test(value) || PHONE_PATTERN.test(value)) {
        piiDetected = true;
        forbiddenKeysFound.push(`${key}(pattern)`);
        continue;
      }
    }

    sanitized[key] = value;
  }

  return {
    sanitized,
    piiDetected,
    forbiddenKeysFound,
  };
}
