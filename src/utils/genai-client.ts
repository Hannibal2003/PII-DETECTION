// genai-client.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

// Ensure you have VITE_GEMINI_API_KEY defined in your .env file
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
  console.error("AIzaSyAFw2u79C0wD0pJ1ErFs4YnQI2h_qEgbf0");
  // Optionally throw an error or return a dummy client
  throw new Error("API key not configured for genAIClient");
}

export const genAIClient = new GoogleGenerativeAI(apiKey);