import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: "0.1.0",
    engine: {
      phaser: "ready",
      ecs: "ready",
      webgpu: "supported",
      webllm: "initialized",
    },
  });
}
