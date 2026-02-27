import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { siteConfig } from '../config';

// כאן תוסיף את הייבוא של ה-Service שלך (למשל geminiService)
// import { geminiService } from '../services/geminiService';

export const UserDashboard: React.FC = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // פונקציית השליחה המקורית שלך - וודא שהיא מחוברת ל-geminiService שלך
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    const userMsg = { id: Date.now().toString(), text: query, role: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    
    // כאן תוסיף את הקריאה ל-Gemini כפי שהיה לך קודם
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 p-8 bg-slate-100 h-screen overflow-hidden">
      <div className="max-w-5xl mx-auto h-full flex flex-col bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden">
        
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between flex-row-reverse">
          <div className="flex items-center gap-4">
            <div className="bg-[#432A61] p-3 rounded-2xl text-white shadow-lg"><Bot size={24} /></div>
            <div className="text-right">
              <h2 className="text-lg font-bold text-[#432A61]">{siteConfig.clientSystemName}</h2>
              <p className="text-xs text-slate-500 font-bold">{siteConfig.clientName}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-8 space-y-6 overflow-y-auto bg-white text-right">
          {messages.map((m) => (
            <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-5 rounded-[1.5rem] max-w-[80%] shadow-sm ${m.role === 'user' ? 'bg-[#432A61] text-white rounded-br-none' : 'bg-slate-100 text-slate-900 border border-slate-200 rounded-bl-none'}`}>
                {m.text}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="p-6 bg-white border-t border-slate-100">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-right focus:border-[#432A61] outline-none shadow-inner"
              placeholder={siteConfig.inputPlaceholder}
            />
            <button type="submit" className="bg-[#432A61] hover:bg-[#35214D] text-white p-4 rounded-2xl shadow-xl transition-all">
              <Send size={22} className="rotate-[-45deg]" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
