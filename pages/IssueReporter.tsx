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

  // --- מנגנון העלאת קבצים (החזרתי את מה שנמחק!) ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newAttachment: Attachment = {
          id: uuidv4(),
          name: file.name,
          type: file.type,
          size: file.size,
          data: event.target?.result as string
        };
        setAttachments(prev => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary || !description) return;
    setIsSubmitting(true);
    setAiStatus('ה-AI מנתח ומסווג את התקלה...');

    let detectedCategory = IssueCategory.OTHER;
    let detectedPriority = IssuePriority.MEDIUM;

    try {
      const prompt = `נתח תקלה. נושא: ${summary} תיאור: ${description}. החזר JSON עם category ו-priority בעברית.`;
      const aiResponse = await GeminiService.askQuestion("", prompt);
      const cleanJson = aiResponse.answer.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(cleanJson);
      if (Object.values(IssueCategory).includes(parsedData.category)) detectedCategory = parsedData.category;
      if (Object.values(IssuePriority).includes(parsedData.priority)) detectedPriority = parsedData.priority;
    } catch (e) { console.error("AI Analysis failed"); }

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
      <div className="flex-1 min-h-screen bg-slate-50 flex justify-center items-center p-6 w-full text-right" dir="rtl">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border">
          <h2 className="text-2xl font-bold text-[#432A61] mb-6">זיהוי עובד</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none" placeholder="שם מלא" required />
            <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none" required>
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
    <div className="h-screen w-full bg-slate-100 flex justify-center items-center p-4 text-right" dir="rtl">
      <div className="absolute top-6 right-6 flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border">
         <User size={16} className="text-[#432A61]" /> <span className="text-sm font-medium">{userName}</span>
         <button onClick={() => setIsAuthenticated(false)} className="text-red-500 hover:underline text-xs mr-2">התנתק</button>
      </div>

      <div className="w-full max-w-3xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-8">
        {isSuccess ? <div className="text-center py-20"><CheckCircle size={80} className="text-green-500 mx-auto mb-4" /> <h3 className="text-2xl font-bold">הדיווח נשמר בענן!</h3></div> : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-bold text-[#432A61] w-full text-right">דיווח תקלה חדשה</h2>
            
            <div className="space-y-4">
              <input type="text" value={summary} onChange={(e) => setSummary(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border rounded-xl" placeholder="נושא התקלה" required />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border rounded-xl h-32" placeholder="תיאור מלא..." required />
            </div>

            {/* --- אזור צרופות --- */}
            <div className="flex flex-wrap gap-2">
              {attachments.map(file => (
                <div key={file.id} className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-medium">
                  <Paperclip size={12} /> <span className="truncate max-w-[100px]">{file.name}</span>
                  <button type="button" onClick={() => removeAttachment(file.id)} className="hover:text-red-500"><X size={14}/></button>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" multiple />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:border-[#432A61] hover:text-[#432A61] transition-all">
                <Paperclip size={20} /> צרף קבצים
              </button>
              <button type="submit" disabled={isSubmitting} className="flex-1 bg-[#432A61] text-white py-4 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2">
                {isSubmitting ? 'שומר...' : 'שלח דיווח'} <Send size={18} className="rotate-[-180deg]" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
