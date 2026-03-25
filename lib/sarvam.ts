import { SarvamAIClient } from "sarvamai";

let client: SarvamAIClient | null = null;

export function getSarvamClient() {
  if (!process.env.SARVAM_API_KEY) {
    throw new Error("SARVAM_API_KEY is not configured");
  }

  if (!client) {
    client = new SarvamAIClient({
      apiSubscriptionKey: process.env.SARVAM_API_KEY
    });
  }

  return client;
}
