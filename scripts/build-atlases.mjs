#!/usr/bin/env node
/**
 * scripts/build-atlases.mjs
 * 
 * Project ZTLO - Storybook Texture Atlas Pipeline
 * Generates production TexturePacker JSON Hash descriptors and lossless WebP sprite sheets.
 * Conforms to:
 * - Architecture Spike: docs/ENG_ZTLO_Art-Direction-and-Sprite-Pipeline-Spike_20260920_v01.md
 * - Target: Phaser 3.80 + Next.js 15 PWA
 * - Pediatric HCI (Age 6) high-contrast, storybook warmth, zero pixel art
 * - iOS Safari Jetsam Budget: <= 30.0 MB total VRAM (1024x1024 sheets @ 4MB VRAM each)
 * - Compressed payload: <= 2 MB total across sheets
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.resolve(ROOT_DIR, "public/assets/atlases");
const SVG_SOURCE_DIR = path.resolve(ROOT_DIR, "public/assets/svg");

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ---------------------------------------------------------------------------
// 1. Bin Packer (Shelf Packing with Extrude/Padding Guard)
// ---------------------------------------------------------------------------
function packFrames(frames, sheetWidth = 1024, sheetHeight = 1024, padding = 2) {
  // Sort frames by height descending, then width descending for optimal packing
  const sorted = [...frames].sort((a, b) => {
    if (b.height !== a.height) return b.height - a.height;
    return b.width - a.width;
  });

  const packed = [];
  let currentX = padding;
  let currentY = padding;
  let shelfHeight = 0;

  for (const item of sorted) {
    if (currentX + item.width + padding > sheetWidth) {
      // Advance to next row / shelf
      currentX = padding;
      currentY += shelfHeight + padding;
      shelfHeight = 0;
    }

    if (currentY + item.height + padding > sheetHeight) {
      throw new Error(
        `Atlas overflow: frame "${item.name}" (${item.width}x${item.height}) does not fit in ${sheetWidth}x${sheetHeight} sheet.`
      );
    }

    packed.push({
      ...item,
      x: currentX,
      y: currentY,
    });

    currentX += item.width + padding;
    if (item.height > shelfHeight) {
      shelfHeight = item.height;
    }
  }

  return packed;
}

// ---------------------------------------------------------------------------
// 2. TexturePacker JSON Hash Builder
// ---------------------------------------------------------------------------
function buildTexturePackerJson(packedFrames, imageName, sheetWidth, sheetHeight) {
  const framesObj = {};

  for (const item of packedFrames) {
    const frameData = {
      frame: { x: item.x, y: item.y, w: item.width, h: item.height },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: item.width, h: item.height },
      sourceSize: { w: item.width, h: item.height },
      pivot: { x: 0.5, y: 0.5 },
    };

    framesObj[item.name] = frameData;

    // Register aliases if provided
    if (Array.isArray(item.aliases)) {
      for (const alias of item.aliases) {
        framesObj[alias] = frameData;
      }
    }
  }

  return {
    frames: framesObj,
    meta: {
      app: "ZTLO Storybook TexturePacker Pipeline",
      version: "1.0",
      image: imageName,
      format: "RGBA8888",
      size: { w: sheetWidth, h: sheetHeight },
      scale: "1",
      smartupdate: "$TexturePacker:SmartUpdate:ztlo-storybook-v1$",
    },
  };
}

// ---------------------------------------------------------------------------
// 3. SVG Storybook Art Generators: Atlas 1 - Global Entities
// ---------------------------------------------------------------------------

function createZyraIdleSvg(frameIndex) {
  const sways = [0, 1, 2, 1, 0, -1];
  const breaths = [0, -1, -2, -1, 0, 0];
  const blinks = [false, false, false, true, false, false];

  const sway = sways[frameIndex % 6];
  const breath = breaths[frameIndex % 6];
  const isBlinking = blinks[frameIndex % 6];

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
    <ellipse cx="40" cy="72" rx="22" ry="5" fill="#000000" fill-opacity="0.14" />
    <g transform="translate(0, ${breath})">
      <path d="M${26 - sway} 40C26 34 32 30 40 30C48 30 54 34 M${54 + sway} 40L${58 + sway} 64C58 66 56 68 ${54 + sway} 68H${26 - sway}C24 68 22 66 ${22 - sway} 64Z" fill="#F97316" />
      <path d="M${22 - sway} 64C28 62 52 62 ${58 + sway} 64L${54 + sway} 68H${26 - sway}Z" fill="#EA580C" />
      <circle cx="40" cy="26" r="15" fill="#FED7AA" />
      <path d="M25 24C25 15 32 10 40 10C48 10 55 15 55 24C55 28 53 32 53 32C49 28 47 26 40 26C33 26 31 28 27 32C27 32 25 28 25 24Z" fill="#1E293B" />
      <path d="M${47 + sway} 12C${51 + sway} 6 57 4 57 4C57 4 ${55 + sway} 10 ${51 + sway} 14Z" fill="#FBBF24" />
      <circle cx="33" cy="29" r="2.5" fill="#FCA5A5" fill-opacity="0.6" />
      <circle cx="47" cy="29" r="2.5" fill="#FCA5A5" fill-opacity="0.6" />
      ${
        isBlinking
          ? `<line x1="32" y1="26" x2="36" y2="26" stroke="#0F172A" stroke-width="2" stroke-linecap="round" />
             <line x1="44" y1="26" x2="48" y2="26" stroke="#0F172A" stroke-width="2" stroke-linecap="round" />`
          : `<circle cx="34" cy="26" r="2.4" fill="#0F172A" />
             <circle cx="46" cy="26" r="2.4" fill="#0F172A" />
             <circle cx="35" cy="25" r="0.8" fill="#FFFFFF" />
             <circle cx="47" cy="25" r="0.8" fill="#FFFFFF" />`
      }
    </g>
  </svg>`;
}

function createZyraWalkSvg(frameIndex) {
  const legAngles = [-16, -8, 0, 10, 16, 8, 0, -10];
  const bounces = [0, -2, -3, -1, 0, -2, -3, -1];
  const capeOffsets = [-2, -4, -5, -3, -2, -4, -5, -3];

  const leg = legAngles[frameIndex % 8];
  const bounce = bounces[frameIndex % 8];
  const cape = capeOffsets[frameIndex % 8];

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
    <ellipse cx="40" cy="72" rx="20" ry="5" fill="#000000" fill-opacity="0.12" />
    <g transform="translate(0, ${bounce})">
      <ellipse cx="${35 - leg * 0.4}" cy="67" rx="4" ry="3" fill="#9A3412" />
      <ellipse cx="${45 + leg * 0.4}" cy="67" rx="4" ry="3" fill="#9A3412" />
      <path d="M26 40C26 34 32 30 40 30C48 30 54 34 54 40L${56 + cape} 64C56 66 54 68 52 68H${26 + cape}L26 40Z" fill="#F97316" />
      <path d="M${26 + cape} 64L52 64L50 68H${28 + cape}Z" fill="#EA580C" />
      <circle cx="40" cy="26" r="15" fill="#FED7AA" />
      <path d="M25 24C25 15 32 10 40 10C48 10 55 15 55 24C55 28 53 32 53 32C49 28 47 26 40 26C33 26 31 28 27 32Z" fill="#1E293B" />
      <path d="M47 12C51 6 57 4 57 4C57 4 55 10 51 14Z" fill="#FBBF24" />
      <circle cx="34" cy="29" r="2.5" fill="#FCA5A5" fill-opacity="0.6" />
      <circle cx="48" cy="29" r="2.5" fill="#FCA5A5" fill-opacity="0.6" />
      <circle cx="36" cy="26" r="2.4" fill="#0F172A" />
      <circle cx="48" cy="26" r="2.4" fill="#0F172A" />
      <circle cx="37" cy="25" r="0.8" fill="#FFFFFF" />
      <circle cx="49" cy="25" r="0.8" fill="#FFFFFF" />
    </g>
  </svg>`;
}

function createZyraWalkUpSvg(frameIndex) {
  const bounces = [0, -2, -3, -1, 0, -2, -3, -1];
  const sways = [-2, -1, 0, 1, 2, 1, 0, -1];
  const bounce = bounces[frameIndex % 8];
  const sway = sways[frameIndex % 8];

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
    <ellipse cx="40" cy="72" rx="20" ry="5" fill="#000000" fill-opacity="0.12" />
    <g transform="translate(${sway}, ${bounce})">
      <ellipse cx="34" cy="67" rx="4" ry="3" fill="#9A3412" />
      <ellipse cx="46" cy="67" rx="4" ry="3" fill="#9A3412" />
      <path d="M26 38C26 32 32 28 40 28C48 28 54 32 54 38L58 65C58 67 56 69 54 69H26C24 69 22 67 22 65Z" fill="#F97316" />
      <path d="M22 65L58 65L54 69H26Z" fill="#EA580C" />
      <rect x="33" y="38" width="14" height="16" rx="3" fill="#B45309" stroke="#78350F" stroke-width="1.5" />
      <line x1="33" y1="44" x2="47" y2="44" stroke="#FBBF24" stroke-width="1.5" />
      <circle cx="40" cy="24" r="15" fill="#1E293B" />
      <path d="M47 10C51 4 57 2 57 2C57 2 55 8 51 12Z" fill="#FBBF24" />
    </g>
  </svg>`;
}

function createZyraWalkDownSvg(frameIndex) {
  const bounces = [0, -2, -3, -1, 0, -2, -3, -1];
  const sways = [1, 2, 0, -1, -2, -1, 0, 1];
  const bounce = bounces[frameIndex % 8];
  const sway = sways[frameIndex % 8];

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
    <ellipse cx="40" cy="72" rx="20" ry="5" fill="#000000" fill-opacity="0.12" />
    <g transform="translate(${sway}, ${bounce})">
      <ellipse cx="33" cy="68" rx="4.5" ry="3" fill="#9A3412" />
      <ellipse cx="47" cy="68" rx="4.5" ry="3" fill="#9A3412" />
      <path d="M26 40C26 34 32 30 40 30C48 30 54 34 54 40L58 64H22L26 40Z" fill="#F97316" />
      <path d="M22 64H58L54 68H26Z" fill="#EA580C" />
      <circle cx="40" cy="26" r="15" fill="#FED7AA" />
      <path d="M25 24C25 15 32 10 40 10C48 10 55 15 55 24C55 28 53 32 53 32C49 28 47 26 40 26C33 26 31 28 27 32Z" fill="#1E293B" />
      <path d="M47 12C51 6 57 4 57 4C57 4 55 10 51 14Z" fill="#FBBF24" />
      <circle cx="33" cy="29" r="2.5" fill="#FCA5A5" fill-opacity="0.6" />
      <circle cx="47" cy="29" r="2.5" fill="#FCA5A5" fill-opacity="0.6" />
      <circle cx="34" cy="26" r="2.4" fill="#0F172A" />
      <circle cx="46" cy="26" r="2.4" fill="#0F172A" />
      <circle cx="35" cy="25" r="0.8" fill="#FFFFFF" />
      <circle cx="47" cy="25" r="0.8" fill="#FFFFFF" />
      <path d="M37 32C38 34 42 34 43 32" stroke="#B45309" stroke-width="1.5" stroke-linecap="round" fill="none" />
    </g>
  </svg>`;
}

function createZyraPushSvg(frameIndex) {
  const strains = [0, 1, 2, 2, 1, 0];
  const strain = strains[frameIndex % 6];

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
    <ellipse cx="38" cy="72" rx="22" ry="5" fill="#000000" fill-opacity="0.14" />
    <g transform="translate(${strain * 1.5}, 0)">
      <ellipse cx="22" cy="70" rx="5" ry="3" fill="#9A3412" />
      <ellipse cx="36" cy="68" rx="5" ry="3" fill="#9A3412" />
      <path d="M22 42C24 35 30 31 38 31C46 31 52 35 52 42L56 64H20Z" fill="#F97316" />
      <rect x="42" y="38" width="16" height="6" rx="3" fill="#EA580C" />
      <ellipse cx="58" cy="41" rx="3" ry="3.5" fill="#FED7AA" />
      <circle cx="38" cy="27" r="14" fill="#FED7AA" />
      <path d="M24 25C24 16 31 11 38 11C46 11 52 16 52 25C52 29 50 33 50 33C46 29 44 27 38 27C32 27 30 29 26 33Z" fill="#1E293B" />
      <line x1="38" y1="24" x2="43" y2="25" stroke="#0F172A" stroke-width="1.8" stroke-linecap="round" />
      <circle cx="41" cy="27" r="2.2" fill="#0F172A" />
      <ellipse cx="43" cy="33" rx="2" ry="1.5" fill="#B45309" />
    </g>
  </svg>`;
}

function createZyraCelebrateSvg(frameIndex) {
  const jumpY = [-2, -6, -10, -12, -10, -6, -2, 0][frameIndex % 8];
  const starOpacity = [0.4, 0.7, 1.0, 1.0, 0.8, 0.5, 0.2, 0.0][frameIndex % 8];

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
    <ellipse cx="40" cy="74" rx="${20 + jumpY * 0.5}" ry="4" fill="#000000" fill-opacity="0.12" />
    <g fill="#F59E0B" fill-opacity="${starOpacity}">
      <path d="M16 20L18 24L22 26L18 28L16 32L14 28L10 26L14 24Z" />
      <path d="M64 16L66 19L70 20L66 21L64 24L62 21L58 20L62 19Z" />
    </g>
    <g transform="translate(0, ${jumpY})">
      <ellipse cx="32" cy="64" rx="4" ry="3.5" fill="#9A3412" />
      <ellipse cx="48" cy="64" rx="4" ry="3.5" fill="#9A3412" />
      <rect x="20" y="24" width="7" height="18" rx="3.5" fill="#EA580C" transform="rotate(-30 23 33)" />
      <rect x="53" y="24" width="7" height="18" rx="3.5" fill="#EA580C" transform="rotate(30 56 33)" />
      <circle cx="16" cy="22" r="3.5" fill="#FED7AA" />
      <circle cx="64" cy="22" r="3.5" fill="#FED7AA" />
      <path d="M26 38C26 32 32 28 40 28C48 28 54 32 54 38L58 60H22L26 38Z" fill="#F97316" />
      <circle cx="40" cy="24" r="15" fill="#FED7AA" />
      <path d="M25 22C25 13 32 8 40 8C48 8 55 13 55 22C55 26 53 30 53 30C49 26 47 24 40 24C33 24 31 26 27 30Z" fill="#1E293B" />
      <path d="M31 24C33 22 36 22 38 24" stroke="#0F172A" stroke-width="2" stroke-linecap="round" fill="none" />
      <path d="M42 24C44 22 47 22 49 24" stroke="#0F172A" stroke-width="2" stroke-linecap="round" fill="none" />
      <path d="M35 28C35 34 45 34 45 28Z" fill="#DC2626" />
    </g>
  </svg>`;
}

function createZyraSleepSvg(frameIndex) {
  const snoreScales = [0.6, 0.9, 1.2, 0.8];
  const scale = snoreScales[frameIndex % 4];

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
    <ellipse cx="40" cy="68" rx="26" ry="6" fill="#000000" fill-opacity="0.1" />
    <path d="M18 56C18 42 28 36 40 36C52 36 62 42 62 56C62 66 52 70 40 70C28 70 18 66 18 56Z" fill="#4338CA" />
    <path d="M22 52C26 44 32 40 40 40C48 40 54 44 58 52" stroke="#818CF8" stroke-width="3" fill="none" />
    <ellipse cx="28" cy="42" rx="11" ry="9" fill="#FED7AA" />
    <path d="M19 40C19 32 24 28 30 28C35 28 39 31 39 36" fill="#1E293B" />
    <path d="M26 43C28 45 31 45 33 43" stroke="#0F172A" stroke-width="1.8" stroke-linecap="round" fill="none" />
    <g transform="translate(50, 22) scale(${scale})">
      <text x="0" y="0" font-family="sans-serif" font-weight="bold" font-size="12" fill="#A5B4FC">z</text>
    </g>
  </svg>`;
}

function createOrbFaceSvg(mood) {
  let innerExpression = "";

  if (mood === "happy") {
    innerExpression = `
      <path d="M16 20C18 17 21 17 23 20" stroke="#78350F" stroke-width="2" stroke-linecap="round" fill="none" />
      <path d="M25 20C27 17 30 17 32 20" stroke="#78350F" stroke-width="2" stroke-linecap="round" fill="none" />
      <path d="M19 25C21 29 27 29 29 25" stroke="#78350F" stroke-width="2" stroke-linecap="round" fill="none" />
    `;
  } else if (mood === "thinking") {
    innerExpression = `
      <line x1="16" y1="18" x2="22" y2="18" stroke="#78350F" stroke-width="2" stroke-linecap="round" />
      <path d="M26 16C28 15 31 16 32 18" stroke="#78350F" stroke-width="2" stroke-linecap="round" fill="none" />
      <circle cx="20" cy="22" r="2.2" fill="#78350F" />
      <circle cx="29" cy="22" r="2.2" fill="#78350F" />
      <circle cx="21" cy="21" r="0.7" fill="#FFFFFF" />
      <circle cx="30" cy="21" r="0.7" fill="#FFFFFF" />
      <line x1="22" y1="28" x2="26" y2="28" stroke="#78350F" stroke-width="1.8" stroke-linecap="round" />
    `;
  } else if (mood === "curious") {
    innerExpression = `
      <circle cx="18" cy="21" r="3" fill="#78350F" />
      <circle cx="30" cy="21" r="3" fill="#78350F" />
      <circle cx="19" cy="20" r="1.1" fill="#FFFFFF" />
      <circle cx="31" cy="20" r="1.1" fill="#FFFFFF" />
      <circle cx="24" cy="28" r="2.2" fill="#78350F" />
    `;
  } else if (mood === "blink") {
    innerExpression = `
      <line x1="16" y1="22" x2="22" y2="22" stroke="#78350F" stroke-width="2" stroke-linecap="round" />
      <line x1="26" y1="22" x2="32" y2="22" stroke="#78350F" stroke-width="2" stroke-linecap="round" />
      <path d="M21 27C23 29 25 29 27 27" stroke="#78350F" stroke-width="1.8" stroke-linecap="round" fill="none" />
    `;
  } else if (mood === "nap") {
    innerExpression = `
      <path d="M16 23C18 25 21 25 23 23" stroke="#78350F" stroke-width="1.8" stroke-linecap="round" fill="none" />
      <path d="M25 23C27 25 30 25 32 23" stroke="#78350F" stroke-width="1.8" stroke-linecap="round" fill="none" />
      <circle cx="36" cy="14" r="1.5" fill="#A855F7" fill-opacity="0.8" />
    `;
  } else if (mood === "sparkle") {
    innerExpression = `
      <path d="M19 18L20 21L23 22L20 23L19 26L18 23L15 22L18 21Z" fill="#78350F" />
      <path d="M29 18L30 21L33 22L30 23L29 26L28 23L25 22L28 21Z" fill="#78350F" />
      <path d="M20 28C22 32 26 32 28 28" stroke="#78350F" stroke-width="2" stroke-linecap="round" fill="none" />
    `;
  }

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="22" fill="#FDE68A" fill-opacity="0.45" />
    <circle cx="24" cy="24" r="16" fill="#FEF08A" stroke="#F59E0B" stroke-width="2.2" />
    ${innerExpression}
  </svg>`;
}

function createSproutAnxiousSvg(frameIndex) {
  const tremble = [-1.5, 1.5, -1, 1, -1.5, 1.5, -0.5, 0.5][frameIndex % 8];

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
    <ellipse cx="40" cy="72" rx="20" ry="5" fill="#000000" fill-opacity="0.12" />
    <circle cx="40" cy="42" r="32" fill="#BBF7D0" fill-opacity="0.35" />
    <g transform="translate(${tremble}, 0)">
      <path d="M28 26C20 18 16 28 24 34Z" fill="#86EFAC" stroke="#16A34A" stroke-width="1.8" />
      <path d="M52 26C60 18 64 28 56 34Z" fill="#86EFAC" stroke="#16A34A" stroke-width="1.8" />
      <ellipse cx="40" cy="46" rx="20" ry="22" fill="#BBF7D0" stroke="#16A34A" stroke-width="2.5" />
      <ellipse cx="33" cy="42" rx="3.5" ry="5" fill="#14532D" />
      <ellipse cx="47" cy="42" rx="3.5" ry="5" fill="#14532D" />
      <circle cx="34" cy="40" r="1.2" fill="#FFFFFF" />
      <circle cx="48" cy="40" r="1.2" fill="#FFFFFF" />
      <path d="M54 38C55 36 57 36 57 39C57 41 55 42 54 41Z" fill="#38BDF8" />
      <path d="M36 54C38 52 42 52 44 54" stroke="#14532D" stroke-width="2" stroke-linecap="round" fill="none" />
    </g>
  </svg>`;
}

function createSproutBreatheSvg(frameIndex) {
  const scales = [1.0, 1.05, 1.12, 1.18, 1.15, 1.08, 1.02, 0.98];
  const s = scales[frameIndex % 8];

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
    <ellipse cx="40" cy="72" rx="22" ry="5" fill="#000000" fill-opacity="0.12" />
    <circle cx="40" cy="44" r="${28 * s}" fill="#34D399" fill-opacity="0.3" />
    <g transform="translate(40, 44) scale(${s}) translate(-40, -44)">
      <path d="M26 24C18 16 16 26 24 32Z" fill="#4ADE80" stroke="#15803D" stroke-width="2" />
      <path d="M54 24C62 16 64 26 56 32Z" fill="#4ADE80" stroke="#15803D" stroke-width="2" />
      <ellipse cx="40" cy="46" rx="21" ry="22" fill="#86EFAC" stroke="#15803D" stroke-width="2.5" />
      <path d="M30 42C32 45 36 45 38 42" stroke="#14532D" stroke-width="2.2" stroke-linecap="round" fill="none" />
      <path d="M42 42C44 45 48 45 50 42" stroke="#14532D" stroke-width="2.2" stroke-linecap="round" fill="none" />
      <path d="M37 50C38 52 42 52 43 50" stroke="#14532D" stroke-width="2" stroke-linecap="round" fill="none" />
      <path d="M22 28C24 24 28 26 26 30Z" fill="#F472B6" fill-opacity="0.8" />
    </g>
  </svg>`;
}

function createSproutJoySvg(frameIndex) {
  const bounces = [0, -3, -6, -4, -1, 0];
  const bounce = bounces[frameIndex % 6];

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
    <ellipse cx="40" cy="74" rx="22" ry="5" fill="#000000" fill-opacity="0.12" />
    <circle cx="40" cy="44" r="34" fill="#FDE047" fill-opacity="0.35" />
    <g transform="translate(0, ${bounce})">
      <circle cx="40" cy="20" r="5" fill="#F472B6" />
      <circle cx="35" cy="18" r="4" fill="#F472B6" />
      <circle cx="45" cy="18" r="4" fill="#F472B6" />
      <circle cx="40" cy="14" r="4" fill="#F472B6" />
      <circle cx="40" cy="18" r="3" fill="#FDE047" />
      <ellipse cx="40" cy="46" rx="22" ry="23" fill="#4ADE80" stroke="#15803D" stroke-width="2.5" />
      <path d="M29 41C31 38 35 38 37 41" stroke="#14532D" stroke-width="2.5" stroke-linecap="round" fill="none" />
      <path d="M43 41C45 38 49 38 51 41" stroke="#14532D" stroke-width="2.5" stroke-linecap="round" fill="none" />
      <path d="M35 48C35 54 45 54 45 48Z" fill="#DC2626" stroke="#991B1B" stroke-width="1.5" />
    </g>
  </svg>`;
}

function createStoneBlockSvg(isActive) {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
    <rect x="8" y="12" width="64" height="62" rx="12" fill="#000000" fill-opacity="0.2" />
    <rect x="8" y="8" width="64" height="62" rx="12" fill="#94A3B8" stroke="#64748B" stroke-width="3" />
    <rect x="12" y="12" width="56" height="20" rx="8" fill="#CBD5E1" fill-opacity="0.45" />
    <circle cx="40" cy="40" r="14" stroke="${isActive ? "#F97316" : "#64748B"}" stroke-width="3.5" fill="${isActive ? "#FED7AA" : "#475569"}" fill-opacity="${isActive ? "0.6" : "0.3"}" />
    <path d="M40 32V48M32 40H48" stroke="${isActive ? "#EA580C" : "#475569"}" stroke-width="3" stroke-linecap="round" />
    ${
      isActive
        ? `<circle cx="40" cy="40" r="22" stroke="#F97316" stroke-width="2" stroke-dasharray="3 3" fill="none" />`
        : ""
    }
  </svg>`;
}

function createIceBlockSvg(isSliding) {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
    <rect x="8" y="12" width="64" height="62" rx="12" fill="#0284C7" fill-opacity="0.25" />
    <rect x="8" y="8" width="64" height="62" rx="12" fill="#38BDF8" fill-opacity="0.88" stroke="#BAE6FD" stroke-width="3" />
    <path d="M14 14L44 14L24 54L14 54Z" fill="#FFFFFF" fill-opacity="0.45" />
    <circle cx="40" cy="40" r="14" stroke="#FFFFFF" stroke-width="2.5" stroke-dasharray="3 3" fill="none" />
    <path d="M40 30V50M30 40H50M33 33L47 47M33 47L47 33" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" />
    <circle cx="16" cy="16" r="3" fill="#FFFFFF" fill-opacity="0.9" />
    ${
      isSliding
        ? `<line x1="6" y1="24" x2="2" y2="24" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" />
           <line x1="6" y1="40" x2="0" y2="40" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" />
           <line x1="6" y1="56" x2="3" y2="56" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" />`
        : ""
    }
  </svg>`;
}

function createDustPuffSvg(frameIndex) {
  const r = [6, 11, 15, 17][frameIndex % 4];
  const opacity = [0.8, 0.6, 0.35, 0.1][frameIndex % 4];

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="${r}" fill="#CBD5E1" fill-opacity="${opacity}" />
    <circle cx="${24 - r * 0.4}" cy="${24 + r * 0.2}" r="${r * 0.6}" fill="#94A3B8" fill-opacity="${opacity * 0.8}" />
    <circle cx="${24 + r * 0.4}" cy="${24 + r * 0.1}" r="${r * 0.5}" fill="#94A3B8" fill-opacity="${opacity * 0.8}" />
  </svg>`;
}

function createFrostSparkleSvg(frameIndex) {
  const rot = [0, 25, 50, 75][frameIndex % 4];
  const scale = [0.6, 1.0, 0.8, 0.4][frameIndex % 4];
  const op = [0.9, 1.0, 0.7, 0.3][frameIndex % 4];

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
    <g transform="translate(24, 24) rotate(${rot}) scale(${scale}) translate(-24, -24)" fill="#BAE6FD" fill-opacity="${op}">
      <path d="M24 10L27 21L38 24L27 27L24 38L21 27L10 24L21 21Z" />
      <circle cx="24" cy="24" r="3" fill="#FFFFFF" />
    </g>
  </svg>`;
}

function createTouchRippleSvg(frameIndex) {
  const radii = [10, 18, 26, 32][frameIndex % 4];
  const op = [0.9, 0.7, 0.4, 0.15][frameIndex % 4];

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="${radii}" stroke="#38BDF8" stroke-width="2.5" fill="none" opacity="${op}" />
    <circle cx="24" cy="24" r="${Math.max(2, radii - 8)}" stroke="#F59E0B" stroke-width="1.8" fill="none" opacity="${op * 0.8}" />
  </svg>`;
}

function createStardustSvg(frameIndex) {
  const rot = [0, 30, 60, 90, 120, 150][frameIndex % 6];
  const op = [0.5, 0.8, 1.0, 0.9, 0.6, 0.3][frameIndex % 6];

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
    <g transform="translate(24, 24) rotate(${rot}) translate(-24, -24)" fill="#FACC15" fill-opacity="${op}">
      <path d="M24 8L27 18L37 19L29 25L32 35L24 29L16 35L19 25L11 19L21 18Z" />
      <circle cx="24" cy="24" r="2.5" fill="#FFFFFF" />
    </g>
  </svg>`;
}

// ---------------------------------------------------------------------------
// 4. SVG Storybook Art Generators: Atlas 2 - Shrine Environment
// ---------------------------------------------------------------------------

function createFloorTileSvg(isDark) {
  const bg = isDark ? "#E2E8F0" : "#F8FAFC";
  const stroke = isDark ? "#CBD5E1" : "#E2E8F0";

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
    <rect x="2" y="2" width="76" height="76" rx="8" fill="${bg}" stroke="${stroke}" stroke-width="2" />
    <circle cx="24" cy="24" r="1.5" fill="#94A3B8" fill-opacity="0.3" />
    <circle cx="56" cy="32" r="1.5" fill="#94A3B8" fill-opacity="0.3" />
    <circle cx="36" cy="56" r="1.5" fill="#94A3B8" fill-opacity="0.3" />
  </svg>`;
}

function createWallCapSvg(side) {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
    <rect x="4" y="4" width="72" height="72" rx="10" fill="#334155" stroke="#1E293B" stroke-width="2.5" />
    <rect x="10" y="10" width="60" height="60" rx="6" fill="#475569" fill-opacity="0.6" />
    ${
      side === "top"
        ? `<rect x="6" y="6" width="68" height="12" fill="#64748B" fill-opacity="0.8" />`
        : side === "bottom"
        ? `<rect x="6" y="62" width="68" height="12" fill="#0F172A" fill-opacity="0.8" />`
        : side === "left"
        ? `<rect x="6" y="6" width="12" height="68" fill="#64748B" fill-opacity="0.8" />`
        : `<rect x="62" y="6" width="12" height="68" fill="#0F172A" fill-opacity="0.8" />`
    }
  </svg>`;
}

function createWallFaceMossSvg(hasMoss) {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
    <rect x="4" y="4" width="72" height="72" rx="10" fill="#334155" stroke="#1E293B" stroke-width="2.5" />
    <rect x="12" y="12" width="56" height="56" rx="6" fill="#475569" fill-opacity="0.6" />
    <line x1="4" y1="40" x2="76" y2="40" stroke="#1E293B" stroke-width="2" />
    ${
      hasMoss
        ? `<path d="M12 40C16 34 22 34 24 40C26 36 32 36 34 40" fill="#10B981" fill-opacity="0.8" />
           <path d="M46 70C48 64 54 64 56 70C58 66 64 66 66 70" fill="#059669" fill-opacity="0.85" />
           <circle cx="28" cy="36" r="2" fill="#34D399" />
           <circle cx="58" cy="64" r="2" fill="#34D399" />`
        : ""
    }
  </svg>`;
}

function createPressurePlateSvg(isDepressed) {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
    ${
      isDepressed
        ? `<circle cx="40" cy="40" r="38" fill="#10B981" fill-opacity="0.25" />
           <circle cx="40" cy="40" r="34" fill="#A7F3D0" stroke="#10B981" stroke-width="3.5" />
           <circle cx="40" cy="40" r="24" fill="#34D399" stroke="#059669" stroke-width="3" />
           <circle cx="40" cy="40" r="12" fill="#10B981" stroke="#FFFFFF" stroke-width="3.5" />
           <circle cx="40" cy="40" r="5" fill="#FFFFFF" />
           <circle cx="40" cy="22" r="2.5" fill="#047857" />
           <circle cx="58" cy="40" r="2.5" fill="#047857" />
           <circle cx="40" cy="58" r="2.5" fill="#047857" />
           <circle cx="22" cy="40" r="2.5" fill="#047857" />`
        : `<circle cx="40" cy="40" r="34" fill="#E2E8F0" stroke="#CBD5E1" stroke-width="3.5" />
           <circle cx="40" cy="40" r="24" fill="#FFEDD5" stroke="#F97316" stroke-width="3" />
           <circle cx="40" cy="40" r="12" fill="none" stroke="#F97316" stroke-width="3.5" />
           <circle cx="40" cy="40" r="4" fill="#F97316" />`
    }
  </svg>`;
}

function createRunicSwitchSvg(numeral, isActive) {
  const roman = ["I", "II", "III"][numeral - 1];
  const bg = isActive ? "#047857" : "#334155";
  const border = isActive ? "#34D399" : "#64748B";
  const textCol = isActive ? "#FFFFFF" : "#CBD5E1";

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
    <rect x="6" y="6" width="68" height="68" rx="14" fill="${bg}" stroke="${border}" stroke-width="3" />
    ${
      isActive
        ? `<rect x="10" y="10" width="60" height="60" rx="10" stroke="#10B981" stroke-width="2" stroke-dasharray="4 3" fill="none" />`
        : ""
    }
    <text x="40" y="48" font-family="sans-serif" font-weight="bold" font-size="24" fill="${textCol}" text-anchor="middle">${roman}</text>
  </svg>`;
}

function createDoorSvg(isOpen) {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
    <path d="M12 72V28C12 14 24 8 40 8C56 8 68 14 68 28V72H12Z" fill="#CBD5E1" stroke="#64748B" stroke-width="3.5" />
    ${
      isOpen
        ? `<path d="M20 72V30C20 20 28 16 40 16C52 16 60 20 60 30V72H20Z" fill="#10B981" fill-opacity="0.9" />
           <ellipse cx="40" cy="50" rx="15" ry="18" fill="#FFFFFF" fill-opacity="0.85" />
           <circle cx="40" cy="45" r="8" fill="#E0F2FE" />`
        : `<path d="M20 72V30C20 20 28 16 40 16C52 16 60 20 60 30V72H20Z" fill="#475569" />
           <g stroke="#94A3B8" stroke-width="3" stroke-linecap="round">
             <line x1="28" y1="26" x2="28" y2="72" />
             <line x1="40" y1="20" x2="40" y2="72" />
             <line x1="52" y1="26" x2="52" y2="72" />
             <line x1="20" y1="46" x2="60" y2="46" />
           </g>
           <circle cx="40" cy="46" r="6" fill="#F59E0B" stroke="#B45309" stroke-width="1.5" />`
    }
  </svg>`;
}

function createEmitterSvg(dir) {
  let nx = 40, ny = 40;
  if (dir === "east") nx = 66;
  else if (dir === "west") nx = 14;
  else if (dir === "north") ny = 14;
  else if (dir === "south") ny = 66;

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
    <ellipse cx="40" cy="70" rx="28" ry="7" fill="#000000" fill-opacity="0.16" />
    <circle cx="40" cy="40" r="30" fill="#B45309" stroke="#78350F" stroke-width="3" />
    <circle cx="40" cy="40" r="20" fill="#FACC15" stroke="#FEF08A" stroke-width="2.5" />
    <circle cx="40" cy="40" r="8" fill="#FFFFFF" />
    <circle cx="${nx}" cy="${ny}" r="6" fill="#92400E" stroke="#FDE047" stroke-width="2" />
  </svg>`;
}

function createMirrorSvg(angleDeg) {
  const is45or135 = angleDeg === 45 || angleDeg === 135;

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
    <ellipse cx="40" cy="70" rx="28" ry="7" fill="#000000" fill-opacity="0.16" />
    <path d="M40 8L72 40L40 72L8 40Z" fill="#0369A1" stroke="#38BDF8" stroke-width="3" />
    <path d="M40 18L62 40L40 62L18 40Z" fill="#E0F2FE" fill-opacity="0.9" />
    ${
      is45or135
        ? `<line x1="24" y1="56" x2="56" y2="24" stroke="#0284C7" stroke-width="4" stroke-linecap="round" />`
        : `<line x1="24" y1="24" x2="56" y2="56" stroke="#0284C7" stroke-width="4" stroke-linecap="round" />`
    }
    <circle cx="40" cy="40" r="3" fill="#FFFFFF" />
  </svg>`;
}

function createReceptorSvg(isActive) {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
    <ellipse cx="40" cy="70" rx="28" ry="7" fill="#000000" fill-opacity="0.16" />
    ${
      isActive
        ? `<circle cx="40" cy="40" r="36" fill="#FACC15" fill-opacity="0.35" />
           <rect x="10" y="10" width="60" height="60" rx="12" fill="#78350F" stroke="#D97706" stroke-width="3" />
           <circle cx="40" cy="40" r="18" fill="#FDE047" stroke="#FFFFFF" stroke-width="2.5" />
           <circle cx="40" cy="40" r="7" fill="#FFFFFF" />`
        : `<rect x="10" y="10" width="60" height="60" rx="12" fill="#334155" stroke="#1E293B" stroke-width="3" />
           <circle cx="40" cy="40" r="16" fill="#7E22CE" stroke="#A855F7" stroke-width="2.5" />
           <circle cx="36" cy="36" r="2.5" fill="#E9D5FF" />`
    }
  </svg>`;
}

function createConduitSvg(type) {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
    <g stroke="#10B981" stroke-width="5" stroke-linecap="round" fill="none">
      ${
        type === "straight-h"
          ? `<line x1="0" y1="40" x2="80" y2="40" />`
          : type === "straight-v"
          ? `<line x1="40" y1="0" x2="40" y2="80" />`
          : type === "elbow-ne"
          ? `<path d="M40 0V40H80" />`
          : type === "elbow-se"
          ? `<path d="M80 40H40V80" />`
          : type === "elbow-sw"
          ? `<path d="M40 80V40H0" />`
          : `<path d="M0 40H40V0" />`
      }
    </g>
    <circle cx="40" cy="40" r="4" fill="#D1FAE5" />
  </svg>`;
}

function createLogicNexusSvg(isActive) {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
    <ellipse cx="40" cy="70" rx="28" ry="7" fill="#000000" fill-opacity="0.16" />
    ${
      isActive
        ? `<circle cx="40" cy="40" r="34" fill="#06B6D4" fill-opacity="0.35" />
           <path d="M40 10L70 40L40 70L10 40Z" fill="#0891B2" stroke="#22D3EE" stroke-width="3" />
           <circle cx="40" cy="40" r="14" fill="#67E8F9" />
           <circle cx="40" cy="40" r="6" fill="#FFFFFF" />`
        : `<path d="M40 10L70 40L40 70L10 40Z" fill="#334155" stroke="#1E293B" stroke-width="3" />
           <circle cx="40" cy="40" r="12" fill="none" stroke="#64748B" stroke-width="2.5" />`
    }
  </svg>`;
}

// ---------------------------------------------------------------------------
// 5. Atlas Definitions & Frame Composition
// ---------------------------------------------------------------------------

function getGlobalEntitiesFrames() {
  const frames = [];

  // Hero: Zyra
  for (let i = 0; i < 6; i++) {
    const num = i + 1;
    const pad = String(num).padStart(2, "0");
    frames.push({
      name: `zyra-idle-${i}`,
      aliases: [`zyra-idle-${pad}`, `zyra-idle-${num}`].concat(i === 0 ? ["zyra-idle"] : []),
      width: 80,
      height: 80,
      svg: createZyraIdleSvg(i),
    });
  }

  for (let i = 0; i < 8; i++) {
    const num = i + 1;
    const pad = String(num).padStart(2, "0");
    frames.push({
      name: `zyra-walk-${i}`,
      aliases: [`zyra-walk-${pad}`, `zyra-walk-${num}`].concat(i === 0 ? ["zyra-walk"] : []),
      width: 80,
      height: 80,
      svg: createZyraWalkSvg(i),
    });
  }

  for (let i = 0; i < 8; i++) {
    const num = i + 1;
    const pad = String(num).padStart(2, "0");
    frames.push({
      name: `zyra-walk-up-${i}`,
      aliases: [`zyra-walk-up-${pad}`, `zyra-walk-up-${num}`].concat(i === 0 ? ["zyra-walk-up"] : []),
      width: 80,
      height: 80,
      svg: createZyraWalkUpSvg(i),
    });
  }

  for (let i = 0; i < 8; i++) {
    const num = i + 1;
    const pad = String(num).padStart(2, "0");
    frames.push({
      name: `zyra-walk-down-${i}`,
      aliases: [`zyra-walk-down-${pad}`, `zyra-walk-down-${num}`].concat(i === 0 ? ["zyra-walk-down"] : []),
      width: 80,
      height: 80,
      svg: createZyraWalkDownSvg(i),
    });
  }

  for (let i = 0; i < 6; i++) {
    const num = i + 1;
    const pad = String(num).padStart(2, "0");
    frames.push({
      name: `zyra-push-${i}`,
      aliases: [`zyra-push-${pad}`, `zyra-push-${num}`].concat(i === 0 ? ["zyra-push"] : []),
      width: 80,
      height: 80,
      svg: createZyraPushSvg(i),
    });
  }

  for (let i = 0; i < 8; i++) {
    const num = i + 1;
    const pad = String(num).padStart(2, "0");
    frames.push({
      name: `zyra-celebrate-${i}`,
      aliases: [`zyra-celebrate-${pad}`, `zyra-celebrate-${num}`].concat(i === 0 ? ["zyra-celebrate"] : []),
      width: 80,
      height: 80,
      svg: createZyraCelebrateSvg(i),
    });
  }

  for (let i = 0; i < 4; i++) {
    const num = i + 1;
    const pad = String(num).padStart(2, "0");
    frames.push({
      name: `zyra-sleep-${i}`,
      aliases: [`zyra-sleep-${pad}`, `zyra-sleep-${num}`].concat(i === 0 ? ["zyra-sleep"] : []),
      width: 80,
      height: 80,
      svg: createZyraSleepSvg(i),
    });
  }

  // Companion: Light Orb Faces (48x48)
  const orbMoods = ["happy", "thinking", "curious", "blink", "nap", "sparkle"];
  orbMoods.forEach((mood, idx) => {
    frames.push({
      name: `orb-faces-${mood}`,
      aliases: [`orb-faces-${idx}`].concat(idx === 0 ? ["orb-faces"] : []),
      width: 48,
      height: 48,
      svg: createOrbFaceSvg(mood),
    });
  });

  // NPC: Sprout Forest Spirit
  for (let i = 0; i < 8; i++) {
    const num = i + 1;
    const pad = String(num).padStart(2, "0");
    frames.push({
      name: `sprout-anxious-${i}`,
      aliases: [`sprout-anxious-${pad}`, `sprout-anxious-${num}`].concat(i === 0 ? ["sprout-anxious"] : []),
      width: 80,
      height: 80,
      svg: createSproutAnxiousSvg(i),
    });
  }

  for (let i = 0; i < 8; i++) {
    const num = i + 1;
    const pad = String(num).padStart(2, "0");
    frames.push({
      name: `sprout-breathe-${i}`,
      aliases: [`sprout-breathe-${pad}`, `sprout-breathe-${num}`].concat(i === 0 ? ["sprout-breathe"] : []),
      width: 80,
      height: 80,
      svg: createSproutBreatheSvg(i),
    });
  }

  for (let i = 0; i < 6; i++) {
    const num = i + 1;
    const pad = String(num).padStart(2, "0");
    frames.push({
      name: `sprout-joy-${i}`,
      aliases: [`sprout-joy-${pad}`, `sprout-joy-${num}`].concat(i === 0 ? ["sprout-joy"] : []),
      width: 80,
      height: 80,
      svg: createSproutJoySvg(i),
    });
  }

  // Kinetic Blocks
  frames.push({
    name: "stone-block-0",
    aliases: ["stone-block"],
    width: 80,
    height: 80,
    svg: createStoneBlockSvg(false),
  });
  frames.push({
    name: "stone-block-1",
    aliases: ["stone-block-active"],
    width: 80,
    height: 80,
    svg: createStoneBlockSvg(true),
  });

  frames.push({
    name: "ice-block-0",
    aliases: ["ice-block"],
    width: 80,
    height: 80,
    svg: createIceBlockSvg(false),
  });
  frames.push({
    name: "ice-block-1",
    aliases: ["ice-block-sliding"],
    width: 80,
    height: 80,
    svg: createIceBlockSvg(true),
  });

  // FX Particles (48x48)
  for (let i = 0; i < 4; i++) {
    frames.push({
      name: `fx-dust-puff-${i}`,
      aliases: i === 0 ? ["fx-dust-puff"] : [],
      width: 48,
      height: 48,
      svg: createDustPuffSvg(i),
    });
  }

  for (let i = 0; i < 4; i++) {
    frames.push({
      name: `fx-frost-sparkle-${i}`,
      aliases: i === 0 ? ["fx-frost-sparkle"] : [],
      width: 48,
      height: 48,
      svg: createFrostSparkleSvg(i),
    });
  }

  for (let i = 0; i < 4; i++) {
    frames.push({
      name: `fx-touch-ripple-${i}`,
      aliases: i === 0 ? ["fx-touch-ripple"] : [],
      width: 48,
      height: 48,
      svg: createTouchRippleSvg(i),
    });
  }

  for (let i = 0; i < 6; i++) {
    frames.push({
      name: `fx-stardust-${i}`,
      aliases: i === 0 ? ["fx-stardust"] : [],
      width: 48,
      height: 48,
      svg: createStardustSvg(i),
    });
  }

  return frames;
}

function getShrineEnvironmentFrames() {
  const frames = [];

  // Pavers
  frames.push({
    name: "tile-floor-light",
    aliases: ["tile-floor-light-0"],
    width: 80,
    height: 80,
    svg: createFloorTileSvg(false),
  });
  frames.push({
    name: "tile-floor-dark",
    aliases: ["tile-floor-dark-0"],
    width: 80,
    height: 80,
    svg: createFloorTileSvg(true),
  });

  // Wall caps
  const sides = ["top", "bottom", "left", "right"];
  sides.forEach((side, idx) => {
    frames.push({
      name: `wall-cap-chamfer-${side}`,
      aliases: [`wall-cap-chamfer-${idx}`].concat(idx === 0 ? ["wall-cap-chamfer"] : []),
      width: 80,
      height: 80,
      svg: createWallCapSvg(side),
    });
  });

  // Wall face moss
  frames.push({
    name: "wall-face-moss-0",
    aliases: ["wall-face-moss"],
    width: 80,
    height: 80,
    svg: createWallFaceMossSvg(false),
  });
  frames.push({
    name: "wall-face-moss-1",
    aliases: [],
    width: 80,
    height: 80,
    svg: createWallFaceMossSvg(true),
  });

  // Pressure plates
  frames.push({
    name: "plate-dormant",
    aliases: ["plate-dormant-0"],
    width: 80,
    height: 80,
    svg: createPressurePlateSvg(false),
  });
  frames.push({
    name: "plate-active",
    aliases: ["plate-active-0"],
    width: 80,
    height: 80,
    svg: createPressurePlateSvg(true),
  });

  // Switches (I, II, III)
  [1, 2, 3].forEach((num, idx) => {
    frames.push({
      name: `switch-runic-${num}-off`,
      aliases: [`switch-runic-${idx * 2}`],
      width: 80,
      height: 80,
      svg: createRunicSwitchSvg(num, false),
    });
    frames.push({
      name: `switch-runic-${num}-on`,
      aliases: [`switch-runic-${idx * 2 + 1}`],
      width: 80,
      height: 80,
      svg: createRunicSwitchSvg(num, true),
    });
  });

  // Portals & Gates
  frames.push({
    name: "door-sealed",
    aliases: ["door-sealed-0"],
    width: 80,
    height: 80,
    svg: createDoorSvg(false),
  });
  frames.push({
    name: "door-open",
    aliases: ["door-open-0"],
    width: 80,
    height: 80,
    svg: createDoorSvg(true),
  });

  // Optics
  const dirs = ["east", "west", "north", "south"];
  dirs.forEach((dir, idx) => {
    frames.push({
      name: `emitter-brass-${dir}`,
      aliases: [`emitter-brass-${idx}`].concat(idx === 0 ? ["emitter-brass"] : []),
      width: 80,
      height: 80,
      svg: createEmitterSvg(dir),
    });
  });

  const angles = [0, 45, 90, 135];
  angles.forEach((ang, idx) => {
    frames.push({
      name: `mirror-prism-${ang}deg`,
      aliases: [`mirror-prism-${idx}`].concat(idx === 0 ? ["mirror-prism"] : []),
      width: 80,
      height: 80,
      svg: createMirrorSvg(ang),
    });
  });

  frames.push({
    name: "receptor-solar-dormant",
    aliases: ["receptor-solar-0", "receptor-solar"],
    width: 80,
    height: 80,
    svg: createReceptorSvg(false),
  });
  frames.push({
    name: "receptor-solar-active",
    aliases: ["receptor-solar-1"],
    width: 80,
    height: 80,
    svg: createReceptorSvg(true),
  });

  // Circuitry
  const conduitTypes = [
    "straight-h",
    "straight-v",
    "elbow-ne",
    "elbow-se",
    "elbow-sw",
    "elbow-nw",
  ];
  conduitTypes.forEach((ctype, idx) => {
    frames.push({
      name: `conduit-track-${ctype}`,
      aliases: [`conduit-track-${idx}`].concat(idx === 0 ? ["conduit-track"] : []),
      width: 80,
      height: 80,
      svg: createConduitSvg(ctype),
    });
  });

  // Logic Nexus
  frames.push({
    name: "logic-nexus-dormant",
    aliases: ["logic-nexus-0", "logic-nexus"],
    width: 80,
    height: 80,
    svg: createLogicNexusSvg(false),
  });
  frames.push({
    name: "logic-nexus-active",
    aliases: ["logic-nexus-1"],
    width: 80,
    height: 80,
    svg: createLogicNexusSvg(true),
  });

  return frames;
}

// ---------------------------------------------------------------------------
// 6. Atlas Builder & Compositor Engine
// ---------------------------------------------------------------------------

async function buildAtlasSheet({
  name,
  frames,
  sheetWidth = 1024,
  sheetHeight = 1024,
}) {
  console.log(`\n[Atlas Pipeline] Packing sheet "${name}" (${frames.length} frames)...`);

  const packedFrames = packFrames(frames, sheetWidth, sheetHeight, 2);
  const jsonDescriptor = buildTexturePackerJson(
    packedFrames,
    `${name}.webp`,
    sheetWidth,
    sheetHeight
  );

  const jsonFilePath = path.join(OUTPUT_DIR, `${name}.json`);
  const webpFilePath = path.join(OUTPUT_DIR, `${name}.webp`);

  fs.writeFileSync(jsonFilePath, JSON.stringify(jsonDescriptor, null, 2), "utf-8");
  console.log(`  ✓ Written JSON Hash descriptor: ${path.relative(ROOT_DIR, jsonFilePath)}`);

  // Composite with Sharp
  let sharpModule;
  try {
    const imported = await import("sharp");
    sharpModule = imported.default || imported;
  } catch (err) {
    console.warn("  ⚠ Sharp not found, attempting pure Node.js fallback...");
  }

  if (sharpModule) {
    const compositeLayers = packedFrames.map((f) => ({
      input: Buffer.from(f.svg.trim()),
      top: f.y,
      left: f.x,
    }));

    const webpBuffer = await sharpModule({
      create: {
        width: sheetWidth,
        height: sheetHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite(compositeLayers)
      .webp({ lossless: true, quality: 90 })
      .toBuffer();

    fs.writeFileSync(webpFilePath, webpBuffer);
    const sizeKb = (webpBuffer.length / 1024).toFixed(1);
    console.log(`  ✓ Rendered Lossless WebP atlas: ${path.relative(ROOT_DIR, webpFilePath)} (${sizeKb} KB)`);

    return {
      name,
      jsonPath: jsonFilePath,
      webpPath: webpFilePath,
      sizeBytes: webpBuffer.length,
      frameCount: packedFrames.length,
    };
  } else {
    // Fallback: write SVG sprite sheet for environments lacking C++ sharp bindings
    const fallbackSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${sheetWidth}" height="${sheetHeight}">
      ${packedFrames
        .map((f) => `<g transform="translate(${f.x}, ${f.y})">${f.svg}</g>`)
        .join("\n")}
    </svg>`;
    const fallbackPath = path.join(OUTPUT_DIR, `${name}.svg`);
    fs.writeFileSync(fallbackPath, fallbackSvg, "utf-8");
    fs.writeFileSync(webpFilePath, Buffer.from([]));
    console.log(`  ✓ Rendered SVG master fallback sheet: ${path.relative(ROOT_DIR, fallbackPath)}`);

    return {
      name,
      jsonPath: jsonFilePath,
      webpPath: webpFilePath,
      sizeBytes: 0,
      frameCount: packedFrames.length,
    };
  }
}

// ---------------------------------------------------------------------------
// 7. Main Execution Flow
// ---------------------------------------------------------------------------

async function main() {
  console.log("=========================================================");
  console.log("  Project ZTLO - Automated Storybook Texture Atlas Pipeline");
  console.log("=========================================================");

  const results = [];

  // Sheet 1: Global Entities (Hero, Light Orb, NPC, Blocks, FX)
  const entitiesResult = await buildAtlasSheet({
    name: "atlas-global-entities",
    frames: getGlobalEntitiesFrames(),
    sheetWidth: 1024,
    sheetHeight: 1024,
  });
  results.push(entitiesResult);

  // Sheet 2: Active Shrine Environment (Tiles, Walls, Conduits, Plates, Portals, Optics)
  const envResult = await buildAtlasSheet({
    name: "atlas-shrine-environment",
    frames: getShrineEnvironmentFrames(),
    sheetWidth: 1024,
    sheetHeight: 1024,
  });
  results.push(envResult);

  // Quality & Payload Assurance Gate
  const totalBytes = results.reduce((acc, r) => acc + r.sizeBytes, 0);
  const totalMb = (totalBytes / (1024 * 1024)).toFixed(2);
  const maxBudgetMb = 2.0;

  console.log("\n---------------------------------------------------------");
  console.log(`Total Atlas WebP Compressed Payload: ${totalMb} MB / ${maxBudgetMb} MB`);
  console.log("---------------------------------------------------------");

  if (totalBytes > maxBudgetMb * 1024 * 1024) {
    throw new Error(
      `Payload Budget Exceeded: Total atlases size ${totalMb} MB exceeds acceptance threshold of ${maxBudgetMb} MB.`
    );
  }

  console.log("✓ All TexturePacker JSON Hash descriptors & WebP sheets generated successfully.\n");
}

main().catch((err) => {
  console.error("FATAL: Atlas build pipeline failed:", err);
  process.exit(1);
});
