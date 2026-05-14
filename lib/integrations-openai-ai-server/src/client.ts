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
export type PoolEntry = { client: OpenAI; model: string };

// Pool is built lazily so the server can start without AI keys configured.
// AI routes will throw a 503 if no keys are present when a request arrives.
let _pool: PoolEntry[] | null = null;

function getPool(): PoolEntry[] {
  if (_pool !== null) return _pool;
  const pool: PoolEntry[] = [];
  for (const key of collectKeys("GROQ_API_KEY")) {
    pool.push({ client: new OpenAI({ apiKey: key, baseURL: GROQ_BASE_URL }), model: GROQ_MODEL });
  }
  for (const key of collectKeys("GEMINI_API_KEY")) {
    pool.push({ client: new OpenAI({ apiKey: key, baseURL: GEMINI_BASE_URL }), model: GEMINI_MODEL });
  }
  _pool = pool;
  return pool;
}

// ─── Round-robin rotation ─────────────────────────────────────────────────────
let _counter = 0;

/**
 * Returns the next { client, model } in the round-robin rotation.
 * Call getClient(true) on a 429 to skip immediately to the next key.
 * Throws a 503 error if no AI keys are configured.
 */
export function getClient(skip = false): PoolEntry {
  const pool = getPool();
  if (pool.length === 0) {
    throw Object.assign(
      new Error(
        "No AI API keys configured. Add GROQ_API_KEY (https://console.groq.com/keys) or GEMINI_API_KEY (https://aistudio.google.com/apikey) in your Replit Secrets.",
      ),
      { status: 503 },
    );
  }
  if (skip) _counter = (_counter + 1) % pool.length;
  const entry = pool[_counter % pool.length];
  _counter = (_counter + 1) % pool.length;
  return entry;
}

/** Get the default model name. Returns empty string if no keys configured. */
export function getAiModel(): string {
  const pool = getPool();
  return pool[0]?.model ?? "";
}

/** Total number of AI keys loaded across all providers. */
export function getAiKeyCount(): number {
  return getPool().length;
}

// Legacy named exports kept for backward compatibility
export const AI_MODEL = "";
export const AI_KEY_COUNT = 0;

/** First OpenAI client — throws if no keys configured. */
export const openai: OpenAI = new Proxy({} as OpenAI, {
  get(_target, prop: string | symbol) {
    const client = getClient().client;
    const val = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === "function" ? val.bind(client) : val;
  },
});
