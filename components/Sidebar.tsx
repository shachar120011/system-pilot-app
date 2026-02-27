import React from 'react';
import { MessageSquare, AlertTriangle, BookOpen, Shield, LogOut, Activity, ChevronRight } from 'lucide-react';
import { siteConfig } from '../config'; 
import { Role } from '../types';

export const Sidebar: React.FC<any> = ({ currentRole, setRole, activeView, setActiveView, isCollapsed, toggleSidebar }) => {
  const isAdmin = currentRole === Role.ADMIN;

  return (
    <div className={`bg-[#432A61] text-white flex flex-col h-screen shadow-2xl fixed right-0 z-50 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-72'}`}>
      
      {/* לוגו גדול ומוגבה - מרכז המותג */}
      <div className="pt-12 pb-8 px-8 border-b border-white/10 relative flex flex-col items-center">
        {!isCollapsed && (
          <div className="flex flex-col items-center w-full">
            <img 
              src={siteConfig.logoUrl} 
              alt="Inactu" 
              className="w-48 h-auto object-contain drop-shadow-2xl mb-8" 
            />
            {/* פרטי הלקוח המקוריים - רישוי עסקים */}
            <div className="w-full text-center bg-white/5 px-4 py-4 rounded-2xl border border-white/10 shadow-inner">
              <span className="text-purple-100 font-black text-[14px] block mb-1">{siteConfig.clientSystemName}</span>
              <span className="text-white/50 text-[11px] block uppercase tracking-tighter">{siteConfig.clientName}</span>
            </div>
          </div>
        )}
        
        <button 
          onClick={toggleSidebar} 
          className="p-2 absolute -left-5 top-14 bg-[#432A61] border border-white/10 rounded-full text-white shadow-2xl hover:bg-[#35214D] transition-all"
        >
          <ChevronRight size={20} className={isCollapsed ? 'rotate-180' : ''} />
        </button>
      </div>

      <nav className="flex-1 py-10 flex flex-col gap-4 px-6 overflow-y-auto">
        {/* ניווט משתמש/מנהל - שמרתי על המבנה המקורי שלך */}
        {!isAdmin ? (
          <>
            <NavItem icon={<MessageSquare size={24} />} label="עוזר וירטואלי (AI)" isActive={activeView === 'search'} onClick={() => setActiveView('search')} isCollapsed={isCollapsed} />
            <NavItem icon={<AlertTriangle size={24} />} label="דיווח תקלה" isActive={activeView === 'report'} onClick={() => setActiveView('report')} isCollapsed={isCollapsed} />
          </>
        ) : (
          <>
            {!isCollapsed && <div className="text-[11px] font-bold text-purple-300 uppercase tracking-widest mb-2 text-right opacity-60">ניהול מערכת</div>}
            <NavItem icon={<Activity size={22} />} label="לוח בקרה" isActive={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} isCollapsed={isCollapsed} />
            <NavItem icon={<AlertTriangle size={22} />} label="ניהול תקלות" isActive={activeView === 'reports'} onClick={() => setActiveView('reports')} isCollapsed={isCollapsed} />
          </>
        )}
      </nav>

      <div className="p-6 border-t border-white/10">
        <button onClick={() => setRole(isAdmin ? Role.USER : Role.ADMIN)} className="w-full flex items-center justify-center gap-3 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 transition-all font-bold">
          {isAdmin ? <LogOut size={20} /> : <Shield size={20} />}
          {!isCollapsed && <span className="text-right">{isAdmin ? 'יציאה מניהול' : 'כניסת מנהל'}</span>}
        </button>
      </div>
    </div>
  );
};

const NavItem = ({ icon, label, isActive, onClick, isCollapsed }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all font-bold ${isActive ? 'bg-white text-[#432A61] shadow-xl' : 'text-purple-100 hover:bg-white/5'} ${isCollapsed ? 'justify-center px-0' : 'flex-row-reverse'}`}>
    {icon}
    {!isCollapsed && <span className="flex-1 text-right text-[15px]">{label}</span>}
  </button>
);
