import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, AlertTriangle, CheckCircle2, Loader2, Sparkles, UserCircle, Briefcase, ArrowLeft, HelpCircle, Paperclip, X, File, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GeminiService } from '../services/geminiService';
import { StorageService } from '../services/storageService';
import { ChatMessage, Issue, UserQuery, Attachment } from '../types';
import { v4 as uuidv4 } from 'uuid';
// הייבוא החדש שהוספנו:
import { buildSystemContext } from '../utils/contextBuilder';
import { siteConfig } from '../config';

interface UserDashboardProps {
  activeView: string;
}

const DEPARTMENTS = [
  "רישוי הנדסי",
  "תכנון הנדסי",
  "מרכז שירות",
  "ביקורת עסקים",
  "נגישות",
  "הנהלה",
  "אחר"
];

// Backend URL for Google Sheets logging
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxPPfvD25VIF26Q8fpgAmliJCfe3u2VIl_5jUzWqgJv7cvmmKMA9_DCFnOKwR-B89M_/exec";

// Helper function for reliable logging
const logToGoogleSheets = async (sheetName: string, dataRow: any[]) => {
  try {
    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        sheet: sheetName,
        data: dataRow
      }),
      keepalive: true // Ensures request completes even if page unloads
    });
  } catch (error) {
    console.error(`Failed to log to ${sheetName}:`, error);
  }
};

export const UserDashboard: React.FC<UserDashboardProps> = ({ activeView }) => {
  // --- Chat State ---
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: `${siteConfig.botWelcomeTitle} ${siteConfig.botWelcomeSubtitle}`, timestamp: Date.now() }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Chat Identity
  const [chatUsername, setChatUsername] = useState('');
  const [chatDepartment, setChatDepartment] = useState('');
  const [isIdentified, setIsIdentified] = useState(false);

  // --- Report State ---
  const [issueText, setIssueText] = useState('');
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeView, isIdentified]);

  const handleIdentitySubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (chatUsername.trim() && chatDepartment.trim()) {
          setIsIdentified(true);
          // Auto-fill report form if empty
          if (!userName) setUserName(chatUsername);
          if (!userRole) setUserRole(chatDepartment);
      }
  };

  const handleSendMessage = async (textOverride?: string) => {
    const currentQueryText = textOverride || query;
    if (!currentQueryText.trim()) return;

    const userMsg: ChatMessage = { id: uuidv4(), role: 'user', text: currentQueryText, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setIsTyping(true);

    try {
        // השינוי החשוב: עכשיו אנחנו שואבים את המידע מתוך ה-Context Builder שלנו
        const context = buildSystemContext();
        
        // AI Call
        const qaResponse = await GeminiService.askQuestion(context, userMsg.text);

        const modelMsg: ChatMessage = { 
            id: uuidv4(), 
            role: 'model', 
            text: qaResponse.answer, 
            suggestions: qaResponse.suggestions,
            timestamp: Date.now() 
        };
        
        setMessages(prev => [...prev, modelMsg]);

        // Save Query for Admin Report
        const userQuery: UserQuery = {
            id: uuidv4(),
            username: chatUsername,
            department: chatDepartment,
            question: currentQueryText,
            answer: qaResponse.answer,
            timestamp: Date.now(),
            isAnswered: true 
        };
        StorageService.saveQuery(userQuery);

        // --- Log to Google Sheets (Chat_Logs) ---
        logToGoogleSheets("Chat_Logs", [
            new Date().toISOString(),
            chatUsername,
            chatDepartment,
            "משתמש",
            currentQueryText,
            qaResponse.answer
        ]);

    } catch (error: any) {
        console.error("Chat Error:", error);
        let errorText = "אירעה שגיאה בעיבוד הבקשה.";
        
        if (error.message && error.message.includes("System Configuration Error")) {
            errorText = "⚠️ **שגיאת תצורה**: מפתח ה-API של Gemini חסר. אנא וודא שקובץ `.env` מוגדר כראוי עם `VITE_GEMINI_API_KEY`.";
        }

        const errorMsg: ChatMessage = { 
            id: uuidv4(), 
            role: 'model', 
            text: errorText, 
            timestamp: Date.now() 
        };
        setMessages(prev => [...prev, errorMsg]);
    } finally {
        setIsTyping(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const newAttachments: Attachment[] = [];

      for (let i = 0; i < files.length; i++) {
          const file = files[i];
          // Limit size for demo purposes (Local Storage limits)
          if (file.size > 1024 * 1024) { 
              alert(`הקובץ ${file.name} גדול מדי (מקסימום 1MB לדמו)`);
              continue;
          }

          const reader = new FileReader();
          const attachmentPromise = new Promise<Attachment>((resolve) => {
              reader.onload = (e) => {
                  resolve({
                      name: file.name,
                      type: file.type,
                      data: e.target?.result as string
                  });
              };
              reader.readAsDataURL(file);
          });

          const attachment = await attachmentPromise;
          newAttachments.push(attachment);
      }

      setAttachments(prev => [...prev, ...newAttachments]);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
      setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleReportIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueText.trim() || !userName.trim() || !userRole.trim()) return;

    setIsSubmitting(true);
    
    try {
        // AI Analysis for classification
        const analysis = await GeminiService.analyzeIssue(issueText);

        const newIssue: Issue = {
          id: uuidv4(),
          description: issueText,
          summary: analysis.summary,
          priority: analysis.priority,
          category: analysis.category,
          status: 'open',
          createdAt: Date.now(),
          username: userName,
          userRole: userRole,
          treatmentNotes: '',
          attachments: attachments
        };

        StorageService.saveIssue(newIssue);

        // --- Log to Google Sheets (Bug_Reports) ---
        await logToGoogleSheets("Bug_Reports", [
          new Date().toISOString(),
          newIssue.id,
          userName,
          userRole, 
          analysis.category,
          analysis.priority,
          analysis.summary,
          issueText,
          'open'
        ]);

        setSubmitSuccess(true);
        setIssueText('');
        setAttachments([]);
        
        setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
        console.error("Report Error:", error);
        alert("אירעה שגיאה בשליחת הדיווח. אנא נסה שנית.");
    } finally {
        setIsSubmitting(false);
    }
  };

  if (activeView === 'report') {
    return (
      <div className="max-w-3xl mx-auto p-6 animate-fadeIn">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">דיווח על תקלה</h1>
        <p className="text-slate-500 mb-8">נתקלת בבעיה? מלא את הפרטים הבאים ונחזור אליך בהקדם.</p>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 relative overflow-hidden">
          {isSubmitting && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
              <Loader2 className="animate-spin text-blue-600 mb-3" size={48} />
              <p className="text-lg font-medium text-slate-700">שולח דיווח ומעדכן מערכות...</p>
            </div>
          )}

          {submitSuccess ? (
            <div className="flex flex-col items-center justify-center py-12 text-green-600 animate-scaleIn">
              <CheckCircle2 size={64} className="mb-4" />
              <h2 className="text-2xl font-bold">הדיווח התקבל בהצלחה!</h2>
              <p className="text-slate-500 mt-2">סיווגנו את התקלה והעברנו אותה למנהל המערכת.</p>
            </div>
          ) : (
            <form onSubmit={handleReportIssue}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">שם מלא</label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
                      placeholder="ישראל ישראלי"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">תפקיד / מחלקה</label>
                    <div className="relative">
                      <select
                        value={userRole}
                        onChange={(e) => setUserRole(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 appearance-none"
                        required
                      >
                        <option value="" disabled>בחר מחלקה...</option>
                        {DEPARTMENTS.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
              </div>

              <div className="mb-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">תאר את הבעיה בפירוט</label>
                <textarea
                  value={issueText}
                  onChange={(e) => setIssueText(e.target.value)}
                  className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none text-slate-800"
                  placeholder="למשל: כשאני מנסה לייצא דוח אקסל, המסך נתקע ומקבל הודעת שגיאה..."
                  required
                />
              </div>

              {/* Attachments Section */}
              <div className="mb-6">
                 <div className="flex items-center gap-2 mb-2">
                     <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 font-medium"
                     >
                         <Paperclip size={16} />
                         צרף קבצים/צילומי מסך
                     </button>
                     <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                        multiple 
                        accept="image/*,.pdf,.doc,.docx,.txt"
                     />
                 </div>
                 
                 {attachments.length > 0 && (
                     <div className="flex flex-wrap gap-2">
                         {attachments.map((file, idx) => (
                             <div key={idx} className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full text-xs text-slate-700 border border-slate-200">
                                 <File size={12} className="text-slate-400" />
                                 <span className="truncate max-w-[150px]">{file.name}</span>
                                 <button 
                                    type="button" 
                                    onClick={() => removeAttachment(idx)}
                                    className="hover:text-red-500 transition-colors"
                                 >
                                     <X size={14} />
                                 </button>
                             </div>
                         ))}
                     </div>
                 )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!issueText.trim() || !userName.trim() || !userRole.trim() || isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
                >
                  <AlertTriangle size={20} />
                  שלח דיווח
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Identity Check Screen
  if (!isIdentified) {
      return (
          <div className="flex flex-col items-center justify-center h-full p-6 animate-fadeIn">
              <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 max-w-md w-full">
                  <div className="text-center mb-6">
                      <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                          <Bot size={32} />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-800">ברוכים הבאים!</h2>
                      <p className="text-slate-500 mt-2">אנא הזינו את פרטיכם כדי להתחיל לשוחח עם העוזר האישי</p>
                  </div>

                  <form onSubmit={handleIdentitySubmit} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">שם מלא</label>
                          <div className="relative">
                              <UserCircle size={20} className="absolute top-3 right-3 text-slate-400" />
                              <input 
                                type="text" 
                                value={chatUsername}
                                onChange={(e) => setChatUsername(e.target.value)}
                                className="w-full pr-10 pl-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="למשל: ישראל ישראלי"
                                required
                              />
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">מחלקה / צוות</label>
                          <div className="relative">
                              <Briefcase size={20} className="absolute top-3 right-3 text-slate-400 z-10" />
                              <select 
                                value={chatDepartment}
                                onChange={(e) => setChatDepartment(e.target.value)}
                                className="w-full pr-10 pl-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                                required
                              >
                                <option value="" disabled>בחר מחלקה...</option>
                                {DEPARTMENTS.map(dept => (
                                  <option key={dept} value={dept}>{dept}</option>
                                ))}
                              </select>
                              <ChevronDown size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          </div>
                      </div>
                      <button 
                        type="submit"
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 mt-4"
                      >
                          התחל שיחה
                          <ArrowLeft size={20} />
                      </button>
                  </form>
              </div>
          </div>
      );
  }

  // Default: Chat Search View
  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto">
      {/* Identity Bar */}
      <div className="bg-white border-b border-slate-200 p-3 px-6 flex items-center justify-between gap-3 shadow-sm">
         <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                <UserCircle size={20} />
            </div>
            <div>
                <div className="text-sm font-bold text-slate-800">{chatUsername}</div>
                <div className="text-xs text-slate-500">{chatDepartment}</div>
            </div>
         </div>
         <button 
            onClick={() => setIsIdentified(false)}
            className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
         >
             החלף משתמש
         </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
             <div className={`flex items-start gap-4 mb-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'model' ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-200' : 'bg-slate-200'
                } shadow-lg`}>
                {msg.role === 'model' ? <Bot size={20} className="text-white" /> : <User size={20} className="text-slate-600" />}
                </div>
                <div className={`max-w-[90%] md:max-w-[80%] p-4 rounded-2xl shadow-sm ${
                msg.role === 'model' 
                    ? 'bg-white text-slate-800 rounded-tr-none border border-slate-100' 
                    : 'bg-blue-600 text-white rounded-tl-none shadow-blue-200'
                }`}>
                    {msg.role === 'model' ? (
                        <div className="prose prose-sm prose-slate max-w-none dark:prose-invert">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {msg.text}
                            </ReactMarkdown>
                        </div>
                    ) : (
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    )}
                </div>
            </div>

            {/* Suggestions / Did you mean */}
            {msg.role === 'model' && msg.suggestions && msg.suggestions.length > 0 && (
                <div className="ml-14 flex flex-wrap gap-2 mb-4 animate-fadeIn">
                    <span className="text-xs text-slate-400 flex items-center gap-1 w-full mb-1">
                        <HelpCircle size={12} />
                        אולי התכוונת ל...
                    </span>
                    {msg.suggestions.map((suggestion, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSendMessage(suggestion)}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm px-3 py-1.5 rounded-full border border-indigo-200 transition-colors shadow-sm"
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex items-start gap-4 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Bot size={20} className="text-white" />
            </div>
            <div className="bg-white p-4 rounded-2xl rounded-tr-none shadow-sm border border-slate-100 flex items-center gap-3">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-xs text-slate-400 font-medium">חושב...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-200">
        <div className="relative bg-white rounded-2xl shadow-lg border border-slate-200 flex items-center p-2 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="שאל כל דבר על המערכת החדשה..."
            className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-slate-800 placeholder-slate-400"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!query.trim() || isTyping}
            className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTyping ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
        <div className="text-center mt-3 flex items-center justify-center gap-2 text-xs text-slate-400">
           <Sparkles size={12} className="text-blue-500" />
           <span>מופעל על ידי Gemini 3.0 Flash</span>
        </div>
      </div>
    </div>
  );
};
