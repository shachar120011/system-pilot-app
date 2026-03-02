import React, { useState, useRef } from 'react';
import { AlertTriangle, Send, CheckCircle, Paperclip, Bot, X } from 'lucide-react';
import { siteConfig } from '../config';
import { StorageService } from '../services/storageService';
import { GeminiService } from '../services/geminiService';
import { IssuePriority, IssueCategory, Issue, Attachment } from '../types';
import { v4 as uuidv4 } from 'uuid';

// אל תשכח לוודא שהכתובת פה היא הכתובת האמיתית מה-Deploy האחרון שעשית!
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwfIFA_uSeLGUU5WPyhU5kDCSIGmFGBnKy8co6dAN_t4PEM8ttygaJtT5eu3IjLM3XY/exec";

export const IssueReporter: React.FC = () => {
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [aiStatus, setAiStatus] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // טיפול בהעלאת קובץ והמרתו ל-Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const newAttachment: Attachment = {
        name: file.name,
        type: file.type,
        data: reader.result as string
      };
      setAttachments(prev => [...prev, newAttachment]);
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = (indexToRemove: number) => {
    setAttachments(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary || !description) return;
    
    setIsSubmitting(true);
    setAiStatus('ה-AI מנתח ומסווג את התקלה שלך...');

    let detectedCategory = IssueCategory.OTHER;
    let detectedPriority = IssuePriority.MEDIUM;

    try {
      const prompt = `
        נתח את התקלה הבאה שדווחה על ידי עובד.
        נושא: ${summary}
        תיאור: ${description}
        
        החזר אך ורק אובייקט JSON תקין עם שני השדות הבאים (ללא טקסט נוסף):
        1. "category": בחר את המתאים ביותר מתוך: ["באג טכני", "ממשק משתמש", "הרשאות וגישה", "ביצועים ואיטיות", "אחר"]
        2. "priority": בחר את המתאים ביותר מתוך: ["נמוכה", "בינונית", "גבוהה", "קריטית"]
      `;

      const aiResponse = await GeminiService.askQuestion("", prompt);
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
    }

    setAiStatus('שומר נתונים במערכת...');

    const newIssue: Issue = {
      id: uuidv4(),
      summary,
      description: `[נושא: ${summary}] ${description}`, // שילבנו את הנושא לתוך התיאור כי אין עמודה מיוחדת בגיליון
      category: detectedCategory,
      priority: detectedPriority,
      status: 'open',
      createdAt: Date.now(),
      username: 'משתמש מחובר', // כאן תוכל בהמשך למשוך את השם האמיתי מה-State
      userRole: 'עובד עירייה',
      attachments: attachments
    };

    // שמירה לאחסון המקומי של המנהל
    StorageService.saveIssue(newIssue);

    // --- שמירה לענן בסדר המדויק של הלשונית Bug_Reports ---
    try {
      const rowData = [
          new Date(newIssue.createdAt).toISOString(), // A: תאריך ושעה
          newIssue.username || "אנונימי",             // B: שם מלא
          newIssue.userRole || "",                    // C: מחלקה / תפקיד
          newIssue.description,                       // D: תיאור הבעיה
          attachments.length > 0 ? "יש קבצים מצורפים" : "", // E: קבצים (כרגע רק טקסט)
          newIssue.status,                            // F: סטטוס טיפול
          newIssue.category,                          // G: קטגוריה
          newIssue.priority,                          // H: דחיפות
          "",                                         // I: דרך טיפול
          ""                                          // J: זמן סגירה
      ];

      await fetch(APPS_SCRIPT_URL, {
          method: "POST",
          body: JSON.stringify({ 
            sheet: "Issues", // ה-Apps Script שכתבנו יודע ש-Issues זה Bug_Reports
            action: "insert", 
            data: rowData 
          })
      });
    } catch (error) {
      console.error("Failed to insert issue to cloud", error);
    }

    setIsSubmitting(false);
    setIsSuccess(true);
    setSummary('');
    setDescription('');
    setAttachments([]);
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
                  placeholder="תאר בדיוק מה קרה, מה ניסית לעשות ומה הייתה התגובה של המ
