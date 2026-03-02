import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, LogIn, LogOut } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { siteConfig } from '../config';
import { GeminiService } from '../services/geminiService';
import { StorageService } from '../services/storageService';

export const UserDashboard: React.FC = () => {
  const [userName, setUserName] = useState('');
  const [department, setDepartment] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // בדיקה אם המשתמש כבר מחובר ממסך אחר
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMsg = { id: Date.now().toString(), text: query, role: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setIsLoading(true);

    try {
      // תיקון: הוספת await כי השירות עכשיו עובד מול ענן (Supabase)
      const systemContext = await StorageService.getFullContextText();
      const result = await GeminiService.askQuestion(systemContext, userMsg.text);
      
      // תיקון: הוספת await לשמירת השאילתה ב-Chat_Logs
      await StorageService.saveQuery({
        id: Date.now().toString(),
        timestamp: Date.now(),
        username: userName,
        department: department,
        question: userMsg.text,
        answer: result.answer,
        isAnswered: true
      });

      const botMsg = { id: (Date.now() + 1).toString(), text: result.answer, role: 'model' };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat Error:", error);
      const errorMsg = { id: (Date.now() + 1).toString(), text: "מצטער, הייתה בעיה בעיבוד הבקשה שלך. אנא נסה שנית.", role: 'model' };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isAuthenticated) {
    return (
      <div className="flex-1 min-h-screen bg-slate-50 flex justify-center items-center p-6 w-full text-right">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-[#432A61] p-4 rounded-full text-white shadow-lg mb-4">
              <LogIn size={32} />
            </div>
            <h2 className="text-2xl font-bold text-[#432A61] tracking-wide">כניסה למערכת</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">{siteConfig.clientName}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">שם מלא</label>
              <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-right outline-none focus:border-[#432A61] focus:ring-1 focus:ring-[#432A61] transition-all" placeholder="הזן את שמך..." required />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">מחלקה</label>
              <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-right outline-none focus:border-[#432A61] focus:ring-1 focus:ring-[#432A61] appearance-none cursor-pointer transition-all" required >
                <option value="" disabled>בחר מחלקה...</option>
                <option value="מרכז שירות">מרכז שירות</option>
                <option value="ביקורת עסקים">ביקורת עסקים</option>
                <option value="תכנון הנדסי">תכנון הנדסי</option>
                <option value="רישוי הנדסי">רישוי הנדסי</option>
                <option value="הנהלה">הנהלה</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-[#432A61] text-white py-3.5 rounded-xl font-bold shadow-lg shadow-[#432A61]/30 hover:bg-[#2d1b42] transition-all mt-6">הכנס למערכת</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-screen bg-slate-50 flex justify-center items-center p-4 md:p-8 w-full overflow-hidden text-right">
      <div className="w-full max-w-5xl h-full max-h-[90vh] flex flex-col bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden relative z-10">
        <div className="p-5 md:p-6 border-b border-slate-100 bg-white flex items-center justify-between flex-row-reverse z-20 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-[#432A61] to-[#603b8e] p-3 rounded-2xl text-white shadow-md">
              <Bot size={26} />
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-[#432A61] tracking-wide">{siteConfig.clientSystemName}</h2>
              <p className="text-xs text-slate-500 font-medium">{siteConfig.clientName}</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-slate-600 bg-slate-50 px-4 py-2 rounded-full border border-slate-200 flex-row-reverse">
             <User size={16} className="text-[#432A61]" />
             <span className="text-sm font-medium">{userName} <span className="opacity-50 mx-1">|</span> {department}</span>
             <button onClick={handleLogout} className="mr-2 text-red-500 hover:text-red-700 transition-colors" title="התנתק"><LogOut size={14}/></button>
          </div>
        </div>

        <div className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto bg-slate-50/50">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-40 text-[#432A61] animate-fadeIn">
               <Bot size={72} className="mb-4" />
               <p className="text-xl font-bold tracking-wide">{siteConfig.botWelcomeTitle}</p>
               <p className="text-sm mt-2 font-medium">איך אפשר לעזור לך היום?</p>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
              <div className={`p-5 rounded-2xl max-w-[85%] md:max-w-[75%] text-[15px] shadow-sm ${m.role === 'user' ? 'bg-gradient-to-l from-[#432A61] to-[#55357a] text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'}`}>
                {m.role === 'model' ? (
                  <div className="prose prose-sm prose-slate rtl text-right max-w-none"><ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown></div>
                ) : ( m.text )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start px-4 animate-fadeIn">
              <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-3 text-slate-500 text-sm font-medium">
                <Loader2 size={18} className="animate-spin text-[#432A61]" /> המערכת מנתחת נתונים ומקלידה תשובה...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 md:p-6 bg-white border-t border-slate-100">
          <form onSubmit={handleSendMessage} className="flex gap-3 w-full mx-auto flex-row-reverse relative">
            <input value={query} onChange={(e) => setQuery(e.target.value)} className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-right outline-none focus:border-[#432A61] focus:ring-1 focus:ring-[#432A61] focus:bg-white transition-all text-slate-700" placeholder={siteConfig.inputPlaceholder} disabled={isLoading} />
            <button type="submit" disabled={isLoading || !query.trim()} className="bg-[#432A61] disabled:bg-slate-300 disabled:cursor-not-allowed text-white p-4 rounded-2xl shadow-md hover:shadow-lg hover:bg-[#2d1b42] transition-all flex items-center justify-center shrink-0">
              <Send size={24} className="rotate-[-180deg]" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
