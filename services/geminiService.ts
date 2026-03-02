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
          answer: { 
            type: Type.STRING, 
            description: "The synthesized, detailed answer, formatted in beautiful Markdown (using headings, bold text, and bullet points)." 
          },
          suggestions: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "A list of 2-3 short, relevant follow-up questions." 
          }
        },
        required: ["answer", "suggestions"]
      };

      // הפרומפט שודרג משמעותית כדי לעודד תשובות עשירות ומנוסחות
      const prompt = `
        You are an expert AI assistant for the "Inactu" system, specifically designed for the Business Licensing Department (רישוי עסקים).
        Your goal is to provide highly professional, friendly, and structured answers to employees using the system.
        
        System Knowledge Base Context:
        ${context ? context : "No specific internal context provided for this query."}
        
        User Question:
        ${question}
        
        Instructions for formulating your response:
        1. **Cross-reference Data:** Analyze the provided "System Knowledge Base Context". If the answer is there, base your response heavily on it.
        2. **Fill the Gaps:** If the provided context is empty or incomplete, use your general knowledge as an expert AI to provide a helpful and logical answer related to organizational systems, municipal procedures, or general troubleshooting.
        3. **Style & Structure:** The response MUST be highly styled using Markdown. Use:
           - Headers (###) for main sections.
           - Bold text (**text**) for emphasis on important terms or steps.
           - Bullet points (- or 1. 2. 3.) for lists or instructions.
        4. **Tone:** Professional, encouraging, and clear. Speak directly to the user (e.g., "כדי לבצע זאת, עליך...").
        5. **Language:** Respond entirely in Hebrew.
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
        answer: "אופס! 🤖\nאירעה שגיאה בחיבור לשרתי הבינה המלאכותית. אנא ודא שחיבור הרשת תקין ונסה שוב בעוד מספר רגעים.",
        suggestions: ["איך אפשר לדווח על תקלה?"]
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
        contents: `You are a Data Analyst for a municipal system. Here are recent issues: ${issuesContext}. Provide a short insight in Hebrew.`,
        config: { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
      });
      return response.text || "לא זוהו תובנות בשלב זה.";
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
        contents: `Analyze these questions: ${JSON.stringify(textQuestions)}. Group into common topics in Hebrew.`,
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
