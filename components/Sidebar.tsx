import React from 'react';
import { LayoutDashboard, MessageSquareWarning, Search, ShieldCheck, BookOpen, ClipboardList, MessageCircleQuestion, ChevronsRight, ChevronsLeft, User, UserCog } from 'lucide-react';
import { Role } from '../types';

interface SidebarProps {
  currentRole: Role;
  setRole: (role: Role) => void;
  activeView: string;
  setActiveView: (view: string) => void;
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentRole, 
  setRole, 
  activeView, 
  setActiveView,
  isCollapsed,
  toggleSidebar
}) => {
  return (
    <div 
      className={`bg-slate-900 text-white flex flex-col h-screen transition-all duration-300 shadow-xl fixed right-0 z-50 ${
        isCollapsed ? 'w-20' : 'w-20 md:w-64'
      }`}
    >
      {/* Header / Logo */}
      <div className="p-6 flex items-center justify-center md:justify-start gap-3 border-b border-slate-700 relative">
        <div className="bg-blue-600 p-2 rounded-lg shrink-0">
          <ShieldCheck size={24} className="text-white" />
        </div>
        
        <div className={`flex flex-col transition-all duration-300 ${
            isCollapsed ? 'w-0 opacity-0 hidden' : 'hidden md:flex w-auto opacity-100'
        }`}>
            <span className="text-xl font-bold whitespace-nowrap overflow-hidden leading-tight">
                SystemPilot
            </span>
            <span className="text-xs text-slate-400 whitespace-nowrap font-medium">
                רישוי עסקים
            </span>
        </div>
        
        {/* Toggle Button */}
        <button 
            onClick={toggleSidebar}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 bg-slate-800 border border-slate-600 rounded-full p-1 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors hidden md:flex"
        >
            {isCollapsed ? <ChevronsLeft size={16} /> : <ChevronsRight size={16} />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 flex flex-col gap-2 px-3 overflow-y-auto overflow-x-hidden">
        {currentRole === Role.USER ? (
          <>
            <button
              onClick={() => setActiveView('search')}
              title={isCollapsed ? "עזרה וחיפוש" : ""}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                activeView === 'search' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              } ${isCollapsed ? 'justify-center' : 'md:justify-start justify-center'}`}
            >
              <Search size={22} className="shrink-0" />
              <span className={`font-medium whitespace-nowrap transition-all duration-300 ${
                  isCollapsed ? 'hidden' : 'hidden md:block'
              }`}>עזרה וחיפוש</span>
            </button>
            <button
              onClick={() => setActiveView('report')}
              title={isCollapsed ? "דיווח על תקלה" : ""}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                activeView === 'report' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              } ${isCollapsed ? 'justify-center' : 'md:justify-start justify-center'}`}
            >
              <MessageSquareWarning size={22} className="shrink-0" />
              <span className={`font-medium whitespace-nowrap transition-all duration-300 ${
                  isCollapsed ? 'hidden' : 'hidden md:block'
              }`}>דיווח על תקלה</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setActiveView('dashboard')}
              title={isCollapsed ? "לוח בקרה" : ""}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                activeView === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              } ${isCollapsed ? 'justify-center' : 'md:justify-start justify-center'}`}
            >
              <LayoutDashboard size={22} className="shrink-0" />
              <span className={`font-medium whitespace-nowrap transition-all duration-300 ${
                  isCollapsed ? 'hidden' : 'hidden md:block'
              }`}>לוח בקרה</span>
            </button>
            <button
              onClick={() => setActiveView('reports')}
              title={isCollapsed ? "דוח בקרה (תקלות)" : ""}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                activeView === 'reports' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              } ${isCollapsed ? 'justify-center' : 'md:justify-start justify-center'}`}
            >
              <ClipboardList size={22} className="shrink-0" />
              <span className={`font-medium whitespace-nowrap transition-all duration-300 ${
                  isCollapsed ? 'hidden' : 'hidden md:block'
              }`}>דוח בקרה (תקלות)</span>
            </button>
            <button
              onClick={() => setActiveView('queries')}
              title={isCollapsed ? "תיעוד שאלות" : ""}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                activeView === 'queries' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              } ${isCollapsed ? 'justify-center' : 'md:justify-start justify-center'}`}
            >
              <MessageCircleQuestion size={22} className="shrink-0" />
              <span className={`font-medium whitespace-nowrap transition-all duration-300 ${
                  isCollapsed ? 'hidden' : 'hidden md:block'
              }`}>תיעוד שאלות</span>
            </button>
            <button
              onClick={() => setActiveView('knowledge')}
              title={isCollapsed ? "ניהול ידע" : ""}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                activeView === 'knowledge' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              } ${isCollapsed ? 'justify-center' : 'md:justify-start justify-center'}`}
            >
              <BookOpen size={22} className="shrink-0" />
              <span className={`font-medium whitespace-nowrap transition-all duration-300 ${
                  isCollapsed ? 'hidden' : 'hidden md:block'
              }`}>ניהול ידע</span>
            </button>
          </>
        )}
      </div>

      {/* Role Switcher */}
      <div className="p-4 border-t border-slate-700">
        <div className={`bg-slate-800 rounded-xl p-1 flex ${isCollapsed ? 'flex-col gap-1' : 'flex-row'}`}>
          <button
            onClick={() => setRole(Role.USER)}
            title="משתמש"
            className={`flex items-center justify-center gap-2 flex-1 text-sm py-2 rounded-lg transition-colors ${
                currentRole === Role.USER ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <User size={16} />
            <span className={`${isCollapsed ? 'hidden' : 'hidden md:block'}`}>משתמש</span>
          </button>
          <button
            onClick={() => setRole(Role.ADMIN)}
            title="מנהל"
            className={`flex items-center justify-center gap-2 flex-1 text-sm py-2 rounded-lg transition-colors ${
                currentRole === Role.ADMIN ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCog size={16} />
            <span className={`${isCollapsed ? 'hidden' : 'hidden md:block'}`}>מנהל</span>
          </button>
        </div>
      </div>
    </div>
  );
};