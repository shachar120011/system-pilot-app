import { GoogleGenAI, Type, Schema, ThinkingLevel } from "@google/genai";
import { AiAnalysisResult, IssueCategory, IssuePriority, UserQuery, QueryTrend, QAResponse } from "../types";

// CONSTANTS
const MODEL_NAME_FAST = "gemini-3-flash-preview";

class GeminiServiceImpl {
  private client: GoogleGenAI | null = null;
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  }

  private getClient(): GoogleGenAI {
    if (!this.apiKey) {
      throw new Error("System Configuration Error: Missing VITE_GEMINI_API_KEY in environment variables.");
    }
    
    if (!this.client) {
      try {
        this.client = new GoogleGenAI({ apiKey: this.apiKey });
      } catch (error) {
        console.error("SystemPilot: Failed to initialize Gemini client", error);
        throw new Error("System Configuration Error: Failed to initialize Gemini client.");
      }
    }
    return this.client;
  }

  /**
   * Answers a user's question by synthesizing multiple context sources.
   */
  public async askQuestion(context: string, question: string): Promise<QAResponse> {
    try {
      const ai = this.getClient();

      const responseSchema: Schema = {
        type: Type.OBJECT,
        properties: {
          answer: { type: Type.STRING, description: "The synthesized answer based on all context sources, formatted in beautiful Markdown." },
          suggestions: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "A list of 2-3 short, relevant follow-up questions." 
          }
        },
        required: ["answer", "suggestions"]
      };

      // שים לב לשינוי בהנחיות - עכשיו המודל מונחה לסנתז מידע
      const prompt = `
        You are a Senior Expert in Business Licensing (רישוי עסקים) and System Implementation.
        Your goal is to assist users with the new organizational system by synthesizing information from multiple knowledge bases.
        
        Combined Context Information (From various sources):
        ${context}
        
        User Question:
        ${question}
        
        Instructions:
        1. Analyze ALL the provided Context Information sources.
        2. Combine and synthesize the relevant information into a single, cohesive, and comprehensive answer.
        3. Answer ONLY based on the provided context, but integrate the data intelligently.
        4. Use **Markdown** formatting to create a highly readable and styled response:
           - Use headings (###) to separate different concepts if applicable.
           - Use **bold** for key terms, system statuses, or important emphasis.
           - Use bullet points or numbered lists for steps or multiple details.
        5. If the answer is completely missing from the context, state clearly that you don't have that information.
        6. Respond in Hebrew.
      `;

      const response = await ai.models.generateContent({
        model: MODEL_NAME_FAST,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        }
      });

      const jsonText = response.text;
      if (!jsonText) throw new Error("Empty response from AI");

      return JSON.parse(jsonText) as QAResponse;

    } catch (error: any) {
      console.error("Gemini Q&A Error:", error);
      
      if (error.message.includes("System Configuration Error")) {
        throw error;
      }

      // הוספנו הצעות ברירת מחדל כדי שהממשק לא יישבר כשיש שגיאת API (כמו שגיאת 429)
      return {
        answer: "אירעה שגיאה בעיבוד הבקשה מול השרת (ייתכן עומס זמני). אנא נסה שנית מאוחר יותר.",
        suggestions: [
          "כיצד מבצעים בדיקת הגשה?",
          "מהם הסטטוסים האפשריים בתיק?",
          "איך פותחים תקלה חדשה במערכת?"
        ]
      };
    }
  }

  // ... שאר הפונקציות (analyzeIssue, generateInsights, analyzeQueryTrends) נשארו ללא שינוי
  // הדבק אותן כאן מהקוד הקודם כדי להשלים את המחלקה
}

export const GeminiService = new GeminiServiceImpl();
