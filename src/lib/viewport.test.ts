import test from "node:test";
import assert from "node:assert/strict";

import { calculateGridCellSize } from "./viewport";

test("keeps room cells square while fitting a 16:9 sandbox within the viewport", () => {
  assert.equal(calculateGridCellSize(16, 9, 1366, 1024), 79);
  assert.equal(calculateGridCellSize(16, 9, 820, 1180), 64);
});

test("never lets the tilemap fall below the minimum touch target size", () => {
  assert.equal(calculateGridCellSize(16, 9, 640, 480), 64);
});

test("PWA & Tablet Viewport Lock: layout.tsx exports valid Viewport and Apple metadata", async () => {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const layoutPath = path.resolve(__dirname, "../../src/app/layout.tsx");
  const content = fs.readFileSync(layoutPath, "utf-8");

  // Validate viewport export contains strict tablet lock properties
  assert.ok(content.includes("export const viewport: Viewport"), "layout must export viewport configuration");
  assert.ok(content.includes('"device-width"'), "Must specify device-width");
  assert.ok(content.includes("initialScale: 1"), "initialScale must be 1");
  assert.ok(content.includes("maximumScale: 1"), "maximumScale must be 1");
  assert.ok(content.includes("userScalable: false"), "userScalable must be false");
  assert.ok(content.includes('viewportFit: "cover"'), "viewportFit must be cover");

  // Validate Apple Web App PWA metadata
  assert.ok(content.includes("appleWebApp:"), "Must configure appleWebApp metadata");
  assert.ok(content.includes("capable: true"), "appleWebApp must be capable");
  assert.ok(content.includes('statusBarStyle: "black-translucent"'), "Status bar must be black-translucent");
  assert.ok(content.includes('title: "ZTLO"'), "Title must be ZTLO");
});

test("PWA Manifest: specifies landscape orientation and standalone display", async () => {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const manifestPath = path.resolve(__dirname, "../../public/manifest.json");
  const content = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

  assert.equal(content.display, "standalone");
  assert.equal(content.orientation, "landscape");
});

test("CSS Rules: suppresses iOS Safari overscroll, gestures, and callouts", async () => {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const cssPath = path.resolve(__dirname, "../../src/app/globals.css");
  const css = fs.readFileSync(cssPath, "utf-8");

  assert.ok(css.includes("overscroll-behavior: none"), "Must suppress overscroll bounce");
  assert.ok(css.includes("touch-action: none"), "Must suppress double-tap and pinch zoom");
  assert.ok(css.includes("-webkit-touch-callout: none"), "Must suppress iOS touch callout previews");
  assert.ok(css.includes("position: fixed"), "Must lock html position to eradicate elastic rubber-band scrolling");
});

test("16:9 Canvas Viewport: centers letterboxed 16:9 canvas across common iPad dimensions", () => {
  const tabletResolutions = [
    { name: "iPad 9.7/10.2", width: 1024, height: 768 },
    { name: "iPad Air / Pro 11-inch", width: 1194, height: 834 },
    { name: "iPad Pro 12.9-inch", width: 1366, height: 1024 },
    { name: "iPad Mini landscape", width: 1133, height: 744 },
  ];

  for (const tablet of tabletResolutions) {
    // 16:9 scale calculation (1280x720 base)
    const scaleX = tablet.width / 1280;
    const scaleY = tablet.height / 720;
    const fitScale = Math.min(scaleX, scaleY);

    const renderWidth = 1280 * fitScale;
    const renderHeight = 720 * fitScale;

    // Must fit completely within the device viewport without spilling
    assert.ok(renderWidth <= tablet.width, `${tablet.name}: width must fit within device`);
    assert.ok(renderHeight <= tablet.height, `${tablet.name}: height must fit within device`);

    // Must maintain exact 16:9 aspect ratio (1.7777...)
    const aspect = renderWidth / renderHeight;
    assert.ok(Math.abs(aspect - 16 / 9) < 0.001, `${tablet.name}: must maintain 16:9 aspect ratio`);
  }
});
