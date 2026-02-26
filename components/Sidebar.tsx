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

const NavItem = ({ icon, label, isActive, onClick, isCollapsed }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void, isCollapsed: boolean }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-medium whitespace-nowrap ${
      isActive 
        ? 'bg-white text-brand-500 shadow-lg shadow-brand-900/20' 
        : 'text-brand-100 hover:bg-white/10 hover:text-white'
    } ${isCollapsed ? 'justify-center px-0' : 'flex-row-reverse'}`}
  >
    {icon}
    {!isCollapsed && <span className="flex-1 text-right">{label}</span>}
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ currentRole, setRole, activeView, setActiveView, isCollapsed, toggleSidebar }) => {
  const isAdmin = currentRole === Role.ADMIN;

  return (
    <div className={`bg-brand-500 text-white flex flex-col h-screen shadow-2xl fixed right-0 z-50 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      
      {/* אזור מיתוג - לוגו גדול ומוגבה */}
      <div className="p-8 border-b border-white/10 relative flex flex-col items-center justify-center min-h-[180px]">
        {!isCollapsed ? (
          <div className="flex flex-col items-center w-full">
            <div className="mb-6 transform hover:scale-105 transition-transform duration-300">
              <img 
                src={siteConfig.logoUrl} 
                alt="Inactu" 
                className="w-44 h-auto object-contain drop-shadow-2xl" 
              />
            </div>
            
            <div className="w-full text-center bg-white/5 px-3 py-3 rounded-2xl border border-white/10">
              <span className="text-brand-200 font-bold text-[12px] block tracking-wide uppercase">
                {siteConfig.clientSystemName}
              </span>
              <span className="text-white/60 text-[10px] block mt-1 uppercase tracking-widest">
                {siteConfig.clientName}
              </span>
            </div>
          </div>
        ) : (
          <div className="mx-auto mt-2">
            <img src={siteConfig.logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
          </div>
        )}

        <button 
          onClick={toggleSidebar} 
          className="p-1.5 hover:bg-white/20 rounded-full absolute -left-4 top-10 bg-brand-500 border border-white/10 z-50 hidden md:flex items-center justify-center text-white transition-all shadow-xl"
        >
          <ChevronRight size={18} className={`transform transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <nav className="flex-1 py-8 flex flex-col gap-3 px-4 overflow-y-auto">
        {!isAdmin ? (
          <>
            <NavItem icon={<MessageSquare size={22} />} label="עוזר וירטואלי (AI)" isActive={activeView === 'search'} onClick={() => setActiveView('search')} isCollapsed={isCollapsed} />
            <NavItem icon={<AlertTriangle size={22} />} label="דיווח תקלה" isActive={activeView === 'report'} onClick={() => setActiveView('report')} isCollapsed={isCollapsed} />
          </>
        ) : (
          <>
            {!isCollapsed && <div className="text-[10px] font-bold text-brand-300 uppercase tracking-widest mb-2 px-4 text-right">ניהול מערכת</div>}
            <NavItem icon={<Activity size={22} />} label="לוח בקרה" isActive={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} isCollapsed={isCollapsed} />
            <NavItem icon={<AlertTriangle size={22} />} label="ניהול תקלות" isActive={activeView === 'reports'} onClick={() => setActiveView('reports')} isCollapsed={isCollapsed} />
            <NavItem icon={<MessageSquare size={22} />} label="יומן שאלות" isActive={activeView === 'queries'} onClick={() => setActiveView('queries')} isCollapsed={isCollapsed} />
            <NavItem icon={<BookOpen size={22} />} label="מאגר ידע" isActive={activeView === 'knowledge'} onClick={() => setActiveView('knowledge')} isCollapsed={isCollapsed} />
          </>
        )}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => setRole(isAdmin ? Role.USER : Role.ADMIN)}
          className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all font-medium text-sm border border-white/10"
        >
          {isAdmin ? <LogOut size={20} /> : <Shield size={20} />}
          {!isCollapsed && <span className="text-right">{isAdmin ? 'יציאה מניהול' : 'כניסת מנהל'}</span>}
        </button>
      </div>
    </div>
  );
};
