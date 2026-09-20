import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";

import { GET as healthGET } from "./health/route";
import { GET as curriculumGET } from "./curriculum/route";
import { POST as telemetryPOST } from "./telemetry/route";

test("API /api/health: returns system status, uptime, and engine diagnostics", async () => {
  const response = await healthGET();
  assert.equal(response.status, 200);

  const body = await response.json();
  assert.equal(body.status, "healthy");
  assert.equal(typeof body.timestamp, "string");
  assert.equal(typeof body.uptime, "number");
  assert.equal(body.version, "0.1.0");
  assert.equal(body.engine.phaser, "ready");
  assert.equal(body.engine.ecs, "ready");
  assert.equal(body.engine.webgpu, "supported");
});

import { ALL_SHRINE_ROOMS } from "@/game/rooms";

test("API /api/curriculum: serves canonical shrine curriculum metadata with pedagogical concepts", async () => {
  const response = await curriculumGET();
  assert.equal(response.status, 200);

  const body = await response.json();
  assert.equal(body.version, "1.0.0");
  assert.equal(body.totalShrines, ALL_SHRINE_ROOMS.length);
  assert.ok(Array.isArray(body.curriculum));
  assert.equal(body.curriculum.length, ALL_SHRINE_ROOMS.length);

  // Validate Shrine 00 (canonical Level 1-1)
  const shrine0 = body.curriculum[0];
  assert.equal(shrine0.id, "shrine-00");
  assert.equal(shrine0.name, "Shrine of Equilibrium");
  assert.equal(shrine0.width, 8);
  assert.equal(shrine0.height, 6);
  assert.equal(shrine0.unlocked, true);
  assert.ok(shrine0.pedagogicalFocus.coreConcept.includes("Discrete Impulse"));

  // Validate subsequent shrines are progression locked initially
  const shrine1 = body.curriculum[1];
  assert.equal(shrine1.id, "shrine-01");
  assert.equal(shrine1.unlocked, false);

  // Validate Shrine 04 (Grove of Harmony with emotional regulation)
  const shrine4 = body.curriculum.find((s: { id: string }) => s.id === "shrine-04");
  assert.ok(shrine4, "shrine-04 must be present in curriculum");
  assert.ok(shrine4.pedagogicalFocus.coreConcept.includes("Emotional Regulation"));
});

test("API /api/telemetry: accepts valid anonymous educational telemetry", async () => {
  const payload = {
    sessionId: "sess-abc-123",
    roomId: "shrine-00",
    sessionDurationMs: 45000,
    touches: 18,
    hintsCount: 1,
    undoCount: 0,
    completed: true,
  };

  const req = new NextRequest("http://localhost:3000/api/telemetry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const response = await telemetryPOST(req);
  assert.equal(response.status, 200);

  const body = await response.json();
  assert.equal(body.success, true);
  assert.equal(body.recorded, true);
  assert.equal(body.data.sessionId, "sess-abc-123");
  assert.equal(body.data.roomId, "shrine-00");
  assert.equal(body.data.completed, true);
});

test("API /api/telemetry: rejects payloads with forbidden PII fields (COPPA compliant)", async () => {
  const piiPayload = {
    sessionId: "sess-123",
    roomId: "shrine-00",
    sessionDurationMs: 30000,
    touches: 10,
    hintsCount: 0,
    undoCount: 0,
    completed: false,
    email: "student@school.edu", // Forbidden PII
  };

  const req = new NextRequest("http://localhost:3000/api/telemetry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(piiPayload),
  });

  const response = await telemetryPOST(req);
  assert.equal(response.status, 400);

  const body = await response.json();
  assert.ok(body.error.includes("Pediatric Privacy Violation"));
});

test("API /api/telemetry: rejects string values matching email or phone patterns", async () => {
  const leakPayload = {
    sessionId: "contact-me-at-parent@example.com", // PII pattern embedded in string
    roomId: "shrine-00",
    sessionDurationMs: 30000,
    touches: 10,
    hintsCount: 0,
    undoCount: 0,
    completed: false,
  };

  const req = new NextRequest("http://localhost:3000/api/telemetry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(leakPayload),
  });

  const response = await telemetryPOST(req);
  assert.equal(response.status, 400);

  const body = await response.json();
  assert.ok(body.error.includes("Pediatric Privacy Violation"));
});

test("API /api/telemetry: rejects negative numbers or missing required fields", async () => {
  const invalidPayload = {
    sessionId: "sess-123",
    roomId: "shrine-00",
    sessionDurationMs: -500, // Invalid negative duration
    touches: 10,
    hintsCount: 0,
    undoCount: 0,
    completed: false,
  };

  const req = new NextRequest("http://localhost:3000/api/telemetry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(invalidPayload),
  });

  const response = await telemetryPOST(req);
  assert.equal(response.status, 400);

  const body = await response.json();
  assert.ok(body.error.includes("non-negative number"));
});
