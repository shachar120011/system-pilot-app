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

// הגדרת הטיפוסים עבור כפתורי הניווט למניעת שגיאות Build
interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  isCollapsed: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick, isCollapsed }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-medium whitespace-nowrap ${
      isActive 
        ? 'bg-brand-600 text-white shadow-md shadow-brand-900/20' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
    } ${isCollapsed ? 'justify-center px-0' : 'flex-row-reverse'}`}
    title={isCollapsed ? label : undefined}
  >
    {icon}
    {!isCollapsed && <span className="flex-1 text-right">{label}</span>}
  </button>
);

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
      
      {/* אזור המיתוג העליון - לוגו Inactu */}
      <div className="p-8 border-b border-slate-800 relative flex flex-col items-center">
        {!isCollapsed ? (
          <div className="flex flex-col items-center w-full">
            <div className="mb-6">
              {siteConfig.logoUrl ? (
                <img 
                  src={siteConfig.logoUrl} 
                  alt="Inactu Logo" 
                  className="w-40 h-auto object-contain drop-shadow-2xl"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="bg-brand-500 p-4 rounded-2xl shadow-lg">
                  <Shield size={40} className="text-white" />
                </div>
              )}
            </div>
            
            <div className="w-full text-center bg-slate-800/40 px-3 py-2.5 rounded-xl border border-slate-700/50 flex flex-col gap-1">
              <span className="text-brand-300 font-bold text-[13px] tracking-wide">
                {siteConfig.clientSystemName}
              </span>
              <span className="text-slate-400 text-[10px] uppercase tracking-widest opacity-80 text-center">
                {siteConfig.clientName}
              </span>
            </div>
          </div>
        ) : (
          <div className="mx-auto mt-2 shrink-0">
             {siteConfig.logoUrl ? (
               <img src={siteConfig.logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
             ) : (
               <div className="bg-brand-500 p-2 rounded-xl">
                 <Shield size={20} className="text-white" />
               </div>
             )}
           </div>
        )}

        <button 
          onClick={toggleSidebar} 
          className="p-1.5 hover:bg-slate-800 rounded-full absolute -left-4 top-8 bg-slate-800 border border-slate-700 z-50 hidden md:flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-lg"
        >
          <ChevronRight size={18} className={`transform transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

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
            {!isCollapsed && <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 mt-2 px-2 text-right">ניהול מערכת</div>}
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

      <div className="p-3 border-t border-slate-800">
        <button
          onClick={() => setRole(isAdmin ? Role.USER : Role.ADMIN)}
          className={`w-full flex items-center justify-center gap-2 px-3 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all font-medium text-sm border border-slate-700 ${isCollapsed ? 'px-0' : ''}`}
        >
          {isAdmin ? <LogOut size={18} /> : <Shield size={18} />}
          {!isCollapsed && <span className="text-right">{isAdmin ? 'יציאה מניהול' : 'כניסת מנהל'}</span>}
        </button>
      </div>
    </div>
  );
};
