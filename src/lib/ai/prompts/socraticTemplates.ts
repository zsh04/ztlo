import { SerializedRoomState } from "./stateSerializer";

/**
 * Strict pedagogical rules for 6-year-old explorer Zyra.
 * Prohibits giving imperative solutions, coordinates, or spoiling puzzle mechanics.
 */
export const PROHIBITED_IMPERATIVE_SPOILERS = [
  "push the block onto",
  "push the block to",
  "push the stone onto",
  "push the stone to",
  "move the stone to",
  "slide the ice onto",
  "you must push",
  "put the block on",
  "put the block onto",
  "you need to",
  "go to coordinates",
];

export const SOCRATIC_CORE_INSTRUCTIONS =
  "You are the Light Orb, a gentle, friendly companion for a 6-year-old explorer named Zyra. You never give direct orders or spoil answers. You ask curious, gentle scaffolding questions under 20 words to guide her thinking.";

/**
 * Constructs the system prompt dynamically injecting room context and guardrails.
 */
export function buildSocraticSystemPrompt(options?: {
  roomName?: string;
  objective?: string;
  serializedState?: SerializedRoomState | string;
}): string {
  let base = SOCRATIC_CORE_INSTRUCTIONS;

  if (options?.roomName || options?.objective) {
    base += `\nCurrent Room: ${options.roomName || "Ancient Shrine"}. Goal: ${options.objective || "Explore together"}.`;
  }

  base += "\nRules: Maximum 20 words. No imperative commands. Inspire Zyra to observe and experiment.";
  return base;
}

/**
 * Constructs the dynamic user prompt injecting live serialized ECS state.
 */
export function buildSocraticUserPrompt(options: {
  serializedState: SerializedRoomState | string;
  userQuery?: string;
  chipId?: string;
}): string {
  const stateStr =
    typeof options.serializedState === "string"
      ? options.serializedState
      : options.serializedState.rawText;

  if (options.userQuery) {
    return `[Chamber State: ${stateStr}] Zyra asks: "${options.userQuery}". Reply with a gentle Socratic clue under 20 words.`;
  }

  if (options.chipId) {
    return `[Chamber State: ${stateStr}] Zyra selected inquiry: "${options.chipId}". Reply with a gentle Socratic observation under 20 words.`;
  }

  return `[Chamber State: ${stateStr}] Zyra paused to observe. Ask a curious question about what she notices under 20 words.`;
}

/**
 * Verifies that a generated response contains no prohibited imperative spoilers.
 */
export function containsImperativeSpoiler(text: string): boolean {
  const lower = text.toLowerCase();
  return PROHIBITED_IMPERATIVE_SPOILERS.some((phrase) => lower.includes(phrase));
}

/**
 * Runtime guardrail: filters generated text and applies gentle fallback if spoilers are detected.
 */
export function sanitizeSocraticResponse(
  generatedText: string,
  fallbackText: string = "Look around the room together with me! What do you notice?"
): string {
  if (!generatedText || containsImperativeSpoiler(generatedText)) {
    return fallbackText;
  }
  return generatedText.trim().replace(/^["']|["']$/g, "");
}
