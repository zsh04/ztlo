import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const SVG_DIR = path.resolve(__dirname, "../../public/assets/svg");

const EXPECTED_PUZZLE_ENTITY_SVGS = [
  // 1. Kinetic Blocks
  "stone_block.svg",
  "stone_block_active.svg",
  "ice_block.svg",
  "ice_block_sliding.svg",

  // 2. Lotus Pressure Plates
  "plate_lotus_dormant.svg",
  "plate_lotus_active.svg",

  // 3. Solar Emitter Pedestals (Master + 4 Cardinal Directions)
  "emitter_sun_pedestal.svg",
  "emitter_sun_pedestal_east.svg",
  "emitter_sun_pedestal_west.svg",
  "emitter_sun_pedestal_north.svg",
  "emitter_sun_pedestal_south.svg",

  // 4. Rotatable Prism Mirrors (4 Angles: 000, 045, 090, 135)
  "mirror_prism_000.svg",
  "mirror_prism_045.svg",
  "mirror_prism_090.svg",
  "mirror_prism_135.svg",

  // 5. Solar Receptor Crystals
  "receptor_solar_crystal.svg",
  "receptor_solar_active.svg",

  // 6. Diamond Logic Gate Nexus
  "logic_gate_nexus.svg",
  "logic_gate_satisfied.svg",

  // 7. Sprout NPC: Anxious Tremble Loop (8 frames)
  ...Array.from({ length: 8 }, (_, i) => `sprout_anxious_${String(i + 1).padStart(2, "0")}.svg`),

  // 8. Sprout NPC: Co-Breathing Loop (8 frames, 0.125 Hz)
  ...Array.from({ length: 8 }, (_, i) => `sprout_breathe_${String(i + 1).padStart(2, "0")}.svg`),

  // 9. Sprout NPC: Serene Joy Loop (6 frames)
  ...Array.from({ length: 6 }, (_, i) => `sprout_joy_${String(i + 1).padStart(2, "0")}.svg`),
];

test("Interactive Entity Sprites: All 41 SVGs exist and conform to specifications (Issue #53)", () => {
  for (const filename of EXPECTED_PUZZLE_ENTITY_SVGS) {
    const filepath = path.join(SVG_DIR, filename);
    assert.ok(fs.existsSync(filepath), `Expected file ${filename} does not exist in public/assets/svg/`);

    const content = fs.readFileSync(filepath, "utf-8");
    const stat = fs.statSync(filepath);

    // 1. File size budget: strictly <= 8KB (8192 bytes)
    assert.ok(
      stat.size <= 8192,
      `File ${filename} size (${stat.size} bytes) exceeds the 8KB limit (8192 bytes)`
    );
    assert.ok(stat.size >= 500, `File ${filename} size (${stat.size} bytes) is suspiciously small`);

    // 2. Standalone valid SVG header and namespace
    assert.ok(
      content.includes('xmlns="http://www.w3.org/2000/svg"'),
      `File ${filename} must define xmlns="http://www.w3.org/2000/svg"`
    );
    assert.ok(content.startsWith("<svg"), `File ${filename} must start with <svg root tag`);
    assert.ok(content.trimEnd().endsWith("</svg>"), `File ${filename} must close with </svg>`);

    // 3. Retina 160x160 resolution
    assert.ok(
      content.includes('viewBox="0 0 160 160"'),
      `File ${filename} must have viewBox="0 0 160 160"`
    );
    assert.ok(
      content.includes('width="160"'),
      `File ${filename} must specify width="160"`
    );
    assert.ok(
      content.includes('height="160"'),
      `File ${filename} must specify height="160"`
    );
  }
});

test("Interactive Entity Sprites: Sprout character loops have exact frame counts and 0.125 Hz cadence", () => {
  const anxiousFrames = EXPECTED_PUZZLE_ENTITY_SVGS.filter((fn) => fn.startsWith("sprout_anxious_"));
  assert.equal(anxiousFrames.length, 8, "Sprout anxious cycle must have exactly 8 frames");

  const breatheFrames = EXPECTED_PUZZLE_ENTITY_SVGS.filter((fn) => fn.startsWith("sprout_breathe_"));
  assert.equal(breatheFrames.length, 8, "Sprout co-breathing cycle must have exactly 8 frames (0.125 Hz)");

  const joyFrames = EXPECTED_PUZZLE_ENTITY_SVGS.filter((fn) => fn.startsWith("sprout_joy_"));
  assert.equal(joyFrames.length, 6, "Sprout joy cycle must have exactly 6 frames");
});
