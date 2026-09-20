import http from "node:http";
import { spawn } from "node:child_process";
import fs from "node:fs";

async function run() {
  console.log("=== Starting Automated E2E Gameplay Test for ZTLO ===");

  const chromeProcess = spawn(
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    [
      "--headless=new",
      "--remote-debugging-port=9222",
      "--window-size=1280,800",
      "about:blank",
    ],
    { stdio: "ignore" }
  );

  // Wait for Chrome to listen on 9222
  let version = null;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 200));
    try {
      const res = await fetch("http://127.0.0.1:9222/json/version");
      version = await res.json();
      if (version) break;
    } catch (e) {}
  }

  if (!version) {
    console.error("Failed to connect to Chrome remote debugger");
    chromeProcess.kill();
    process.exit(1);
  }

  const listRes = await fetch("http://127.0.0.1:9222/json/list");
  const tabs = await listRes.json();
  const tab = tabs.find((t) => t.type === "page") || tabs[0];
  const ws = new WebSocket(tab.webSocketDebuggerUrl);

  let id = 1;
  const pending = new Map();
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve } = pending.get(msg.id);
      pending.delete(msg.id);
      resolve(msg.result);
    }
    if (msg.method === "Runtime.consoleAPICalled") {
      const text = msg.params.args.map((a) => a.value ?? JSON.stringify(a)).join(" ");
      console.log(`[BROWSER CONSOLE ${msg.params.type}]`, text);
    }
    if (msg.method === "Runtime.exceptionThrown") {
      console.error("[BROWSER EXCEPTION]", msg.params.exceptionDetails);
    }
  };

  await new Promise((resolve) => (ws.onopen = resolve));

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Network.enable");
  await send("Network.setCacheDisabled", { cacheDisabled: true });
  await send("Network.clearBrowserCache");
  await send("Page.navigate", { url: "http://localhost:3000" });

  console.log("Resetting localStorage for fresh daylight session...");
  await new Promise((r) => setTimeout(r, 1000));
  await send("Runtime.evaluate", {
    expression: `(() => {
      localStorage.clear();
      location.reload();
    })()`,
  });

  console.log("Waiting 3s for game engine initialization...");
  await new Promise((r) => setTimeout(r, 3000));

  // Get canvas bounding box and layout metrics
  const layoutInfo = await send("Runtime.evaluate", {
    expression: `(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      return {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        canvasW: canvas.width,
        canvasH: canvas.height
      };
    })()`,
    returnByValue: true,
  });

  const canvasBox = layoutInfo.result?.value;
  console.log("Canvas Box in DOM:", canvasBox);

  // Layout calculation for 8x6 room in 1280x720 canvas:
  // padding = 120, maxCellW = floor(1160/8)=145, maxCellH = floor(600/6)=100 -> tileSize = 100
  // totalWidth = 800, totalHeight = 600
  // gridOffsetX = 240, gridOffsetY = 60
  function getClientCoords(gridX, gridY) {
    const tileSize = 100;
    const gridOffsetX = 240;
    const gridOffsetY = 60;
    const canvasPixelX = gridOffsetX + (gridX + 0.5) * tileSize;
    const canvasPixelY = gridOffsetY + (gridY + 0.5) * tileSize;
    const scaleX = canvasBox.width / canvasBox.canvasW;
    const scaleY = canvasBox.height / canvasBox.canvasH;
    return {
      x: canvasBox.left + canvasPixelX * scaleX,
      y: canvasBox.top + canvasPixelY * scaleY,
    };
  }

  async function tapGrid(gridX, gridY, label) {
    const { x, y } = getClientCoords(gridX, gridY);
    const topElem = await send("Runtime.evaluate", {
      expression: `(() => {
        const el = document.elementFromPoint(${x}, ${y});
        return el ? { tagName: el.tagName, className: el.className, id: el.id } : null;
      })()`,
      returnByValue: true,
    });
    console.log(`[ACTION] Tapping (${gridX}, ${gridY}) [${label}] at screen (${x.toFixed(1)}, ${y.toFixed(1)}). Top Element:`, topElem.result?.value);

    await send("Input.dispatchMouseEvent", {
      type: "mousePressed",
      x,
      y,
      button: "left",
      clickCount: 1,
    });
    await new Promise((r) => setTimeout(r, 50));
    await send("Input.dispatchMouseEvent", {
      type: "mouseReleased",
      x,
      y,
      button: "left",
    });
  }

  async function captureStep(filename, description) {
    console.log(`Capturing: ${description}...`);
    const screenshot = await send("Page.captureScreenshot", { format: "png" });
    if (screenshot?.data) {
      fs.writeFileSync(filename, Buffer.from(screenshot.data, "base64"));
      console.log(`Saved screenshot to ${filename}`);
    }
  }

  // STEP 1: Initial state screenshot
  await captureStep("/tmp/e2e_step1_initial.png", "Step 1: Initial Room Setup");

  // STEP 2: Move Zyra to (2, 2) adjacent to stone at (3, 2)
  console.log("\n--- Moving Zyra toward Stone Block ---");
  await tapGrid(2, 2, "Adjacent open tile");
  await new Promise((r) => setTimeout(r, 800)); // Allow pathfinding animation
  await captureStep("/tmp/e2e_step2_moved_zyra.png", "Step 2: Zyra at (2,2)");

  // STEP 3: Push stone from (3,2) to (4,2)
  console.log("\n--- First Stone Push (3,2) -> (4,2) ---");
  await tapGrid(3, 2, "Tap stone block");
  await new Promise((r) => setTimeout(r, 800));
  await captureStep("/tmp/e2e_step3_push1.png", "Step 3: Stone at (4,2)");

  // STEP 4: Push stone from (4,2) to (5,2)
  console.log("\n--- Second Stone Push (4,2) -> (5,2) ---");
  await tapGrid(4, 2, "Tap stone block");
  await new Promise((r) => setTimeout(r, 800));
  await captureStep("/tmp/e2e_step4_push2.png", "Step 4: Stone at (5,2)");

  // STEP 5: Push stone from (5,2) to (6,2) (Pressure Plate!)
  console.log("\n--- Third Stone Push (5,2) -> (6,2) onto Pressure Plate ---");
  await tapGrid(5, 2, "Tap stone block onto plate");
  await new Promise((r) => setTimeout(r, 800));
  await captureStep("/tmp/e2e_step5_plate_activated.png", "Step 5: Stone on Plate, Door Unsealed");

  // Inspect current game state via React/DOM
  const hudObjective = await send("Runtime.evaluate", {
    expression: `document.querySelector('.text-storybook-dark') ? document.querySelector('.text-storybook-dark').innerText : ''`,
    returnByValue: true,
  });
  console.log("HUD Objective text:", hudObjective.result?.value);

  // STEP 6: Step through the door at (7,2) to complete level
  console.log("\n--- Stepping to / through unsealed door at (7,2) ---");
  await tapGrid(7, 2, "Tap unsealed door");
  await new Promise((r) => setTimeout(r, 1200));
  await captureStep("/tmp/e2e_step6_next_level.png", "Step 6: Level Cleared & Shrine 01 Advanced");

  // Check HUD after level clear
  const newHud = await send("Runtime.evaluate", {
    expression: `(() => {
      const heading = document.querySelector('h1, h2, h3, .tracking-wider');
      const body = document.querySelector('.text-storybook-dark, .font-medium');
      return {
        title: heading ? heading.innerText : '',
        body: body ? body.innerText : ''
      };
    })()`,
    returnByValue: true,
  });
  console.log("HUD after door step:", newHud.result?.value);

  console.log("\n=== E2E Test Completed Successfully ===");
  ws.close();
  chromeProcess.kill();
  process.exit(0);
}

run().catch((err) => {
  console.error("E2E Test failed:", err);
  process.exit(1);
});
