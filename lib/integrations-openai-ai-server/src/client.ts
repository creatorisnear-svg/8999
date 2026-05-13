import OpenAI from "openai";

// On Replit: AI_INTEGRATIONS_OPENAI_BASE_URL + AI_INTEGRATIONS_OPENAI_API_KEY are injected automatically.
// On Koyeb / other hosts: set OPENAI_API_KEY in your environment variables instead.

const replitApiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
const replitBaseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
const standardApiKey = process.env.OPENAI_API_KEY;

if (!replitApiKey && !standardApiKey) {
  throw new Error(
    "No OpenAI API key found.\n" +
    "  • On Replit: enable the OpenAI AI Integration in your project settings.\n" +
    "  • On Koyeb / other hosts: set the OPENAI_API_KEY environment variable.",
  );
}

export const openai = new OpenAI(
  replitBaseUrl && replitApiKey
    ? { apiKey: replitApiKey, baseURL: replitBaseUrl }  // Replit proxy
    : { apiKey: standardApiKey! },                      // Standard OpenAI
);
