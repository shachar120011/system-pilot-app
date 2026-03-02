import React from 'react';
import { MessageSquare, AlertTriangle, BookOpen, Shield, LogOut, Activity, ChevronRight, HelpCircle, Wrench } from 'lucide-react';
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
    // שינוי צבעים: לשונית פעילה תהיה סגולה, לשונית רגילה תהיה אפורה
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold whitespace-nowrap mb-1 ${
      isActive 
        ? 'bg-[#432A61] text-white shadow-md' 
        : 'text-slate-600 hover:bg-slate-200 hover:text-[#432A61]'
    } ${isCollapsed ? 'justify-center px-0' : 'flex-row-reverse'}`}
    title={isCollapsed ? label : undefined}
  >
    {icon}
    {!isCollapsed && <span className="flex-1 text-right">{label}</span>}
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ currentRole, setRole, activeView, setActiveView, isCollapsed, toggleSidebar }) => {
  const isAdmin = currentRole === Role.ADMIN;

  return (
    // שינוי צבע הסיידבר לבהיר: bg-slate-50 עם גבול שמאלי
    <div className={`bg-slate-50 border-l border-slate-200 flex flex-col h-screen relative z-40 transition-all duration-300 shrink-0 ${isCollapsed ? 'w-20' : 'w-72'}`}>
      
      {/* אזור המיתוג - מוקטן משמעותית כדי לתת מקום ללשוניות */}
      <div className="p-4 border-b border-slate-200 relative flex flex-col items-center min-h-[120px] justify-center">
        {!isCollapsed && (
          <div className="flex flex-col items-center w-full">
            {/* לוגו מוקטן */}
            <img src={siteConfig.logoUrl} alt="Inactu" className="w-full max-w-[100px] h-auto object-contain mb-2" />
            <div className="w-full text-center">
              <span className="text-[#432A61] font-black text-[12px] block">{siteConfig.clientSystemName}</span>
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{siteConfig.clientName}</span>
            </div>
          </div>
        )}
        
        {isCollapsed && (
           <div className="mx-auto bg-[#432A61] p-2 rounded-xl shadow-md shrink-0 mt-2">
              <Shield size={20} className="text-white" />
            </div>
        )}

        <button 
          onClick={toggleSidebar} 
          className="p-1.5 absolute -left-4 top-1/2 -translate-y-1/2 bg-white border border-slate-200 rounded-full text-slate-600 shadow-md hover:text-[#432A61] transition-colors hidden md:flex"
        >
          <ChevronRight size={16} className={isCollapsed ? 'rotate-180 transition-transform' : 'transition-transform'} />
        </button>
      </div>

      {/* תפריט ניווט - פחות פדינג עליון (py-4) */}
      <nav className="flex-1 py-4 flex flex-col px-3 overflow-y-auto">
        {!isAdmin ? (
          <>
            <NavItem icon={<MessageSquare size={20} />} label="עוזר וירטואלי (AI)" isActive={activeView === 'search'} onClick={() => setActiveView('search')} isCollapsed={isCollapsed} />
            <NavItem icon={<AlertTriangle size={20} />} label="דיווח תקלה" isActive={activeView === 'report'} onClick={() => setActiveView('report')} isCollapsed={isCollapsed} />
          </>
        ) : (
          <>
            {!isCollapsed && <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-1 px-2 text-right">ניהול מערכת</div>}
            <NavItem icon={<Activity size={20} />} label="לוח בקרה" isActive={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} isCollapsed={isCollapsed} />
            <NavItem icon={<Wrench size={20} />} label="ניהול תקלות" isActive={activeView === 'reports' || activeView === 'issues'} onClick={() => setActiveView('reports')} isCollapsed={isCollapsed} />
            <NavItem icon={<HelpCircle size={20} />} label="יומן שאלות" isActive={activeView === 'queries' || activeView === 'questions'} onClick={() => setActiveView('queries')} isCollapsed={isCollapsed} />
            <NavItem icon={<BookOpen size={20} />} label="מאגר ידע" isActive={activeView === 'knowledge'} onClick={() => setActiveView('knowledge')} isCollapsed={isCollapsed} />
          </>
        )}
      </nav>

      {/* יציאה / כניסת מנהל */}
      <div className="p-4 border-t border-slate-200 bg-white/50">
        <button onClick={() => setRole(isAdmin ? Role.USER : Role.ADMIN)} className={`w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-slate-700 rounded-xl border border-slate-200 shadow-sm hover:border-[#432A61] hover:text-[#432A61] transition-colors font-bold ${isCollapsed ? 'px-0' : 'flex-row-reverse'}`}>
          {isAdmin ? <LogOut size={18} /> : <Shield size={18} />}
          {!isCollapsed && <span>{isAdmin ? 'יציאה מניהול' : 'כניסת מנהל'}</span>}
        </button>
      </div>
    </div>
  );
};
