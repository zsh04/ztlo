import test from "node:test";
import assert from "node:assert/strict";

import {
  generateParentGateChallenge,
  verifyParentGateAnswer,
} from "../../components/dashboard/ParentGate";

import {
  CANONICAL_COGNITIVE_DOMAINS,
  CANONICAL_SESSION_TELEMETRY,
  formatZeroPiiTelemetry,
} from "../../lib/curriculumData";

test("ParentGate: generateParentGateChallenge creates valid arithmetic challenge for adult gate", () => {
  for (let i = 0; i < 20; i++) {
    const challenge = generateParentGateChallenge();
    assert.ok(challenge.numA > 0, "numA must be positive");
    assert.ok(challenge.numB > 0, "numB must be positive");
    assert.ok(["+", "×"].includes(challenge.operator), "operator must be + or ×");
    assert.ok(typeof challenge.expectedAnswer === "number", "expectedAnswer must be a number");
    assert.ok(challenge.expectedAnswer > 0, "expectedAnswer must be positive");

    if (challenge.operator === "+") {
      assert.equal(challenge.expectedAnswer, challenge.numA + challenge.numB);
    } else {
      assert.equal(challenge.expectedAnswer, challenge.numA * challenge.numB);
    }

    assert.ok(challenge.questionText.includes(String(challenge.numA)));
    assert.ok(challenge.questionText.includes(String(challenge.numB)));
  }
});

test("ParentGate: verifyParentGateAnswer validates answers and rejects invalid/incorrect inputs", () => {
  const challenge = {
    numA: 8,
    numB: 6,
    operator: "+" as const,
    expectedAnswer: 14,
    questionText: "8 + 6",
  };

  // Correct string and number inputs
  assert.equal(verifyParentGateAnswer(challenge, 14), true);
  assert.equal(verifyParentGateAnswer(challenge, "14"), true);
  assert.equal(verifyParentGateAnswer(challenge, "  14  "), true);

  // Incorrect inputs
  assert.equal(verifyParentGateAnswer(challenge, 13), false);
  assert.equal(verifyParentGateAnswer(challenge, "15"), false);
  assert.equal(verifyParentGateAnswer(challenge, -14), false);
  assert.equal(verifyParentGateAnswer(challenge, "abc"), false);
  assert.equal(verifyParentGateAnswer(challenge, ""), false);
  // @ts-expect-error test invalid inputs
  assert.equal(verifyParentGateAnswer(challenge, null), false);
  // @ts-expect-error test invalid inputs
  assert.equal(verifyParentGateAnswer(challenge, undefined), false);
});

test("Zero-PII Compliance: formatZeroPiiTelemetry strips forbidden PII keys (COPPA compliance)", () => {
  const dirtyPayload = {
    sessionId: "sess-safe-123",
    roomId: "shrine-00",
    sessionDurationMs: 45000,
    touches: 20,
    email: "parent@example.com", // PII
    studentName: "Zyra Student",  // PII
    dob: "2020-01-01",           // PII
    phone: "555-123-4567",       // PII
    independentSolves: 3,
  };

  const { sanitized, piiDetected, forbiddenKeysFound } = formatZeroPiiTelemetry(dirtyPayload);

  assert.equal(piiDetected, true);
  assert.ok(forbiddenKeysFound.includes("email"));
  assert.ok(forbiddenKeysFound.includes("dob"));
  assert.ok(forbiddenKeysFound.includes("phone"));

  // Check sanitized output retains non-PII educational telemetry
  assert.equal(sanitized.sessionId, "sess-safe-123");
  assert.equal(sanitized.roomId, "shrine-00");
  assert.equal(sanitized.touches, 20);
  assert.equal(sanitized.independentSolves, 3);

  // Verify stripped fields
  assert.equal("email" in sanitized, false);
  assert.equal("studentName" in sanitized, false);
  assert.equal("dob" in sanitized, false);
  assert.equal("phone" in sanitized, false);
});

test("Zero-PII Compliance: detects email and phone patterns embedded in string values", () => {
  const leakPayload = {
    sessionId: "anonymous-session-1",
    notes: "Contact mom at mom@school.org for notes",
  };

  const { piiDetected, forbiddenKeysFound } = formatZeroPiiTelemetry(leakPayload);
  assert.equal(piiDetected, true);
  assert.ok(forbiddenKeysFound.some((k) => k.includes("notes")));
});

test("Curriculum Domains: all 6 Shrines and cognitive domains are modeled with valid pedagogical criteria", () => {
  assert.equal(CANONICAL_COGNITIVE_DOMAINS.length, 6, "Must model all 6 canonical trial shrines");

  const shrineCodes = CANONICAL_COGNITIVE_DOMAINS.map((d) => d.shrineCode);
  assert.deepEqual(shrineCodes, [
    "Shrine 01",
    "Shrine 02",
    "Shrine 03",
    "Shrine 04",
    "Shrine 05",
    "Shrine 06",
  ]);

  // Validate Shrine 01 (Spatial Reasoning & Mass)
  const shrine1 = CANONICAL_COGNITIVE_DOMAINS.find((d) => d.shrineCode === "Shrine 01");
  assert.ok(shrine1);
  assert.ok(shrine1.domainName.includes("Spatial Reasoning & Mass"));
  assert.ok(shrine1.subconsciousMechanic.includes("1-tile stone translation"));

  // Validate Shrine 03 (Frictionless Momentum)
  const shrine3 = CANONICAL_COGNITIVE_DOMAINS.find((d) => d.shrineCode === "Shrine 03");
  assert.ok(shrine3);
  assert.ok(shrine3.domainName.includes("Frictionless Momentum"));

  // Validate Shrine 04 (Concurrency & Multi-switch Circuits)
  const shrine4 = CANONICAL_COGNITIVE_DOMAINS.find((d) => d.shrineCode === "Shrine 04");
  assert.ok(shrine4);
  assert.ok(shrine4.domainName.includes("Concurrency & Multi-Switch Circuits"));

  // Validate Shrine 05 (Socio-Emotional Co-regulation)
  const shrine5 = CANONICAL_COGNITIVE_DOMAINS.find((d) => d.shrineCode === "Shrine 05");
  assert.ok(shrine5);
  assert.ok(shrine5.domainName.includes("Socio-Emotional Co-Regulation"));

  // Validate Shrine 06 (Optics & Angular Reflection)
  const shrine6 = CANONICAL_COGNITIVE_DOMAINS.find((d) => d.shrineCode === "Shrine 06");
  assert.ok(shrine6);
  assert.ok(shrine6.domainName.includes("Optics & Angular Reflection"));

  // Verify all domains have offline conversation prompts with real-world activities
  for (const domain of CANONICAL_COGNITIVE_DOMAINS) {
    assert.ok(domain.offlinePrompt.context.length > 0, `Domain ${domain.domainId} context must not be empty`);
    assert.ok(domain.offlinePrompt.question.length > 0, `Domain ${domain.domainId} question must not be empty`);
    assert.ok(domain.offlinePrompt.activity.length > 0, `Domain ${domain.domainId} activity must not be empty`);
    assert.ok(domain.masteryPercentage >= 0 && domain.masteryPercentage <= 100);
  }
});

test("Executive Function Telemetry: models pediatric health limits and bedtime twilight compliance", () => {
  assert.ok(CANONICAL_SESSION_TELEMETRY.activePlayDurationMinutes <= CANONICAL_SESSION_TELEMETRY.bedtimeThresholdMinutes);
  assert.equal(CANONICAL_SESSION_TELEMETRY.bedtimeCompliant, true);
  assert.ok(CANONICAL_SESSION_TELEMETRY.independentSolveRatePct > 70, "Promotes high independent problem-solving self-efficacy");
  assert.ok(CANONICAL_SESSION_TELEMETRY.touchTargetAccuracyPct >= 95, "Adheres to pediatric touch target ergonomics (>= 80px)");
});
