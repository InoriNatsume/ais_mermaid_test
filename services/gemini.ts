import { GoogleGenAI } from "@google/genai";
import { DiagramType } from "../types";

// Declare process for TypeScript to prevent "Cannot find name 'process'" error
// The actual value is replaced by Vite at build time via define
declare const process: {
  env: {
    API_KEY?: string;
  }
};

const apiKey = process.env.API_KEY;
export const isAIEnabled = !!(apiKey && apiKey.length > 0 && apiKey !== 'undefined');

let ai: GoogleGenAI | null = null;
if (isAIEnabled) {
  // @ts-ignore - Ignore potential type mismatch during strict compilation
  ai = new GoogleGenAI({ apiKey: apiKey as string });
}

const cleanResponse = (text: string): string => {
  // Remove markdown code blocks if present
  let cleaned = text.trim();
  if (cleaned.startsWith('```mermaid')) {
    cleaned = cleaned.replace(/^```mermaid/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```/, '');
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.replace(/```$/, '');
  }
  return cleaned.trim();
};

export const generateMermaidCode = async (prompt: string, type: DiagramType = 'Auto'): Promise<string> => {
  if (!ai || !isAIEnabled) {
    throw new Error("AI features are disabled. API Key is missing.");
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create a Mermaid.js diagram code based on this request: "${prompt}".
      
      TARGET DIAGRAM TYPE: ${type}
      
      RULES:
      1. Return ONLY the raw Mermaid code.
      2. Do not include markdown formatting (backticks).
      3. Do not include explanations.
      4. Ensure syntax is valid for the requested diagram type.
      5. If the type is 'Auto', infer the best type from the request. Default to flowchart (graph TD) if unclear.
      6. If a specific type is requested (e.g. Sequence, Class), STRICTLY use that syntax.`,
    });

    return cleanResponse(response.text || '');
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};

export const fixMermaidCode = async (brokenCode: string, errorMessage: string): Promise<string> => {
  if (!ai || !isAIEnabled) {
    throw new Error("AI features are disabled. API Key is missing.");
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `The following Mermaid.js code is invalid and caused a rendering error.
      
      CODE:
      ${brokenCode}
      
      ERROR:
      ${errorMessage}
      
      TASK:
      Fix the syntax errors and return the corrected Mermaid code.
      
      RULES:
      1. Return ONLY the raw corrected Mermaid code.
      2. Do not include markdown formatting.
      3. Do not include explanations.`,
    });

    return cleanResponse(response.text || '');
  } catch (error) {
    console.error("Gemini Fix Error:", error);
    throw error;
  }
};