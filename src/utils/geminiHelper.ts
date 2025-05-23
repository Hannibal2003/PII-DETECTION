// gemini-helper.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

type PiiType = 
  | 'Name'
  | 'Mobile'
  | 'CreditCard'
  | 'BankAccount'
  | 'Email'
  | 'Address'
  | 'Aadhaar';

export const callGeminiForValidation = async (value: string, supposedType: PiiType) => {
  const prompt = `You are an expert in identifying PII (Personally Identifiable Information).
Given this text: "${value}"
Is it a valid "${supposedType}"? Consider format, context, and common patterns.
{ "isValid": boolean, "confidence": number (0-1) }`;

  try {
    // Ensure you have VITE_GEMINI_API_KEY defined in your .env file
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("AIzaSyAFw2u79C0wD0pJ1ErFs4YnQI2h_qEgbf0");
      throw new Error("API key not configured");
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini validation error:", error);
    return { isValid: false, confidence: 0 };
  }
};