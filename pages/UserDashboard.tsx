import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, LogIn } from 'lucide-react';
import { siteConfig } from '../config';
import { GeminiService } from '../services/geminiService'; 

export const UserDashboard: React.FC = () => {
  // --- States עבור האימות ---
  const [userName, setUserName] = useState('');
  const [department, setDepartment] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // --- States עבור הצ'אט ---
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- פונקציות ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim() && department.trim()) {
      setIsAuthenticated(true);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMsg = { id: Date.now().toString(), text: query, role: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setIsLoading(true);

    try {
      const result = await GeminiService.askQuestion("", query);
      const botMsg = { id: (Date.now() + 1).toString(), text: result.answer, role: 'model' };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // --- רינדור מסך אימות (התחברות) ---
  if (!isAuthenticated) {
    return (
      <div className="flex-1 min-h-screen bg-slate-100 flex justify-center items-center p-6">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-2xl border border-slate-200">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-[#432A61] p-4 rounded-full text-white shadow-lg mb-4">
              <LogIn size={32} />
            </div>
            <h2 className="text-2xl font-black text-[#432A61]">כניסה למערכת</h2>
            <p className="text-sm text-slate-500">{siteConfig.clientName}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 text-right">שם מלא</label>
              <input 
                type="text" 
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-right outline-none focus:border-[#432A61] focus:ring-1 focus:ring-[#432A61]"
                placeholder="הזן את שמך..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 text-right">מחלקה</label>
              <select 
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-right outline-none focus:border-[#432A61] focus:ring-1 focus:ring-[#432A61] appearance-none cursor-pointer"
                required
              >
                <option value="" disabled>בחר מחלקה...</option>
                <option value="licensing">רישוי עסקים</option>
                <option value="engineering">הנדסה</option>
                <option value="sanitation">תברואה</option>
                <option value="management">הנהלה</option>
              </select>
            </div>
            <button 
              type="submit" 
              className="w-full bg-[#432A61] text-white py-3 rounded-xl font-bold shadow-lg hover:bg-[#2d1b42] transition-colors mt-6"
            >
              הכנס למערכת
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- רינדור מסך הצ'אט (לאחר התחברות) ---
  return (
    // הסרתי את ה-mr-72 והשתמשתי ב-w-full כדי לתת לו לתפוס את השטח הנותר באופן טבעי
    <div className="flex-1 h-screen bg-slate-100 flex justify-center items-center p-6 w-full">
      <div className="w-full max-w-5xl h-[92vh] flex flex-col bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* כותרת הצ'אט */}
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between flex-row-reverse">
          <div className="flex items-center gap-4">
            <div className="bg-[#432A61] p-3 rounded-2xl text-white shadow-lg"><Bot size={28} /></div>
            <div className="text-right">
              <h2 className="text-xl font-black text-[#432A61]">{siteConfig.clientSystemName}</h2>
              <p className="text-xs text-slate-500 font-bold">{siteConfig.clientName}</p>
            </div>
          </div>
          {/* מציג את פרטי המשתמש המחובר */}
          <div className="flex items-center gap-2 text-slate-600 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
             <User size={16} />
             <span className="text-sm font-medium">{userName} | {department === 'licensing' ? 'רישוי עסקים' : department}</span>
          </div>
        </div>

        {/* אזור ההודעות */}
        <div className="flex-1 p-8 space-y-6 overflow-y-auto bg-white text-right">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-30 text-[#432A61]">
               <Bot size={64} className="mb-4" />
               <p className="text-xl font-bold">{siteConfig.botWelcomeTitle}</p>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-5 rounded-[1.8rem] max-w-[80%] text-[16px] leading-relaxed shadow-sm ${
                m.role === 'user' 
                  ? 'bg-[#432A61] text-white rounded-br-none' 
                  : 'bg-slate-100 text-slate-900 border border-slate-200 rounded-bl-none'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {isLoading && <div className="flex justify-start px-4"><Loader2 className="animate-spin text-[#432A61]" /></div>}
          <div ref={chatEndRef} />
        </div>

        {/* תיבת קלט הצ'אט */}
        <div className="p-6 bg-white border-t border-slate-100">
          <form onSubmit={handleSendMessage} className="flex gap-4 max-w-4xl mx-auto flex-row-reverse">
            <input 
              value={query} 
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-right outline-none focus:border-[#432A61] shadow-inner"
              placeholder={siteConfig.inputPlaceholder}
            />
            <button type="submit" className="bg-[#432A61] text-white p-4 rounded-2xl shadow-xl transition-all">
              <Send size={24} className="rotate-[-45deg]" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
