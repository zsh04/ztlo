import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { calculateSceneLayout } from "./layout";
import { HudOverlay } from "../components/ui/HudOverlay";
import { LightOrbCompanion } from "../components/mentor/LightOrbCompanion";

test("Pediatric HCI: Playfield room tiles satisfy Fitts's law >= 80px minimum on iPad canvas", () => {
  // Canonical 8x6 Shrine of Equilibrium in standard 1280x720 canvas
  const layout8x6 = calculateSceneLayout(8, 6, 1280, 720);
  assert.ok(
    layout8x6.tileSize >= 80,
    `Tile size ${layout8x6.tileSize}px must be >= 80px to accommodate pediatric finger accuracy`
  );
  assert.equal(layout8x6.tileSize, 100);

  // Safe Margins: Verify edge margins around room grid satisfy >= 32px safe boundary
  assert.ok(
    layout8x6.gridOffsetX >= 32,
    `Horizontal margin ${layout8x6.gridOffsetX}px must be >= 32px`
  );
  assert.ok(
    layout8x6.gridOffsetY >= 32,
    `Vertical margin ${layout8x6.gridOffsetY}px must be >= 32px`
  );
});

test("Pediatric HCI: HUD primary controls satisfy >= 80px touch target minimums", () => {
  const html = renderToString(
    React.createElement(HudOverlay, {
      roomName: "Shrine of Equilibrium",
      objective: "Push the stone block onto the pressure plate",
      onResetRoom: () => {},
      onUndo: () => {},
      canUndo: true,
    })
  );

  // Reset button minimum dimensions
  assert.match(
    html,
    /aria-label="Reset Room"[^>]*min-w-\[80px\]/,
    "Reset button must have min-width >= 80px"
  );
  assert.match(
    html,
    /aria-label="Reset Room"[^>]*min-h-\[80px\]/,
    "Reset button must have min-height >= 80px"
  );

  // Undo button minimum dimensions
  assert.match(
    html,
    /aria-label="Undo last move"[^>]*min-w-\[80px\]/,
    "Undo button must have min-width >= 80px"
  );
  assert.match(
    html,
    /aria-label="Undo last move"[^>]*min-h-\[80px\]/,
    "Undo button must have min-height >= 80px"
  );

  // Room badge minimum height
  assert.match(html, /min-h-\[80px\]/, "Room info badge must align with 80px control height");
});

test("Pediatric HCI: Light Orb Companion controls satisfy >= 48-64px button minimums", () => {
  const html = renderToString(
    React.createElement(LightOrbCompanion, {
      dialog: {
        speaker: "Light Orb",
        text: "I wonder if something heavy could help?",
        promptType: "socratic_hint",
      },
      inactiveSeconds: 0,
      isOpen: true,
      canUndo: true,
      onUndo: () => {},
    })
  );

  // Light Orb Avatar: >= 80px
  assert.match(
    html,
    /aria-label="Light Orb Mentor"[^>]*min-w-\[80px\]/,
    "Orb mentor avatar must be at least 80px"
  );
  assert.match(
    html,
    /aria-label="Light Orb Mentor"[^>]*min-h-\[80px\]/,
    "Orb mentor avatar must be at least 80px"
  );

  // Close Thought Button: >= 48px
  assert.match(
    html,
    /aria-label="Close thought"[^>]*min-w-\[48px\]/,
    "Close button must be at least 48px"
  );
  assert.match(
    html,
    /aria-label="Close thought"[^>]*min-h-\[48px\]/,
    "Close button must be at least 48px"
  );

  // Mute Voice Button: >= 48px
  assert.match(
    html,
    /aria-label="Mute Voice"[^>]*min-w-\[48px\]/,
    "Mute button must be at least 48px"
  );
  assert.match(
    html,
    /aria-label="Mute Voice"[^>]*min-h-\[48px\]/,
    "Mute button must be at least 48px"
  );

  // Socratic inquiry chips: min-h >= 56px
  assert.match(
    html,
    /min-h-\[56px\]/,
    "Inquiry chips must provide at least 56px touch height"
  );
});

test("Pediatric HCI: Pointer events isolation ensures zero interference with Phaser canvas", () => {
  // Closed dialog: container has pointer-events-none, only interactive buttons are pointer-events-auto
  const closedHtml = renderToString(
    React.createElement(LightOrbCompanion, {
      dialog: {
        speaker: "Light Orb",
        text: "Observing",
        promptType: "neutral",
      },
      inactiveSeconds: 0,
      isOpen: false,
    })
  );

  // Container must have pointer-events-none
  assert.match(
    closedHtml,
    /pointer-events-none/,
    "Closed companion wrapper must have pointer-events-none"
  );

  // No active overlay backdrop when closed
  assert.equal(
    closedHtml.includes("fixed inset-0"),
    false,
    "No backdrop must exist when closed"
  );

  // Open dialog: dialog card has pointer-events-auto, but no blocking fixed inset-0 screen-wide backdrop
  const openHtml = renderToString(
    React.createElement(LightOrbCompanion, {
      dialog: {
        speaker: "Light Orb",
        text: "Thinking",
        promptType: "neutral",
      },
      inactiveSeconds: 0,
      isOpen: true,
    })
  );

  assert.equal(
    openHtml.includes("fixed inset-0"),
    false,
    "No full-screen blocking backdrop allowed so player can still tap canvas"
  );
  assert.match(
    openHtml,
    /pointer-events-auto/,
    "Dialog balloon must capture its own pointer events"
  );
});
