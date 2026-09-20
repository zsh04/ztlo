import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export interface EducationalTelemetryEvent {
  sessionId: string;
  roomId: string;
  sessionDurationMs: number;
  touches: number;
  hintsCount: number;
  undoCount: number;
  completed: boolean;
  timestamp?: string;
}

const FORBIDDEN_PII_KEYS = [
  "email",
  "name",
  "username",
  "fullname",
  "firstname",
  "lastname",
  "phone",
  "phonenumber",
  "ip",
  "ipaddress",
  "address",
  "dob",
  "birthdate",
  "age",
  "gender",
  "location",
  "coords",
  "gps",
  "school",
];

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();

    if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
      return NextResponse.json(
        { error: "Invalid payload: Request body must be a JSON object" },
        { status: 400 }
      );
    }

    // Check for forbidden PII keys
    const lowerKeys = Object.keys(rawBody).map((k) => k.toLowerCase());
    for (const forbidden of FORBIDDEN_PII_KEYS) {
      if (lowerKeys.includes(forbidden)) {
        return NextResponse.json(
          {
            error: "Pediatric Privacy Violation: Payload contains forbidden PII field",
            field: forbidden,
          },
          { status: 400 }
        );
      }
    }

    // Inspect values for accidental PII leaks (e.g. emails in string fields)
    for (const [key, value] of Object.entries(rawBody)) {
      if (typeof value === "string") {
        if (EMAIL_REGEX.test(value)) {
          return NextResponse.json(
            { error: `Pediatric Privacy Violation: Value in '${key}' resembles an email address` },
            { status: 400 }
          );
        }
        if (PHONE_REGEX.test(value)) {
          return NextResponse.json(
            { error: `Pediatric Privacy Violation: Value in '${key}' resembles a phone number` },
            { status: 400 }
          );
        }
      }
    }

    const {
      sessionId,
      roomId,
      sessionDurationMs,
      touches,
      hintsCount,
      undoCount,
      completed,
    } = rawBody as Record<string, unknown>;

    // Validate required fields
    if (typeof sessionId !== "string" || sessionId.trim().length === 0) {
      return NextResponse.json(
        { error: "Invalid payload: sessionId must be a non-empty string" },
        { status: 400 }
      );
    }

    if (typeof roomId !== "string" || roomId.trim().length === 0) {
      return NextResponse.json(
        { error: "Invalid payload: roomId must be a non-empty string" },
        { status: 400 }
      );
    }

    if (
      typeof sessionDurationMs !== "number" ||
      !Number.isFinite(sessionDurationMs) ||
      sessionDurationMs < 0
    ) {
      return NextResponse.json(
        { error: "Invalid payload: sessionDurationMs must be a non-negative number" },
        { status: 400 }
      );
    }

    if (
      typeof touches !== "number" ||
      !Number.isFinite(touches) ||
      touches < 0 ||
      !Number.isInteger(touches)
    ) {
      return NextResponse.json(
        { error: "Invalid payload: touches must be a non-negative integer" },
        { status: 400 }
      );
    }

    if (
      typeof hintsCount !== "number" ||
      !Number.isFinite(hintsCount) ||
      hintsCount < 0 ||
      !Number.isInteger(hintsCount)
    ) {
      return NextResponse.json(
        { error: "Invalid payload: hintsCount must be a non-negative integer" },
        { status: 400 }
      );
    }

    if (
      typeof undoCount !== "number" ||
      !Number.isFinite(undoCount) ||
      undoCount < 0 ||
      !Number.isInteger(undoCount)
    ) {
      return NextResponse.json(
        { error: "Invalid payload: undoCount must be a non-negative integer" },
        { status: 400 }
      );
    }

    if (typeof completed !== "boolean") {
      return NextResponse.json(
        { error: "Invalid payload: completed must be a boolean" },
        { status: 400 }
      );
    }

    // Sanitized record ready for analytics pipeline (zero PII)
    const telemetryEvent: EducationalTelemetryEvent = {
      sessionId,
      roomId,
      sessionDurationMs,
      touches,
      hintsCount,
      undoCount,
      completed,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        recorded: true,
        data: {
          sessionId: telemetryEvent.sessionId,
          roomId: telemetryEvent.roomId,
          completed: telemetryEvent.completed,
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "Malformed JSON payload" },
      { status: 400 }
    );
  }
}
