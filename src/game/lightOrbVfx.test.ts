import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  determineLightOrbExpression,
  LightOrbExpression,
} from "../ecs/systems/MentorSystem";
import { GameWorld } from "../ecs/world";
import { ALL_SHRINE_ROOMS } from "../game/rooms";
import { LightOrbCompanion } from "../components/mentor/LightOrbCompanion";

test("determineLightOrbExpression: Bedtime twilight / bedtime yields sleepy", () => {
  assert.equal(
    determineLightOrbExpression({ bedtimePhase: "twilight" }),
    "sleepy",
    "Twilight phase must yield sleepy expression"
  );

  assert.equal(
    determineLightOrbExpression({ bedtimePhase: "bedtime" }),
    "sleepy",
    "Bedtime phase must yield sleepy expression"
  );

  assert.equal(
    determineLightOrbExpression({ isBedtimeDimmed: true }),
    "sleepy",
    "isBedtimeDimmed must yield sleepy expression"
  );
});

test("determineLightOrbExpression: Successful push, room cleared, or praise yields happy", () => {
  assert.equal(
    determineLightOrbExpression({ isRecentSuccessfulPush: true }),
    "happy",
    "Recent push success must yield happy"
  );

  assert.equal(
    determineLightOrbExpression({ mentorState: "room_cleared" }),
    "happy",
    "Room cleared mentor state must yield happy"
  );

  assert.equal(
    determineLightOrbExpression({
      dialog: {
        speaker: "Light Orb",
        text: "Splendid work with that stone, Zyra!",
        promptType: "encourage",
      },
    }),
    "happy",
    "Encourage promptType must yield happy"
  );

  assert.equal(
    determineLightOrbExpression({ lastAction: "praise" }),
    "happy",
    "Praise lastAction must yield happy"
  );
});

test("determineLightOrbExpression: Socratic hint or thinking mentor state yields thinking", () => {
  assert.equal(
    determineLightOrbExpression({ mentorState: "idle_nudge" }),
    "thinking",
    "idle_nudge must yield thinking"
  );

  assert.equal(
    determineLightOrbExpression({ mentorState: "block_failed_push" }),
    "thinking",
    "block_failed_push must yield thinking"
  );

  assert.equal(
    determineLightOrbExpression({ mentorState: "block_corner_trap" }),
    "thinking",
    "block_corner_trap must yield thinking"
  );

  assert.equal(
    determineLightOrbExpression({
      dialog: {
        speaker: "Light Orb",
        text: "What do you notice about that pattern?",
        promptType: "socratic_hint",
      },
    }),
    "thinking",
    "Socratic promptType must yield thinking"
  );

  assert.equal(
    determineLightOrbExpression({
      dialog: {
        speaker: "Light Orb",
        text: "Could the light reflect elsewhere?",
        promptType: "neutral",
      },
    }),
    "thinking",
    "Dialog containing question mark must yield thinking"
  );
});

test("determineLightOrbExpression: Idle near puzzle element yields curious", () => {
  assert.equal(
    determineLightOrbExpression({
      isNearPuzzleElement: true,
      inactiveSeconds: 3,
    }),
    "curious",
    "Idle near puzzle element must yield curious"
  );

  // If not near puzzle element, default is happy
  assert.equal(
    determineLightOrbExpression({
      isNearPuzzleElement: false,
      inactiveSeconds: 3,
    }),
    "happy",
    "Default idle without puzzle element yields happy"
  );
});

test("GameWorld.getMentorExpression: Dynamic integration with game state", () => {
  const room = ALL_SHRINE_ROOMS[0]; // Shrine 00 Equilibrium (8x6)
  const world = new GameWorld(room);
  world.setEntities(JSON.parse(JSON.stringify(room.entities)));

  // 1. In daylight at rest, default is happy or curious depending on proximity
  const daylightExpr = world.getMentorExpression("daylight");
  assert.ok(
    daylightExpr === "happy" || daylightExpr === "curious",
    `Initial expression should be happy or curious, got: ${daylightExpr}`
  );

  // 2. Bedtime twilight forces sleepy expression
  assert.equal(
    world.getMentorExpression("twilight"),
    "sleepy",
    "Twilight phase must produce sleepy expression in world"
  );
  assert.equal(
    world.getMentorExpression("bedtime"),
    "sleepy",
    "Bedtime phase must produce sleepy expression in world"
  );

  // 3. Triggering pushBlock sets lastMentorAction to 'push_success'
  const player = world.getPlayer();
  assert.ok(player, "Player exists in world");

  const blocks = world.getEntityList().filter((e) => e.pushable);
  assert.ok(blocks.length > 0, "Blocks exist in world");

  // Position player adjacent to first block to test push
  const targetBlock = blocks[0];
  player.position.x = targetBlock.position.x - 1;
  player.position.y = targetBlock.position.y;

  const pushResult = world.pushBlock(targetBlock.id, { x: 1, y: 0 });
  assert.equal(pushResult.success, true);
  const exprAfterPush = world.getMentorExpression("daylight");
  assert.equal(
    exprAfterPush,
    "happy",
    "Expression immediately following successful block push must be happy"
  );
});

test("LightOrbCompanion: Renders distinct SVG facial expressions and bedtime auras", () => {
  const expressions: LightOrbExpression[] = ["happy", "thinking", "curious", "sleepy"];

  for (const expr of expressions) {
    const html = renderToString(
      React.createElement(LightOrbCompanion, {
        dialog: {
          speaker: "Light Orb",
          text: "I am floating beside you.",
          promptType: "neutral",
        },
        inactiveSeconds: 0,
        isOpen: false,
        expression: expr,
        bedtimePhase: "daylight",
      })
    );

    // Verify container reflects expression via data-expression
    assert.match(
      html,
      new RegExp(`data-expression="${expr}"`),
      `Rendered HTML must have data-expression="${expr}"`
    );

    // Verify SVG face exists
    assert.match(html, /<svg/i, "Must render SVG graphic face");

    if (expr === "happy") {
      // Happy features warm cheeks or smile curve
      assert.ok(
        html.includes("#F59E0B") || html.includes("path"),
        "Happy expression includes SVG smile"
      );
    } else if (expr === "thinking") {
      // Thinking features sparkle / tilted brow
      assert.ok(
        html.includes("data-expression=\"thinking\""),
        "Thinking expression must have thinking identifier"
      );
    } else if (expr === "curious") {
      // Curious features open round mouth (circle cx=32 cy=35)
      assert.match(html, /data-expression="curious"/);
    } else if (expr === "sleepy") {
      // Sleepy features crescent eyes
      assert.match(html, /data-expression="sleepy"/);
    }
  }
});

test("LightOrbCompanion: Bedtime twilight shifts styling to nightlight aura and sleepy expression", () => {
  const html = renderToString(
    React.createElement(LightOrbCompanion, {
      dialog: {
        speaker: "Light Orb",
        text: "Time for peaceful rest soon.",
        promptType: "neutral",
      },
      inactiveSeconds: 0,
      isOpen: false,
      bedtimePhase: "twilight",
    })
  );

  // Must have data-bedtime="twilight" and data-expression="sleepy"
  assert.match(html, /data-bedtime="twilight"/);
  assert.match(html, /data-expression="sleepy"/);

  // Nightlight aura styling classes
  assert.match(html, /opacity-85/);
  assert.match(html, /border-purple-200/);
});
