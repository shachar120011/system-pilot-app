import { GoogleGenAI, Type, Schema, ThinkingLevel } from "@google/genai";
import { AiAnalysisResult, IssueCategory, IssuePriority, UserQuery, QueryTrend, QAResponse } from "../types";

// CONSTANTS
// Using gemini-3-flash-preview as the latest efficient model for this environment
const MODEL_NAME_FAST = "gemini-3-flash-preview";

class GeminiServiceImpl {
  private client: GoogleGenAI | null = null;
  private apiKey: string | undefined;

  constructor() {
    // Security: Access env var safely using import.meta.env.VITE_GEMINI_API_KEY
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  }

  /**
   * Lazy initializer for the Gemini Client.
   * Ensures the app doesn't crash on startup if key is missing.
   */
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
   * Answers a user's question based on the provided knowledge base context.
   */
  public async askQuestion(context: string, question: string): Promise<QAResponse> {
    try {
      const ai = this.getClient();

      const responseSchema: Schema = {
        type: Type.OBJECT,
        properties: {
          answer: { type: Type.STRING, description: "The answer to the user's question based on the context, formatted in Markdown." },
          suggestions: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "A list of 1-3 short follow-up questions, corrections for typos, or related topics." 
          }
        },
        required: ["answer", "suggestions"]
      };

      const prompt = `
        You are a Senior Expert in Business Licensing (רישוי עסקים) and System Implementation.
        Your goal is to assist users with the new organizational system.
        
        Context Information:
        ${context}
        
        User Question:
        ${question}
        
        Instructions:
        1. Answer ONLY based on the provided Context Information.
        2. Use **Markdown** formatting for clarity:
           - Use **bold** for key terms.
           - Use bullet points or numbered lists for steps.
        3. Be professional, concise, and helpful.
        4. If the answer is not in the context, state clearly that you don't have that information.
        5. Respond in Hebrew.
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
      
      // Propagate configuration errors
      if (error.message.includes("System Configuration Error")) {
        throw error;
      }

      // Fallback for other errors
      return {
        answer: "אירעה שגיאה בעיבוד הבקשה. אנא נסה שנית מאוחר יותר.",
        suggestions: []
      };
    }
  }

  /**
   * Analyzes a raw issue description to categorize it.
   */
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
      
      if (error.message.includes("System Configuration Error")) {
        throw error;
      }

      return {
        summary: description.slice(0, 30) + "...",
        priority: IssuePriority.MEDIUM,
        category: IssueCategory.OTHER
      };
    }
  }

  /**
   * Generates insights for the admin dashboard.
   */
  public async generateInsights(issuesContext: string): Promise<string> {
    try {
      const ai = this.getClient();

      const response = await ai.models.generateContent({
        model: MODEL_NAME_FAST,
        contents: `
          You are a Data Analyst. Here are recent issues (JSON):
          ${issuesContext}
          
          Provide a short insight (max 3 sentences) in Hebrew about the trends.
          Use Markdown bolding for emphasis.
        `,
        config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        }
      });

      return response.text || "לא זוהו תובנות.";
    } catch (error: any) {
      console.error("Insights Error:", error);
      if (error.message.includes("System Configuration Error")) {
        return "שגיאת תצורה: מפתח API חסר.";
      }
      return "שגיאה בייצור תובנות.";
    }
  }

  /**
   * Analyzes query trends.
   */
  public async analyzeQueryTrends(queries: UserQuery[]): Promise<QueryTrend[]> {
    if (!queries.length) return [];
    
    try {
      const ai = this.getClient();

      // Optimization: Send only the text questions to save bandwidth/tokens
      const textQuestions = queries.slice(0, 50).map(q => q.question);

      const responseSchema: Schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                topic: { type: Type.STRING },
                count: { type: Type.NUMBER },
                exampleQuestions: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING }
                }
            },
            required: ["topic", "count", "exampleQuestions"]
        }
      };

      const response = await ai.models.generateContent({
        model: MODEL_NAME_FAST,
        contents: `
          Analyze these questions: ${JSON.stringify(textQuestions)}.
          Group into common topics, count occurrences, and provide examples.
        `,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        }
      });

      const jsonText = response.text;
      if (!jsonText) return [];
      return JSON.parse(jsonText) as QueryTrend[];

    } catch (error: any) {
      console.error("Trend Analysis Error:", error);
      return [];
    }
  }
}

// Export a singleton instance
export const GeminiService = new GeminiServiceImpl();
