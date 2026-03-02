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

  useEffect(() => {
    const savedUser = localStorage.getItem('inactu_user');
    if (savedUser) {
      const { name, dept } = JSON.parse(savedUser);
      setUserName(name); setDepartment(dept); setIsAuthenticated(true);
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary || !description) return;
    setIsSubmitting(true);
    setAiStatus('ה-AI מנתח ומסווג את התקלה...');

    let detectedCategory = IssueCategory.OTHER;
    let detectedPriority = IssuePriority.MEDIUM;

    try {
      const prompt = `נתח תקלה. נושא: ${summary} תיאור: ${description}. החזר JSON עם category ו-priority בעברית בלבד.`;
      const aiResponse = await GeminiService.askQuestion("", prompt);
      const cleanJson = aiResponse.answer.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(cleanJson);
      if (Object.values(IssueCategory).includes(parsedData.category)) detectedCategory = parsedData.category;
      if (Object.values(IssuePriority).includes(parsedData.priority)) detectedPriority = parsedData.priority;
    } catch (e) { console.error(e); }

    const newIssue: Issue = {
      id: uuidv4(),
      summary,
      description,
      category: detectedCategory,
      priority: detectedPriority,
      status: 'open',
      createdAt: Date.now(),
      username: userName,
      userRole: department,
      attachments: attachments
    };

    await StorageService.saveIssue(newIssue);

    setIsSubmitting(false);
    setIsSuccess(true);
    setSummary(''); setDescription(''); setAttachments([]);
    setTimeout(() => setIsSuccess(false), 3000);
  };

  if (!isAuthenticated) { 
    return (
      <div className="flex-1 min-h-screen bg-slate-50 flex justify-center items-center p-6 w-full text-right rtl">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
          <h2 className="text-2xl font-bold text-[#432A61] mb-6">זיהוי עובד</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none text-right" placeholder="שם מלא" required />
            <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none text-right" required>
              <option value="" disabled>בחר מחלקה...</option>
              <option value="מרכז שירות">מרכז שירות</option><option value="ביקורת עסקים">ביקורת עסקים</option><option value="תכנון הנדסי">תכנון הנדסי</option><option value="רישוי הנדסי">רישוי הנדסי</option><option value="הנהלה">הנהלה</option>
            </select>
            <button type="submit" className="w-full bg-[#432A61] text-white py-3.5 rounded-xl font-bold">המשך לדיווח</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-slate-100 flex justify-center items-center p-4 text-right rtl">
      <div className="absolute top-6 left-6 flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 flex-row-reverse">
         <User size={16} className="text-[#432A61]" /> <span className="text-sm font-medium">{userName}</span>
         <button onClick={handleLogout} className="text-red-500 hover:underline text-xs mr-2">התנתק</button>
      </div>
      <div className="w-full max-w-3xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-8">
        {isSuccess ? <div className="text-center py-20"><CheckCircle size={80} className="text-green-500 mx-auto mb-4" /> <h3 className="text-2xl font-bold">הדיווח נשמר בענן!</h3></div> : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-bold text-[#432A61]">דיווח תקלה חדשה</h2>
            <input type="text" value={summary} onChange={(e) => setSummary(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border rounded-xl text-right" placeholder="נושא התקלה" required />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border rounded-xl h-32 text-right" placeholder="תיאור מלא..." required />
            <button type="submit" disabled={isSubmitting} className="w-full bg-[#432A61] text-white py-4 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2">
              {isSubmitting ? 'שומר בענן...' : 'שלח דיווח'} <Send size={18} className="rotate-[-180deg]" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
