import { GoogleGenAI, Type, Schema, ThinkingLevel } from "@google/genai";
import { AiAnalysisResult, IssueCategory, IssuePriority, UserQuery, QueryTrend, QAResponse } from "../types";

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
        4. Use **Markdown** formatting to create a highly readable and styled response.
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

      return {
        answer: "אירעה שגיאה בעיבוד הבקשה מול השרת. אנא נסה שנית מאוחר יותר.",
        suggestions: ["כיצד מבצעים בדיקת הגשה?", "מהם הסטטוסים האפשריים בתיק?"]
      };
    }
  }

  public async analyzeIssue(description: string): Promise<AiAnalysisResult> {
    try {
      const ai = this.getClient();

      const responseSchema: Schema = {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING, description: "Short summary in Hebrew (5-8 words)" },
          priority: { 
            type: Type.STRING, 
            enum: [IssuePriority.LOW, IssuePriority.MEDIUM, IssuePriority.HIGH, IssuePriority.CRITICAL]
          },
          category: {
            type: Type.STRING,
            enum: [IssueCategory.UI_UX, IssueCategory.BUG, IssueCategory.PERFORMANCE, IssueCategory.DATA, IssueCategory.OTHER]
          }
        },
        required: ["summary", "priority", "category"]
      };

      const response = await ai.models.generateContent({
        model: MODEL_NAME_FAST,
        contents: `Analyze this issue description: "${description}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        }
      });

      const jsonText = response.text;
      if (!jsonText) throw new Error("Empty response");

      return JSON.parse(jsonText) as AiAnalysisResult;

    } catch (error: any) {
      console.error("Gemini Analysis Error:", error);
      if (error.message.includes("System Configuration Error")) throw error;
      return {
        summary: description.slice(0, 30) + "...",
        priority: IssuePriority.MEDIUM,
        category: IssueCategory.OTHER
      };
    }
  }

  public async generateInsights(issuesContext: string): Promise<string> {
    try {
      const ai = this.getClient();
      const response = await ai.models.generateContent({
        model: MODEL_NAME_FAST,
        contents: `You are a Data Analyst. Here are recent issues: ${issuesContext}. Provide a short insight in Hebrew.`,
        config: { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
      });
      return response.text || "לא זוהו תובנות.";
    } catch (error) {
      return "שגיאה בייצור תובנות.";
    }
  }

  public async analyzeQueryTrends(queries: UserQuery[]): Promise<QueryTrend[]> {
    if (!queries.length) return [];
    try {
      const ai = this.getClient();
      const textQuestions = queries.slice(0, 50).map(q => q.question);

      const responseSchema: Schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                topic: { type: Type.STRING },
                count: { type: Type.NUMBER },
                exampleQuestions: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["topic", "count", "exampleQuestions"]
        }
      };

      const response = await ai.models.generateContent({
        model: MODEL_NAME_FAST,
        contents: `Analyze these questions: ${JSON.stringify(textQuestions)}. Group into common topics.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        }
      });

      const jsonText = response.text;
      if (!jsonText) return [];
      return JSON.parse(jsonText) as QueryTrend[];
    } catch (error) {
      return [];
    }
  }
}

export const GeminiService = new GeminiServiceImpl();
