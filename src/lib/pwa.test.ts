import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";

import { middleware, config } from "../middleware";

test("PWA Service Worker: public/sw.js configures precache and CacheStorage strategies", () => {
  const swPath = path.resolve(__dirname, "../../public/sw.js");
  assert.ok(fs.existsSync(swPath), "public/sw.js must exist");

  const swContent = fs.readFileSync(swPath, "utf-8");

  // Validate Cache Name
  assert.ok(swContent.includes("ztlo-v1-static"), "SW must define cache name 'ztlo-v1-static'");

  // Validate Precaching of Core Assets
  assert.ok(swContent.includes("'/'"), "Must precache root route");
  assert.ok(swContent.includes("'/favicon.svg'"), "Must precache favicon.svg");
  assert.ok(swContent.includes("'/manifest.json'"), "Must precache manifest.json");
  assert.ok(swContent.includes("'/journeys.html'"), "Must precache journeys.html");

  // Validate Lifecycle Event Listeners
  assert.ok(swContent.includes("addEventListener('install'"), "Must handle install event");
  assert.ok(swContent.includes("addEventListener('activate'"), "Must handle activate event");
  assert.ok(swContent.includes("addEventListener('fetch'"), "Must handle fetch event");

  // Validate Offline Fallback and Cache-first strategies
  assert.ok(swContent.includes("skipWaiting()"), "Must skipWaiting during install");
  assert.ok(swContent.includes("clients.claim()"), "Must claim clients on activate");
  assert.ok(swContent.includes("caches.match"), "Must use caches.match");
  assert.ok(swContent.includes("navigate"), "Must handle navigation requests with offline fallback");
});

test("Next.js Edge Middleware: injects Content-Security-Policy & Cross-Origin Isolation headers", () => {
  const req = new NextRequest("http://localhost:3000/");
  const res = middleware(req);

  // Cross-Origin Isolation (WebGPU / SharedArrayBuffer)
  assert.equal(res.headers.get("Cross-Origin-Opener-Policy"), "same-origin");
  assert.equal(res.headers.get("Cross-Origin-Embedder-Policy"), "credentialless");

  // Enterprise Security Headers
  assert.equal(res.headers.get("X-Content-Type-Options"), "nosniff");
  assert.equal(res.headers.get("X-Frame-Options"), "DENY");
  assert.equal(res.headers.get("Referrer-Policy"), "strict-origin-when-cross-origin");

  // Content-Security-Policy
  const csp = res.headers.get("Content-Security-Policy");
  assert.ok(csp, "CSP header must be present");

  assert.ok(csp.includes("default-src 'self'"), "CSP contains default-src");
  assert.ok(csp.includes("script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net"), "CSP allows required script-src");
  assert.ok(csp.includes("worker-src 'self' blob:"), "CSP allows worker-src for Web Workers");
  assert.ok(csp.includes("connect-src 'self' https://huggingface.co https://raw.githubusercontent.com blob: data:"), "CSP allows HuggingFace model download");
  assert.ok(csp.includes("img-src 'self' data: blob:"), "CSP allows img-src data/blob");
});

test("Next.js Edge Middleware: config matcher excludes static assets", () => {
  assert.ok(Array.isArray(config.matcher));
  assert.ok(config.matcher.length > 0);
  assert.ok(config.matcher[0].includes("!_next/static"));
});
