import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { siteConfig } from '../config';
// תיקון הייבוא: אם הקוד הקודם נכשל ב-Build, נסה להוריד את הסוגריים המסולסלים
import geminiService from '../services/geminiService'; 

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
      // שימוש ב-Service המקורי שלך לרישוי עסקים
      const response = await geminiService.generateResponse(query);
      const botMsg = { id: (Date.now() + 1).toString(), text: response, role: 'model' };
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

  return (
    // תיקון המרחקים: pr (Padding Right) מוודא שהתוכן לא נכנס מתחת לסיידבר שבימין
    <div className="flex-1 h-screen bg-slate-100 flex justify-center items-center p-6 pr-24 md:pr-80 transition-all duration-300">
      <div className="w-full max-w-5xl h-[90vh] flex flex-col bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* כותרת ממותגת - רישוי עסקים */}
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between flex-row-reverse">
          <div className="flex items-center gap-4">
            <div className="bg-[#432A61] p-3 rounded-2xl text-white shadow-lg">
              <Bot size={28} />
            </div>
            <div className="text-right">
              <h2 className="text-xl font-black text-[#432A61]">{cite: siteConfig.clientSystemName}</h2>
              <p className="text-xs text-slate-500 font-bold">{cite: siteConfig.clientName}</p>
            </div>
          </div>
        </div>

        {/* הודעות צאט ממורכזות */}
        <div className="flex-1 p-8 space-y-6 overflow-y-auto bg-white text-right">
          {messages.map((m) => (
            <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'flex-row' : 'flex-row-reverse'} justify-end`}>
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

        {/* תיבת קלט */}
        <div className="p-6 bg-white border-t border-slate-100">
          <form onSubmit={handleSendMessage} className="flex gap-4 max-w-4xl mx-auto flex-row-reverse">
            <input 
              value={query} 
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-right outline-none focus:border-[#432A61] shadow-inner"
              placeholder={cite: siteConfig.inputPlaceholder}
            />
            <button type="submit" className="bg-[#432A61] text-white p-4 rounded-2xl shadow-xl transform active:scale-95 transition-all">
              <Send size={24} className="rotate-[-45deg]" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
