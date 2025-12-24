
import { GoogleGenAI, Type } from "@google/genai";
import { InsightResult } from "../types";

// Initialize GoogleGenAI with process.env.API_KEY directly
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const queryDWH = async (userQuery: string, fullSchema: string): Promise<InsightResult> => {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are an expert Data Warehouse Analyst and AI Assistant.
    Your task is to interpret natural language queries and provide data insights based on the provided DWH schema and context.
    
    SCHEMA AND CONTEXT:
    ${fullSchema}

    RULES:
    1. Analyze the query carefully.
    2. Provide a conversational but professional 'answer'.
    3. If the query implies a list or time series, generate realistic 'data' points for visualization.
    4. Choose an appropriate 'chartType' (BAR, LINE, PIE, AREA, or NONE if text only).
    5. Always return your response in JSON format according to the schema provided.
    6. If the data is not in the context, simulate reasonable results based on the provided scenario.
    7. If the user asks about tables you don't have, explain that they might need to be added to the data source.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: userQuery,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          answer: { type: Type.STRING },
          chartType: { type: Type.STRING, description: "One of: BAR, LINE, PIE, AREA, NONE" },
          data: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                value: { type: Type.NUMBER }
              },
              required: ["label", "value"]
            }
          },
          metadata: {
            type: Type.OBJECT,
            properties: {
              total: { type: Type.NUMBER },
              delta: { type: Type.STRING },
              trend: { type: Type.STRING, description: "up, down, or neutral" }
            }
          }
        },
        required: ["answer", "chartType"]
      }
    }
  });

  try {
    // Access text property directly from GenerateContentResponse
    const text = response.text || "{}";
    const result = JSON.parse(text);
    return result as InsightResult;
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    throw new Error("Invalid AI response format");
  }
};
