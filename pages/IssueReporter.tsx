import React, { useState, useRef, useEffect } from 'react';
import { AlertTriangle, Send, CheckCircle, Paperclip, Bot, X, LogIn, User, LogOut, Loader2 } from 'lucide-react';
import { siteConfig } from '../config';
import { StorageService } from '../services/storageService';
import { GeminiService } from '../services/geminiService';
import { IssuePriority, IssueCategory, Issue, Attachment } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const IssueReporter: React.FC = () => {
  const [userName, setUserName] = useState('');
  const [department, setDepartment] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [aiStatus, setAiStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // טעינת משתמש קיים מהאחסון המקומי
  useEffect(() => {
    const savedUser = localStorage.getItem('inactu_user');
    if (savedUser) {
      const { name, dept } = JSON.parse(savedUser);
      setUserName(name); 
      setDepartment(dept); 
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim() && department.trim()) {
      localStorage.setItem('inactu_user', JSON.stringify({ name: userName, dept: department }));
      setIsAuthenticated(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('inactu_user');
    setIsAuthenticated(false);
    setUserName('');
    setDepartment('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary || !description) return;
    setIsSubmitting(true);
    setAiStatus('ה-AI מנתח ומסווג את התקלה...');

    let detectedCategory = IssueCategory.OTHER;
    let detectedPriority = IssuePriority.MEDIUM;

    try {
      // שימוש גם בסיכום וגם בתיאור לצורך ניתוח AI מדויק יותר
      const prompt = `נתח תקלה. נושא: ${summary}. תיאור: ${description}. החזר JSON עם המפתחות category ו-priority בלבד. קטגוריות אפשריות: באג טכני, ממשק משתמש, הרשאות וגישה, ביצועים ואיטיות, אחר. דחיפויות: נמוכה, בינונית, גבוהה, קריטית.`;
      const aiResponse = await GeminiService.askQuestion("", prompt);
      const cleanJson = aiResponse.answer.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(cleanJson);
      
      if (Object.values(IssueCategory).includes(parsedData.category)) detectedCategory = parsedData.category;
      if (Object.values(IssuePriority).includes(parsedData.priority)) detectedPriority = parsedData.priority;
    } catch (e) { 
      console.error("AI Analysis failed, using defaults", e); 
    }

    const newIssue: Issue = {
      id: uuidv4(),
      summary: summary, // שדה התקציר שחשוב לגרפים
      description: description, // התיאור המלא
      category: detectedCategory,
      priority: detectedPriority,
      status: 'open',
      createdAt: Date.now(),
      username: userName,
      userRole: department,
      attachments: attachments
    };

    // שמירה לענן (Supabase) דרך השירות
    await StorageService.saveIssue(newIssue);

    setIsSubmitting(false);
    setIsSuccess(true);
    setAiStatus('');
    setSummary(''); 
    setDescription(''); 
    setAttachments([]);
    
    // חזרה למסך הדיווח אחרי 3 שניות
    setTimeout(() => setIsSuccess(false), 3000);
  };

  // תצוגת מסך התחברות
  if (!isAuthenticated) {
    return (
      <div className="flex-1 min-h-screen bg-slate-50 flex justify-center items-center p-6 w-full text-right">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-[#432A61] p-4 rounded-full text-white shadow-lg mb-4">
              <LogIn size={32} />
            </div>
            <h2 className="text-2xl font-bold text-[#432A61]">זיהוי עובד</h2>
            <p className="text-sm text-slate-500 mt-1">{siteConfig.clientName}</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">שם מלא</label>
              <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-right outline-none focus:ring-2 focus:ring-[#432A61]/20" placeholder="הזן את שמך..." required />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">מחלקה</label>
              <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-right outline-none appearance-none cursor-pointer" required>
                <option value="" disabled>בחר מחלקה...</option>
                <option value="מרכז שירות">מרכז שירות</option>
                <option value="ביקורת עסקים">ביקורת עסקים</option>
                <option value="תכנון הנדסי">תכנון הנדסי</option>
                <option value="רישוי הנדסי">רישוי הנדסי</option>
                <option value="הנהלה">הנהלה</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-[#432A61] text-white py-3.5 rounded-xl font-bold shadow-lg hover:bg-[#35214d] transition-all">המשך לדיווח</button>
          </form>
        </div>
      </div>
    );
  }

  // תצוגת מסך דיווח
  return (
    <div className="h-screen w-full bg-slate-100 flex justify-center items-center p-4 text-right">
      <div className="absolute top-6 left-6 flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 flex-row-reverse">
         <User size={16} className="text-[#432A61]" /> 
         <span className="text-sm font-medium">{userName}</span>
         <span className="text-slate-300">|</span>
         <button onClick={handleLogout} className="text-red-500 hover:underline text-xs">התנתק</button>
      </div>

      <div className="w-full max-w-3xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-8">
        {isSuccess ? (
          <div className="text-center py-20 animate-fadeIn">
            <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={48} className="text-green-500" />
            </div>
            <h3 className="text-3xl font-bold text-slate-800">הדיווח נשמר בענן!</h3>
            <p className="text-slate-500 mt-2">הנתונים סונכרנו בהצלחה עם Supabase</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3 flex-row-reverse mb-2">
              <div className="bg-[#432A61] p-2 rounded-lg text-white">
                <AlertTriangle size={24} />
              </div>
              <h2 className="text-2xl font-bold text-[#432A61]">דיווח תקלה חדשה</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">נושא התקלה (יוצג בגרפים)</label>
                <input type="text" value={summary} onChange={(e) => setSummary(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-right outline-none focus:border-[#432A61]" placeholder="למשל: איטיות במערכת, תקלה בהרשאות..." required />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">תיאור מלא ומפורט</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl h-32 text-right outline-none focus:border-[#432A61] resize-none" placeholder="פרט כאן את מהות התקלה..." required />
              </div>
            </div>

            {aiStatus && (
              <div className="flex items-center gap-2 justify-end text-indigo-600 text-sm font-medium bg-indigo-50 p-3 rounded-lg animate-pulse">
                {aiStatus} <Loader2 size={16} className="animate-spin" />
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className="w-full bg-[#432A61] hover:bg-[#35214d] disabled:bg-slate-300 text-white py-4 rounded-xl font-bold shadow-lg shadow-[#432A61]/20 flex justify-center items-center gap-2 transition-all">
              {isSubmitting ? 'מעבד ושומר...' : 'שלח דיווח לענן'} <Send size={18} className="rotate-[-180deg]" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
