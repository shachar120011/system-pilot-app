import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { siteConfig } from '../config';
import { geminiService } from '../services/geminiService'; // וודא שהנתיב תקין אצלך

export const UserDashboard: React.FC = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMsg = { id: Date.now().toString(), text: query, role: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setIsLoading(true);

    try {
      // כאן החזרתי את הקריאה האמיתית לשירות שלך!
      const response = await geminiService.generateResponse(query);
      const botMsg = { id: (Date.now() + 1).toString(), text: response, role: 'model' };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Error calling Gemini:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    // המרכוז מתבצע כאן בעזרת mr-64 (כדי לפנות מקום לסיידבר) ו-justify-center
    <div className="flex-1 h-screen bg-slate-50 flex justify-center items-center p-4 md:p-12 mr-20 md:mr-72 transition-all duration-300">
      <div className="w-full max-w-5xl h-full flex flex-col bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* כותרת - מערכת רישוי עסקים */}
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between flex-row-reverse">
          <div className="flex items-center gap-5">
            <div className="bg-[#432A61] p-4 rounded-2xl text-white shadow-lg"><Bot size={30} /></div>
            <div className="text-right">
              <h2 className="text-2xl font-black text-[#432A61] tracking-tight">{siteConfig.clientSystemName}</h2>
              <p className="text-sm text-slate-500 font-bold">{siteConfig.clientName}</p>
            </div>
          </div>
        </div>

        {/* הודעות צאט */}
        <div className="flex-1 p-8 space-y-8 overflow-y-auto bg-white text-right">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-30">
               <Bot size={64} className="text-[#432A61] mb-4" />
               <p className="text-xl font-bold text-[#432A61]">{siteConfig.botWelcomeTitle}</p>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-6 rounded-[2rem] max-w-[75%] text-lg shadow-sm ${
                m.role === 'user' ? 'bg-[#432A61] text-white rounded-br-none' : 'bg-slate-100 text-slate-900 border border-slate-200 rounded-bl-none'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {isLoading && <div className="flex justify-start"><Loader2 className="animate-spin text-[#432A61]" /></div>}
          <div ref={chatEndRef} />
        </div>

        {/* הזנת הודעה */}
        <div className="p-8 bg-white border-t border-slate-100">
          <form onSubmit={handleSendMessage} className="flex gap-4 max-w-4xl mx-auto">
            <input 
              value={query} onChange={(e) => setQuery(e.target.value)}
              className="flex-1 px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-right text-lg focus:border-[#432A61] outline-none shadow-inner transition-all"
              placeholder={siteConfig.inputPlaceholder}
            />
            <button type="submit" className="bg-[#432A61] hover:bg-[#35214D] text-white p-5 rounded-2xl shadow-2xl transition-all transform hover:scale-105 active:scale-95">
              <Send size={28} className="rotate-[-45deg]" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
