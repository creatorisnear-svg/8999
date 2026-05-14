import OpenAI from "openai";

// ─── Provider config ──────────────────────────────────────────────────────────
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const GROQ_MODEL = "llama-3.3-70b-versatile";

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/";
const GEMINI_MODEL = "gemini-2.0-flash";

// ─── Key collection helpers ───────────────────────────────────────────────────
function collectKeys(envName: string): string[] {
  const keys: string[] = [];
  const raw = process.env[envName];
  if (raw) keys.push(...raw.split(",").map((k) => k.trim()).filter(Boolean));
  for (let i = 1; i <= 10; i++) {
    const k = process.env[`${envName}_${i}`]?.trim();
    if (k && !keys.includes(k)) keys.push(k);
  }
  return keys;
}

// ─── Build combined pool ──────────────────────────────────────────────────────
// Each entry carries the client + the correct model for that provider.

export type PoolEntry = { client: OpenAI; model: string };

const pool: PoolEntry[] = [];

for (const key of collectKeys("GROQ_API_KEY")) {
  pool.push({
    client: new OpenAI({ apiKey: key, baseURL: GROQ_BASE_URL }),
    model: GROQ_MODEL,
  });
}

for (const key of collectKeys("GEMINI_API_KEY")) {
  pool.push({
    client: new OpenAI({ apiKey: key, baseURL: GEMINI_BASE_URL }),
    model: GEMINI_MODEL,
  });
}

if (pool.length === 0) {
  throw new Error(
    "No AI API keys found. Set at least one of:\n" +
      "  GROQ_API_KEY   — https://console.groq.com/keys  (free)\n" +
      "  GEMINI_API_KEY — https://aistudio.google.com/apikey  (free)\n" +
      "Tip: comma-separate multiple keys for automatic rotation.",
  );
}

// ─── Round-robin rotation ─────────────────────────────────────────────────────

let _counter = 0;

/**
 * Returns the next { client, model } in the round-robin rotation.
 * Call getClient(true) on a 429 to skip immediately to the next key.
 */
export function getClient(skip = false): PoolEntry {
  if (skip) _counter = (_counter + 1) % pool.length;
  const entry = pool[_counter % pool.length];
  _counter = (_counter + 1) % pool.length;
  return entry;
}

/** Legacy single-client export — points to first client. */
export const openai = pool[0].client;

/** Default model (first pool entry). */
export const AI_MODEL = pool[0].model;

/** Total keys loaded across all providers. */
export const AI_KEY_COUNT = pool.length;
