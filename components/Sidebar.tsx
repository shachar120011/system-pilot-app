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

const NavItem = ({ icon, label, isActive, onClick, isCollapsed }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-bold whitespace-nowrap ${
      isActive 
        ? 'bg-white text-[#432A61] shadow-xl' 
        : 'text-purple-100 hover:bg-white/10'
    } ${isCollapsed ? 'justify-center px-0' : 'flex-row-reverse'}`}
  >
    {icon}
    {!isCollapsed && <span className="flex-1 text-right">{label}</span>}
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ currentRole, setRole, activeView, setActiveView, isCollapsed, toggleSidebar }) => {
  const isAdmin = currentRole === Role.ADMIN;

  return (
    <div className={`bg-[#432A61] text-white flex flex-col h-screen shadow-2xl fixed right-0 z-50 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-72'}`}>
      
      {/* אזור המיתוג - לוגו Inactu מוגדל */}
      <div className="p-10 border-b border-white/10 relative flex flex-col items-center">
        {!isCollapsed && (
          <div className="flex flex-col items-center w-full">
            <img src={siteConfig.logoUrl} alt="Inactu" className="w-44 h-auto object-contain mb-8 drop-shadow-xl" />
            <div className="w-full text-center bg-white/5 px-3 py-3 rounded-2xl border border-white/10">
              <span className="text-purple-200 font-bold text-[13px] block">{siteConfig.clientSystemName}</span>
              <span className="text-white/60 text-[10px] block mt-1 uppercase tracking-widest">{siteConfig.clientName}</span>
            </div>
          </div>
        )}
        <button onClick={toggleSidebar} className="p-1.5 absolute -left-4 top-12 bg-[#432A61] border border-white/10 rounded-full text-white shadow-xl">
          <ChevronRight size={18} className={isCollapsed ? 'rotate-180' : ''} />
        </button>
      </div>

      <nav className="flex-1 py-10 flex flex-col gap-3 px-4 overflow-y-auto">
        {!isAdmin ? (
          <>
            <NavItem icon={<MessageSquare size={22} />} label="עוזר וירטואלי (AI)" isActive={activeView === 'search'} onClick={() => setActiveView('search')} isCollapsed={isCollapsed} />
            <NavItem icon={<AlertTriangle size={22} />} label="דיווח תקלה" isActive={activeView === 'report'} onClick={() => setActiveView('report')} isCollapsed={isCollapsed} />
          </>
        ) : (
          <NavItem icon={<Activity size={22} />} label="לוח בקרה" isActive={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} isCollapsed={isCollapsed} />
        )}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button onClick={() => setRole(isAdmin ? Role.USER : Role.ADMIN)} className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-white/5 rounded-2xl border border-white/10">
          {isAdmin ? <LogOut size={20} /> : <Shield size={20} />}
          {!isCollapsed && <span className="text-right font-bold">{isAdmin ? 'יציאה מניהול' : 'כניסת מנהל'}</span>}
        </button>
      </div>
    </div>
  );
};
