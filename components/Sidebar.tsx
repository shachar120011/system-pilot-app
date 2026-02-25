import React from 'react';
import { MessageSquare, AlertTriangle, BookOpen, Shield, LogOut, Activity, ChevronRight } from 'lucide-react';
import { siteConfig } from '../config'; 
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
  const isAdmin = currentRole === Role.ADMIN;

  return (
    <div className={`bg-slate-900 text-white flex flex-col h-screen shadow-xl fixed right-0 z-50 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      
      {/* אזור המיתוג העליון (דינמי מתוך config.ts) */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between relative">
        {!isCollapsed && (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="bg-indigo-500 p-2 rounded-xl shadow-lg shrink-0">
              <Shield size={20} className="text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-black tracking-tight truncate bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                {siteConfig.platformName}
              </h1>
              <span className="text-[10px] text-slate-400 truncate" title={siteConfig.clientSystemName}>
                {siteConfig.clientName}
              </span>
            </div>
          </div>
        )}
        
        {isCollapsed && (
           <div className="mx-auto bg-indigo-500 p-2 rounded-xl shadow-lg shrink-0">
              <Shield size={20} className="text-white" />
            </div>
        )}

        {/* כפתור כיווץ/הרחבה של התפריט */}
        <button 
          onClick={toggleSidebar} 
          className="p-1 hover:bg-slate-800 rounded-full absolute -left-3 top-6 bg-slate-800 border border-slate-700 z-50 hidden md:flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <ChevronRight size={16} className={`transform transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* תפריט ניווט */}
      <nav className="flex-1 py-4 flex flex-col gap-2 px-3 overflow-y-auto overflow-x-hidden">
        {!isAdmin ? (
          <>
            <NavItem 
              icon={<MessageSquare size={20} />} 
              label="עוזר וירטואלי (AI)" 
              isActive={activeView === 'search'} 
              onClick={() => setActiveView('search')} 
              isCollapsed={isCollapsed} 
            />
            <NavItem 
              icon={<AlertTriangle size={20} />} 
              label="דיווח תקלה" 
              isActive={activeView === 'report'} 
              onClick={() => setActiveView('report')} 
              isCollapsed={isCollapsed} 
            />
          </>
        ) : (
          <>
            {!isCollapsed && <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 mt-2 px-2">ניהול מערכת</div>}
            <NavItem 
              icon={<Activity size={20} />} 
              label="לוח בקרה" 
              isActive={activeView === 'dashboard'} 
              onClick={() => setActiveView('dashboard')} 
              isCollapsed={isCollapsed} 
            />
            <NavItem 
              icon={<AlertTriangle size={20} />} 
              label="ניהול תקלות" 
              isActive={activeView === 'reports'} 
              onClick={() => setActiveView('reports')} 
              isCollapsed={isCollapsed} 
            />
            <NavItem 
              icon={<MessageSquare size={20} />} 
              label="יומן שאלות" 
              isActive={activeView === 'queries'} 
              onClick={() => setActiveView('queries')} 
              isCollapsed={isCollapsed} 
            />
            <NavItem 
              icon={<BookOpen size={20} />} 
              label="מאגר ידע" 
              isActive={activeView === 'knowledge'} 
              onClick={() => setActiveView('knowledge')} 
              isCollapsed={isCollapsed} 
            />
          </>
        )}
      </nav>

      {/* אזור תחתון - החלפת תפקיד (Role) */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={() => setRole(isAdmin ? Role.USER : Role.ADMIN)}
          className={`w-full flex items-center justify-center gap-2 px-3 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all font-medium text-sm border border-slate-700 ${isCollapsed ? 'px-0' : ''}`}
          title={isAdmin ? 'יציאה ממצב מנהל' : 'כניסת מנהל מערכת'}
        >
          {isAdmin ? <LogOut size={18} /> : <Shield size={18} />}
          {!isCollapsed && <span>{isAdmin ? 'יציאה מניהול' : 'כניסת מנהל'}</span>}
        </button>
      </div>
    </div>
  );
};

// קומפוננטת-עזר קטנה כדי לחסוך שכפול של קוד לכפתורים
const NavItem = ({ icon, label, isActive, onClick, isCollapsed }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void, isCollapsed: boolean }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-medium whitespace-nowrap ${
      isActive 
        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
    } ${isCollapsed ? 'justify-center px-0' : ''}`}
    title={isCollapsed ? label : undefined}
  >
    {icon}
    {!isCollapsed && <span>{label}</span>}
  </button>
);
