import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2, User, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { siteConfig } from '../config';

interface Message {
  id: string;
  text: string;
  role: 'user' | 'model';
  timestamp: Date;
}

export const UserDashboard: React.FC = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: query,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsTyping(true);

    // כאן תבוא הלוגיקה של ה-API שלך
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "אני כאן כדי לעזור לך להטמיע את המערכת בצורה הטובה ביותר. מה תרצה לדעת?",
        role: 'model',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex-1 p-4 md:p-8 flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* כרטיס הצאט המרכזי - Bento Style */}
      <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col bg-white rounded-[2.5rem] shadow-2xl shadow-brand-900/5 border border-brand-100 overflow-hidden mb-4">
        
        {/* כותרת הצאט */}
        <div className="p-6 border-b border-brand-50 bg-brand-50/30 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-row-reverse w-full">
            <div className="bg-brand-500 p-3 rounded-2xl text-white shadow-lg shadow-brand-900/20">
              <Bot size={28} />
            </div>
            <div className="text-right flex-1">
              <h2 className="text-xl font-black text-brand-500 tracking-tight">Inactu AI</h2>
              <div className="flex items-center gap-2 justify-end">
                <span className="text-xs text-slate-500 font-medium">עוזר הטמעה דיגיטלי</span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* אזור ההודעות */}
        <div className="flex-1 p-6 md:p-10 space-y-8 overflow-y-auto bg-white custom-scrollbar">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
              <div className="bg-brand-50 p-6 rounded-full">
                <Sparkles size={48} className="text-brand-500" />
              </div>
              <p className="text-lg font-medium text-brand-900 leading-relaxed">
                {siteConfig.botWelcomeTitle}
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'model' && (
                <div className="bg-brand-50 p-2.5 rounded-xl text-brand-500 shrink-0 h-10 w-10 flex items-center justify-center border border-brand-100 shadow-sm">
                  <Bot size={20} />
                </div>
              )}
              
              <div className={`p-5 rounded-[1.5rem] max-w-[80%] shadow-sm leading-relaxed text-right ${
                  message.role === 'user'
                    ? 'bg-brand-500 text-white rounded-br-none shadow-brand-900/10' 
                    : 'bg-brand-50 text-brand-900 border border-brand-100 rounded-bl-none'
                }`}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-sm max-w-none">
                  {message.text}
                </ReactMarkdown>
              </div>

              {message.role === 'user' && (
                <div className="bg-brand-500 p-2.5 rounded-xl text-white shrink-0 h-10 w-10 flex items-center justify-center shadow-lg shadow-brand-900/20">
                  <User size={20} />
                </div>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-4 justify-start items-center">
              <div className="bg-brand-50 p-4 rounded-2xl text-brand-500 border border-brand-100">
                <Loader2 size={20} className="animate-spin" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* אזור הזנת הודעה */}
        <div className="p-6 bg-slate-50/50 border-t border-brand-50">
          <form onSubmit={handleSendMessage} className="flex gap-3 max-w-4xl mx-auto">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={siteConfig.inputPlaceholder}
              className="flex-1 px-6 py-4 bg-white border border-brand-100 rounded-2xl text-slate-800 focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 shadow-sm transition-all text-right"
            />
            <button
              type="submit"
              disabled={isTyping}
              className="bg-brand-500 hover:bg-brand-600 text-white p-4 rounded-2xl transition-all shadow-xl shadow-brand-900/20 flex items-center justify-center disabled:opacity-50"
            >
              {isTyping ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} className="rotate-[-45deg] mr-1" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
