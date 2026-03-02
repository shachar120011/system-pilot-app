import React, { useState } from 'react';
import { AlertTriangle, Send, CheckCircle, Paperclip, Bot } from 'lucide-react';
import { siteConfig } from '../config';
import { StorageService } from '../services/storageService';
import { GeminiService } from '../services/geminiService';
import { IssuePriority, IssueCategory, Issue } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const IssueReporter: React.FC = () => {
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [aiStatus, setAiStatus] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary || !description) return;
    
    setIsSubmitting(true);
    setAiStatus('ה-AI מנתח ומסווג את התקלה שלך...');

    let detectedCategory = IssueCategory.OTHER;
    let detectedPriority = IssuePriority.MEDIUM;

    try {
      // פרומפט ל-AI לסיווג אוטומטי
      const prompt = `
        נתח את התקלה הבאה שדווחה על ידי עובד.
        נושא: ${summary}
        תיאור: ${description}
        
        החזר אך ורק אובייקט JSON תקין עם שני השדות הבאים (ללא טקסט נוסף):
        1. "category": בחר את המתאים ביותר מתוך: ["באג טכני", "ממשק משתמש", "הרשאות וגישה", "ביצועים ואיטיות", "אחר"]
        2. "priority": בחר את המתאים ביותר מתוך: ["נמוכה", "בינונית", "גבוהה", "קריטית"]
      `;

      const aiResponse = await GeminiService.askQuestion("", prompt);
      
      // ניקוי ופיענוח התשובה של ה-AI
      const cleanJson = aiResponse.answer.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(cleanJson);

      if (Object.values(IssueCategory).includes(parsedData.category)) {
        detectedCategory = parsedData.category;
      }
      if (Object.values(IssuePriority).includes(parsedData.priority)) {
        detectedPriority = parsedData.priority;
      }
    } catch (error) {
      console.error("AI Classification failed, using defaults", error);
      // במקרה של שגיאה ב-AI, נשתמש בברירת המחדל שכבר הוגדרה למעלה
    }

    setAiStatus('שומר נתונים במערכת...');

    const newIssue: Issue = {
      id: uuidv4(),
      summary,
      description,
      category: detectedCategory,
      priority: detectedPriority,
      status: 'open',
      createdAt: Date.now(),
      username: 'משתמש מחובר', 
      userRole: 'עובד עירייה',
      attachments: []
    };

    StorageService.saveIssue(newIssue);

    setIsSubmitting(false);
    setIsSuccess(true);
    setSummary('');
    setDescription('');
    setAiStatus('');
    
    setTimeout(() => setIsSuccess(false), 3000);
  };

  return (
    <div className="h-screen w-full overflow-y-auto bg-slate-100 flex justify-center items-center p-4 md:p-6">
      <div className="w-full max-w-3xl bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden">
        
        <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50 flex items-center gap-4">
          <div className="bg-[#432A61] p-4 rounded-2xl text-white shadow-lg">
            <AlertTriangle size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#432A61]">דיווח על תקלה או בקשת תמיכה</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">המערכת תסווג את התקלה אוטומטית בעזרת AI</p>
          </div>
        </div>

        <div className="p-6 md:p-8">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-16 text-center animate-fadeIn">
              <CheckCircle size={80} className="text-green-500 mb-6 drop-shadow-md" />
              <h3 className="text-2xl font-bold text-slate-800 mb-2">הפנייה נשלחה וסווגה בהצלחה!</h3>
              <p className="text-slate-500">צוות התמיכה קיבל את הדיווח ויטפל בו בהתאם לדחיפות שנקבעה.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">נושא התקלה (תקציר קצר)</label>
                <input 
                  type="text" 
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#432A61] focus:ring-1 focus:ring-[#432A61]"
                  placeholder="למשל: המדפסת במחלקת הנדסה לא מדפיסה"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">תיאור הבעיה (פירוט מלא)</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#432A61] focus:ring-1 focus:ring-[#432A61] min-h-[150px] resize-none"
                  placeholder="תאר בדיוק מה קרה, מה ניסית לעשות ומה הייתה התגובה של המערכת..."
                  required
                />
              </div>

              <div className="pt-4 flex flex-col md:flex-row items-center justify-between border-t border-slate-100 gap-4">
                <button type="button" className="text-slate-400 hover:text-[#432A61] flex items-center gap-2 text-sm font-bold transition-colors w-full md:w-auto justify-center">
                  <Paperclip size={18} /> צרף צילום מסך
                </button>
                
                <div className="w-full md:w-auto flex flex-col items-end">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full md:w-auto bg-[#432A61] text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-[#2d1b42] transition-colors flex items-center justify-center gap-2 disabled:bg-slate-400"
                  >
                    {isSubmitting ? 'מעבד נתונים...' : 'שלח דיווח'}
                    <Send size={18} className="rotate-[-180deg]" />
                  </button>
                  {isSubmitting && (
                    <span className="text-xs text-indigo-600 mt-2 flex items-center gap-1 font-medium animate-pulse">
                      <Bot size={14} /> {aiStatus}
                    </span>
                  )}
                </div>
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  );
};
