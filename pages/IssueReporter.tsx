import React, { useState, useRef, useEffect } from 'react';
import { AlertTriangle, Send, CheckCircle, Paperclip, Bot, X, LogIn, User, LogOut } from 'lucide-react';
import { siteConfig } from '../config';
import { StorageService } from '../services/storageService';
import { GeminiService } from '../services/geminiService';
import { IssuePriority, IssueCategory, Issue, Attachment } from '../types';
import { v4 as uuidv4 } from 'uuid';

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwfIFA_uSeLGUU5WPyhU5kDCSIGmFGBnKy8co6dAN_t4PEM8ttygaJtT5eu3IjLM3XY/exec";

export const IssueReporter: React.FC = () => {
  // נתוני משתמש
  const [userName, setUserName] = useState('');
  const [department, setDepartment] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // נתוני טופס
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [aiStatus, setAiStatus] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // סנכרון אוטומטי של המשתמש מול מסך הבוט
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const newAttachment: Attachment = { name: file.name, type: file.type, data: reader.result as string };
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
      const prompt = `נתח את התקלה הבאה שדווחה. נושא: ${summary} תיאור: ${description}
        החזר אך ורק אובייקט JSON תקין:
        1. "category": ["באג טכני", "ממשק משתמש", "הרשאות וגישה", "ביצועים ואיטיות", "אחר"]
        2. "priority": ["נמוכה", "בינונית", "גבוהה", "קריטית"]`;

      const aiResponse = await GeminiService.askQuestion("", prompt);
      const cleanJson = aiResponse.answer.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(cleanJson);

      if (Object.values(IssueCategory).includes(parsedData.category)) detectedCategory = parsedData.category;
      if (Object.values(IssuePriority).includes(parsedData.priority)) detectedPriority = parsedData.priority;
    } catch (error) {
      console.error("AI Classification failed", error);
    }

    setAiStatus('שומר נתונים במערכת...');

    const newIssue: Issue = {
      id: uuidv4(),
      summary,
      description: `[נושא: ${summary}] ${description}`,
      category: detectedCategory,
      priority: detectedPriority,
      status: 'open',
      createdAt: Date.now(),
      username: userName, // <--- שמירת השם האמיתי מההתחברות!
      userRole: department, // <--- שמירת המחלקה!
      attachments: attachments
    };

    StorageService.saveIssue(newIssue);

    try {
      const rowData = [
          new Date(newIssue.createdAt).toISOString(),
          newIssue.username,
          newIssue.userRole,
          newIssue.description,
          attachments.length > 0 ? "יש קבצים מצורפים" : "",
          newIssue.status,
          newIssue.category,
          newIssue.priority,
          "", 
          "", 
          newIssue.id
      ];

      await fetch(APPS_SCRIPT_URL, {
          method: "POST",
          body: JSON.stringify({ sheet: "Issues", action: "insert", data: rowData })
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

  if (!isAuthenticated) {
    return (
      <div className="flex-1 min-h-screen bg-slate-50 flex justify-center items-center p-6 w-full">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-[#432A61] p-4 rounded-full text-white shadow-lg mb-4"><LogIn size={32} /></div>
            <h2 className="text-2xl font-bold text-[#432A61] tracking-wide">זיהוי עובד</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">יש להזדהות כדי לדווח על תקלה</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 text-right">שם מלא</label>
              <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-right outline-none focus:border-[#432A61]" placeholder="הזן את שמך..." required />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 text-right">מחלקה</label>
              <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-right outline-none focus:border-[#432A61] appearance-none" required>
                <option value="" disabled>בחר מחלקה...</option>
                <option value="מרכז שירות">מרכז שירות</option>
                <option value="ביקורת עסקים">ביקורת עסקים</option>
                <option value="תכנון הנדסי">תכנון הנדסי</option>
                <option value="רישוי הנדסי">רישוי הנדסי</option>
                <option value="הנהלה">הנהלה</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-[#432A61] text-white py-3.5 rounded-xl font-bold shadow-lg hover:bg-[#2d1b42] transition-all mt-6">המשך לדיווח</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-y-auto bg-slate-100 flex justify-center items-center p-4 md:p-6 relative">
      
      {/* כפתור החלפת משתמש למעלה */}
      <div className="absolute top-6 left-6 flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 z-50">
         <User size={16} className="text-[#432A61]" />
         <span className="text-sm font-medium text-slate-700">{userName}</span>
         <button onClick={handleLogout} className="mr-2 text-red-500 hover:text-red-700 transition-colors" title="התנתק"><LogOut size={16}/></button>
      </div>

      <div className="w-full max-w-3xl bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50 flex items-center gap-4">
          <div className="bg-[#432A61] p-4 rounded-2xl text-white shadow-lg"><AlertTriangle size={32} /></div>
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
                <input type="text" value={summary} onChange={(e) => setSummary(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#432A61]" placeholder="למשל: המדפסת במחלקת הנדסה לא מדפיסה" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">תיאור הבעיה (פירוט מלא)</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#432A61] min-h-[150px] resize-none" placeholder="תאר בדיוק מה קרה..." required />
              </div>

              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {attachments.map((att, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-sm">
                      <Paperclip size={14} /><span className="max-w-[150px] truncate">{att.name}</span>
                      <button type="button" onClick={() => removeAttachment(idx)} className="text-indigo-400 hover:text-red-500"><X size={16} /></button>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 flex flex-col md:flex-row items-center justify-between border-t border-slate-100 gap-4">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,.pdf,.doc,.docx" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-slate-500 hover:text-[#432A61] bg-slate-50 hover:bg-indigo-50 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-colors w-full md:w-auto justify-center border border-slate-200"><Paperclip size={18} /> צרף קובץ / צילום מסך</button>
                <div className="w-full md:w-auto flex flex-col items-end">
                  <button type="submit" disabled={isSubmitting} className="w-full md:w-auto bg-[#432A61] text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-[#2d1b42] disabled:bg-slate-400 flex items-center justify-center gap-2">
                    {isSubmitting ? 'מעבד נתונים...' : 'שלח דיווח'}<Send size={18} className="rotate-[-180deg]" />
                  </button>
                  {isSubmitting && <span className="text-xs text-indigo-600 mt-2 flex items-center gap-1 font-medium animate-pulse"><Bot size={14} /> {aiStatus}</span>}
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
