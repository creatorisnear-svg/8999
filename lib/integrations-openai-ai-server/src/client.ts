import OpenAI from "openai";

// Priority order for AI provider:
//   1. Groq  (GROQ_API_KEY)          — free, fast Llama 3.3 70B
//   2. Replit proxy                  — if running inside Replit with AI Integration enabled
//   3. Standard OpenAI (OPENAI_API_KEY) — paid fallback

const groqApiKey = process.env.GROQ_API_KEY;
const replitApiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
const replitBaseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
const standardApiKey = process.env.OPENAI_API_KEY;

if (!groqApiKey && !replitApiKey && !standardApiKey) {
  throw new Error(
    "No AI API key found.\n" +
    "  • Groq (free): set GROQ_API_KEY — get one at https://console.groq.com/keys\n" +
    "  • Replit: enable the OpenAI AI Integration in your project settings.\n" +
    "  • OpenAI: set OPENAI_API_KEY — https://platform.openai.com/api-keys",
  );
}

export const openai = groqApiKey
  ? new OpenAI({ apiKey: groqApiKey, baseURL: "https://api.groq.com/openai/v1" })
  : replitBaseUrl && replitApiKey
    ? new OpenAI({ apiKey: replitApiKey, baseURL: replitBaseUrl })
    : new OpenAI({ apiKey: standardApiKey! });

// Active model — change this to switch models globally
// Groq free models: llama-3.3-70b-versatile, llama-3.1-70b-versatile, llama3-70b-8192
// OpenAI models:    gpt-4o-mini, gpt-4o
export const AI_MODEL = groqApiKey
  ? "llama-3.3-70b-versatile"
  : "gpt-4o-mini";
