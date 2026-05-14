import OpenAI from "openai";

// ─── Groq-only AI client ──────────────────────────────────────────────────────
// Supports multiple keys for round-robin rotation:
//   GROQ_API_KEY=key1,key2,key3   (comma-separated)
//   GROQ_API_KEY_1 / GROQ_API_KEY_2 ... GROQ_API_KEY_10  (numbered vars)

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

function collectGroqKeys(): string[] {
  const keys: string[] = [];
  const raw = process.env.GROQ_API_KEY;
  if (raw) keys.push(...raw.split(",").map((k) => k.trim()).filter(Boolean));
  for (let i = 1; i <= 10; i++) {
    const k = process.env[`GROQ_API_KEY_${i}`]?.trim();
    if (k && !keys.includes(k)) keys.push(k);
  }
  return keys;
}

const groqKeys = collectGroqKeys();

if (groqKeys.length === 0) {
  throw new Error(
    "GROQ_API_KEY is required but not set.\n" +
      "  Get a free key at https://console.groq.com/keys\n" +
      "  Tip: paste multiple keys comma-separated (GROQ_API_KEY=key1,key2) for automatic rotation.",
  );
}

// ─── Client Pool ──────────────────────────────────────────────────────────────

const clients: OpenAI[] = groqKeys.map(
  (key) => new OpenAI({ apiKey: key, baseURL: GROQ_BASE_URL }),
);

let _counter = 0;

/**
 * Returns the next client in the round-robin rotation.
 * Call getClient(true) on a 429 to skip immediately to the next key.
 */
export function getClient(skip = false): OpenAI {
  if (skip) _counter = (_counter + 1) % clients.length;
  const client = clients[_counter % clients.length];
  _counter = (_counter + 1) % clients.length;
  return client;
}

/** Legacy single-client export — points to first client. */
export const openai = clients[0];

/** Model used for all AI requests. */
export const AI_MODEL = "llama-3.3-70b-versatile";

/** How many Groq keys are loaded (useful for health checks). */
export const AI_KEY_COUNT = clients.length;
