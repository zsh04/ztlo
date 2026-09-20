import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { LightOrbCompanion } from "./LightOrbCompanion";
import { SOCRATIC_INQUIRY_CHIPS } from "../../ecs/systems/MentorSystem";

test("LightOrbCompanion: Closed state has pointer-events-none container and no backdrop", () => {
  const html = renderToString(
    React.createElement(LightOrbCompanion, {
      dialog: {
        speaker: "Light Orb",
        text: "I am floating right beside you, Zyra.",
        promptType: "neutral",
      },
      inactiveSeconds: 0,
      isOpen: false,
    })
  );

  // Outer container must have pointer-events-none so touches pass to Phaser canvas
  assert.match(html, /pointer-events-none/);

  // Floating orb button itself must have pointer-events-auto to receive touches
  assert.match(html, /pointer-events-auto/);
  assert.match(html, /aria-label="Light Orb Mentor"/);

  // No backdrop or dialogue balloon rendered when closed
  assert.equal(html.includes("fixed inset-0"), false, "Backdrop must not be rendered when dialog is closed");
  assert.equal(html.includes("Close thought"), false, "Dialogue balloon must not be rendered when closed");
});

test("LightOrbCompanion: Open state renders backdrop and interactive dialog balloon", () => {
  const html = renderToString(
    React.createElement(LightOrbCompanion, {
      dialog: {
        speaker: "Light Orb",
        text: "Look closely at the floor!",
        promptType: "socratic_hint",
      },
      inactiveSeconds: 5,
      isOpen: true,
    })
  );

  // Must NOT include full-screen blocking backdrop so player can still tap canvas
  assert.equal(html.includes("fixed inset-0"), false, "Must not include full-screen blocking backdrop overlay");
  assert.match(html, /pointer-events-auto/, "Dialog balloon must intercept taps");

  // Mentor text must be visible
  assert.match(html, /Look closely at the floor!/);
  assert.match(html, /LIGHT ORB/i);

  // Close button (✕) must be present
  assert.match(html, /aria-label="Close thought"/);

  // Voice mute toggle button must be present
  assert.match(html, /aria-label="Mute Voice"/);

  // All 3 standard Socratic inquiry chips must be rendered
  for (const chip of SOCRATIC_INQUIRY_CHIPS) {
    assert.ok(
      html.includes(chip.label),
      `Chip "${chip.label}" must be rendered in open dialogue sheet`
    );
  }
});

test("LightOrbCompanion: Pediatric touch ergonomics satisfy Fitts's law target minimums", () => {
  const html = renderToString(
    React.createElement(LightOrbCompanion, {
      dialog: {
        speaker: "Light Orb",
        text: "Oops, that corner is tight! Would you like to rewind one step together?",
        promptType: "socratic_hint",
      },
      inactiveSeconds: 0,
      isOpen: true,
      canUndo: true,
      onUndo: () => {},
    })
  );

  // 1. Primary Avatar Touch Target: >= 80px
  assert.match(
    html,
    /min-w-\[80px\]/,
    "Light Orb floating avatar must satisfy >= 80px touch target minimum"
  );
  assert.match(
    html,
    /min-h-\[80px\]/,
    "Light Orb floating avatar must satisfy >= 80px touch target minimum"
  );

  // 2. Close and Mute Utility Buttons: >= 48px
  assert.match(
    html,
    /min-w-\[48px\]/,
    "Utility buttons (Close / Mute) must satisfy pediatric minimum >= 48px"
  );
  assert.match(
    html,
    /min-h-\[48px\]/,
    "Utility buttons (Close / Mute) must satisfy pediatric minimum >= 48px"
  );

  // 3. Contextual Rewind Action Button: >= 56px height
  assert.match(
    html,
    /min-h-\[56px\]/,
    "Action and Inquiry Chip buttons must satisfy >= 56px height"
  );
  assert.match(html, /Rewind one step together/);
});

test("LightOrbCompanion: Corner trap state renders Rewind action only when canUndo is true", () => {
  // With canUndo = true
  const htmlCanUndo = renderToString(
    React.createElement(LightOrbCompanion, {
      dialog: {
        speaker: "Light Orb",
        text: "Oops, that corner is tight! Would you like to rewind one step together?",
        promptType: "socratic_hint",
      },
      inactiveSeconds: 0,
      isOpen: true,
      canUndo: true,
      onUndo: () => {},
    })
  );
  assert.match(htmlCanUndo, /Rewind one step together/);

  // With canUndo = false
  const htmlCannotUndo = renderToString(
    React.createElement(LightOrbCompanion, {
      dialog: {
        speaker: "Light Orb",
        text: "Oops, that corner is tight! Would you like to rewind one step together?",
        promptType: "socratic_hint",
      },
      inactiveSeconds: 0,
      isOpen: true,
      canUndo: false,
      onUndo: () => {},
    })
  );
  assert.equal(
    htmlCannotUndo.includes("Rewind one step together"),
    false,
    "Must not offer rewind action when canUndo is false"
  );
});
