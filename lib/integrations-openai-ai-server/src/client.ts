import OpenAI from "openai";

// ─── Key Collection ───────────────────────────────────────────────────────────
// Supports three formats (all combined into one rotating pool):
//   1. GROQ_API_KEY=key1,key2,key3   (comma-separated, any number of keys)
//   2. GROQ_API_KEY_1 / GROQ_API_KEY_2 ... GROQ_API_KEY_10  (numbered vars)
//   3. Single GROQ_API_KEY (original single-key format)

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

function collectGroqKeys(): string[] {
  const keys: string[] = [];
  // Primary: comma-separated in GROQ_API_KEY
  const raw = process.env.GROQ_API_KEY;
  if (raw) keys.push(...raw.split(",").map((k) => k.trim()).filter(Boolean));
  // Numbered extras: GROQ_API_KEY_1 … GROQ_API_KEY_10
  for (let i = 1; i <= 10; i++) {
    const k = process.env[`GROQ_API_KEY_${i}`]?.trim();
    if (k && !keys.includes(k)) keys.push(k);
  }
  return keys;
}

const groqKeys = collectGroqKeys();
const replitApiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
const replitBaseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
const standardApiKey = process.env.OPENAI_API_KEY;

const usingGroq = groqKeys.length > 0;

if (!usingGroq && !replitApiKey && !standardApiKey) {
  throw new Error(
    "No AI API key found.\n" +
      "  • Groq (free, recommended): set GROQ_API_KEY — https://console.groq.com/keys\n" +
      "    Tip: paste multiple keys comma-separated for automatic rotation.\n" +
      "  • Replit: enable the OpenAI AI Integration in project settings.\n" +
      "  • OpenAI: set OPENAI_API_KEY — https://platform.openai.com/api-keys",
  );
}

// ─── Client Pool ──────────────────────────────────────────────────────────────

const clients: OpenAI[] = usingGroq
  ? groqKeys.map((key) => new OpenAI({ apiKey: key, baseURL: GROQ_BASE_URL }))
  : replitBaseUrl && replitApiKey
    ? [new OpenAI({ apiKey: replitApiKey, baseURL: replitBaseUrl })]
    : [new OpenAI({ apiKey: standardApiKey! })];

let _counter = 0;

/**
 * Returns the next client in the round-robin rotation.
 * On rate-limit (429), call getClient(true) to skip to the next key immediately.
 */
export function getClient(skip = false): OpenAI {
  if (skip) _counter = (_counter + 1) % clients.length;
  const client = clients[_counter % clients.length];
  _counter = (_counter + 1) % clients.length;
  return client;
}

/** Legacy single-client export — still works, points to first client. */
export const openai = clients[0];

/** Active model name — set automatically based on provider. */
export const AI_MODEL = usingGroq ? "llama-3.3-70b-versatile" : "gpt-4o-mini";

/** How many keys are loaded (useful for logging/health checks). */
export const AI_KEY_COUNT = clients.length;
