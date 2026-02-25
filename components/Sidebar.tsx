import React from 'react';
import { MessageSquare, AlertTriangle, BookOpen, Shield, LogOut, Activity } from 'lucide-react';
import { siteConfig } from '../config'; // הייבוא של קובץ ההגדרות שלנו!

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isAdmin, setIsAdmin }) => {
  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-full shadow-2xl relative z-20">
      {/* אזור המיתוג - שואב נתונים אוטומטית מקובץ הקונפיגורציה */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-indigo-500 p-2 rounded-xl shadow-lg shadow-indigo-500/30">
            <Shield size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              {siteConfig.platformName}
            </h1>
          </div>
        </div>
        <div className="text-xs font-medium text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700 inline-block mt-2">
          {siteConfig.clientName} | {siteConfig.clientSystemName}
        </div>
      </div>

      {/* תפריט ניווט */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {!isAdmin ? (
          <>
            <button
              onClick={() => setActiveView('chat')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                activeView === 'chat' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <MessageSquare size={20} />
              עוזר וירטואלי (AI)
            </button>
            <button
              onClick={() => setActiveView('report')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                activeView === 'report' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <AlertTriangle size={20} />
              דיווח תקלה מורכבת
            </button>
          </>
        ) : (
          <>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-4 px-4">ניהול מערכת</div>
            <button
              onClick={() => setActiveView('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                activeView === 'dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Activity size={20} />
              לוח בקרה מרכזי
            </button>
            <button
              onClick={() => setActiveView('reports')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                activeView === 'reports' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <AlertTriangle size={20} />
              ניהול תקלות
            </button>
            <button
              onClick={() => setActiveView('queries')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                activeView === 'queries' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <MessageSquare size={20} />
              יומן שאלות
            </button>
            <button
              onClick={() => setActiveView('knowledge')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                activeView === 'knowledge' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <BookOpen size={20} />
              מאגר ידע ונהלים
            </button>
          </>
        )}
      </nav>

      {/* אזור תחתון - כניסת מנהל */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={() => {
            if (isAdmin) {
              setIsAdmin(false);
              setActiveView('chat');
            } else {
              setActiveView('dashboard');
              setIsAdmin(true);
            }
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all font-medium text-sm border border-slate-700"
        >
          {isAdmin ? <LogOut size={16} /> : <Shield size={16} />}
          {isAdmin ? 'יציאה ממצב מנהל' : 'כניסת מנהל מערכת'}
        </button>
      </div>
    </div>
  );
};
