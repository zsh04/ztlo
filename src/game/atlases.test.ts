import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

interface AtlasFrame {
  frame: { x: number; y: number; w: number; h: number };
  rotated: boolean;
  trimmed: boolean;
  spriteSourceSize: { x: number; y: number; w: number; h: number };
  sourceSize: { w: number; h: number };
  pivot?: { x: number; y: number };
}

interface AtlasJson {
  frames: Record<string, AtlasFrame>;
  meta: {
    app: string;
    version: string;
    image: string;
    format: string;
    size: { w: number; h: number };
    scale: string;
  };
}

const ATLAS_DIR = path.resolve(__dirname, "../../public/assets/atlases");

test("Texture Atlas Pipeline: atlas-global-entities.json conforms to TexturePacker JSON Hash specification", () => {
  const jsonPath = path.join(ATLAS_DIR, "atlas-global-entities.json");
  assert.ok(fs.existsSync(jsonPath), "atlas-global-entities.json must exist");

  const raw = fs.readFileSync(jsonPath, "utf-8");
  const data = JSON.parse(raw) as AtlasJson;

  // Validate Meta block
  assert.equal(data.meta.image, "atlas-global-entities.webp");
  assert.equal(data.meta.format, "RGBA8888");
  assert.ok(data.meta.size.w <= 1024 && data.meta.size.h <= 1024, "Atlas sheet must fit in 1024x1024 to respect VRAM limit");

  // Validate Frames object
  assert.ok(typeof data.frames === "object" && data.frames !== null);

  // Validate Hero (Zyra) frames
  const requiredZyraPrefixes = [
    "zyra-idle",
    "zyra-walk",
    "zyra-walk-up",
    "zyra-walk-down",
    "zyra-push",
    "zyra-celebrate",
    "zyra-sleep",
  ];
  for (const prefix of requiredZyraPrefixes) {
    assert.ok(data.frames[prefix] || data.frames[`${prefix}-0`], `Missing Zyra animation frames for ${prefix}`);
  }

  // Validate Companion (Light Orb) faces
  const requiredOrbMoods = ["happy", "thinking", "curious", "blink", "nap", "sparkle"];
  for (const mood of requiredOrbMoods) {
    assert.ok(data.frames[`orb-faces-${mood}`], `Missing Light Orb face for mood: ${mood}`);
  }

  // Validate NPC (Sprout) frames
  const requiredSproutPrefixes = ["sprout-anxious", "sprout-breathe", "sprout-joy"];
  for (const prefix of requiredSproutPrefixes) {
    assert.ok(data.frames[prefix] || data.frames[`${prefix}-0`], `Missing Sprout frames for ${prefix}`);
  }

  // Validate Kinetic Blocks
  assert.ok(data.frames["stone-block"] || data.frames["stone-block-0"], "Missing stone block frame");
  assert.ok(data.frames["stone-block-1"], "Missing active stone block frame");
  assert.ok(data.frames["ice-block"] || data.frames["ice-block-0"], "Missing ice block frame");
  assert.ok(data.frames["ice-block-1"], "Missing sliding ice block frame");

  // Validate FX Particles
  const requiredFx = ["fx-dust-puff", "fx-frost-sparkle", "fx-touch-ripple", "fx-stardust"];
  for (const fx of requiredFx) {
    assert.ok(data.frames[fx] || data.frames[`${fx}-0`], `Missing FX particle frames for ${fx}`);
  }

  // Validate geometry bounds for all frames
  for (const [name, f] of Object.entries(data.frames)) {
    assert.ok(f.frame.x >= 0, `Frame ${name} x must be non-negative`);
    assert.ok(f.frame.y >= 0, `Frame ${name} y must be non-negative`);
    assert.ok(f.frame.x + f.frame.w <= data.meta.size.w, `Frame ${name} exceeds sheet width`);
    assert.ok(f.frame.y + f.frame.h <= data.meta.size.h, `Frame ${name} exceeds sheet height`);
    assert.ok(f.sourceSize.w > 0 && f.sourceSize.h > 0, `Frame ${name} must have positive dimensions`);
  }
});

test("Texture Atlas Pipeline: atlas-shrine-environment.json conforms to TexturePacker JSON Hash specification", () => {
  const jsonPath = path.join(ATLAS_DIR, "atlas-shrine-environment.json");
  assert.ok(fs.existsSync(jsonPath), "atlas-shrine-environment.json must exist");

  const raw = fs.readFileSync(jsonPath, "utf-8");
  const data = JSON.parse(raw) as AtlasJson;

  // Validate Meta block
  assert.equal(data.meta.image, "atlas-shrine-environment.webp");
  assert.equal(data.meta.format, "RGBA8888");
  assert.ok(data.meta.size.w <= 1024 && data.meta.size.h <= 1024, "Sheet must fit in 1024x1024");

  // Validate Environment frames
  assert.ok(data.frames["tile-floor-light"], "Missing tile-floor-light frame");
  assert.ok(data.frames["tile-floor-dark"], "Missing tile-floor-dark frame");
  assert.ok(data.frames["wall-cap-chamfer-top"], "Missing wall-cap-chamfer-top frame");
  assert.ok(data.frames["wall-face-moss-0"], "Missing wall-face-moss-0 frame");
  assert.ok(data.frames["plate-dormant"], "Missing plate-dormant frame");
  assert.ok(data.frames["plate-active"], "Missing plate-active frame");
  assert.ok(data.frames["door-sealed"], "Missing door-sealed frame");
  assert.ok(data.frames["door-open"], "Missing door-open frame");
  assert.ok(data.frames["switch-runic-1-off"], "Missing switch-runic-1-off frame");
  assert.ok(data.frames["switch-runic-1-on"], "Missing switch-runic-1-on frame");
  assert.ok(data.frames["emitter-brass-east"], "Missing emitter-brass-east frame");
  assert.ok(data.frames["mirror-prism-45deg"], "Missing mirror-prism-45deg frame");
  assert.ok(data.frames["receptor-solar-dormant"], "Missing receptor-solar-dormant frame");
  assert.ok(data.frames["receptor-solar-active"], "Missing receptor-solar-active frame");
  assert.ok(data.frames["conduit-track-straight-h"], "Missing conduit-track-straight-h frame");
  assert.ok(data.frames["logic-nexus-dormant"], "Missing logic-nexus-dormant frame");
  assert.ok(data.frames["logic-nexus-active"], "Missing logic-nexus-active frame");

  // Validate geometry bounds
  for (const [name, f] of Object.entries(data.frames)) {
    assert.ok(f.frame.x >= 0, `Frame ${name} x must be non-negative`);
    assert.ok(f.frame.y >= 0, `Frame ${name} y must be non-negative`);
    assert.ok(f.frame.x + f.frame.w <= data.meta.size.w, `Frame ${name} exceeds sheet width`);
    assert.ok(f.frame.y + f.frame.h <= data.meta.size.h, `Frame ${name} exceeds sheet height`);
  }
});

test("Texture Atlas Pipeline: WebP files exist and total compressed payload satisfies <= 2MB budget", () => {
  const webpEntitiesPath = path.join(ATLAS_DIR, "atlas-global-entities.webp");
  const webpEnvPath = path.join(ATLAS_DIR, "atlas-shrine-environment.webp");

  assert.ok(fs.existsSync(webpEntitiesPath), "atlas-global-entities.webp must exist");
  assert.ok(fs.existsSync(webpEnvPath), "atlas-shrine-environment.webp must exist");

  const entitiesStat = fs.statSync(webpEntitiesPath);
  const envStat = fs.statSync(webpEnvPath);

  assert.ok(entitiesStat.size > 0, "atlas-global-entities.webp must not be empty");
  assert.ok(envStat.size > 0, "atlas-shrine-environment.webp must not be empty");

  const totalBytes = entitiesStat.size + envStat.size;
  const maxBudgetBytes = 2 * 1024 * 1024; // 2 MB

  assert.ok(
    totalBytes <= maxBudgetBytes,
    `Total WebP atlas size (${(totalBytes / 1024).toFixed(1)} KB) exceeds 2MB limit`
  );
});
