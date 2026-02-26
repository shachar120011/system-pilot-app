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

// קומפוננטת עזר חכמה לכפתורי הניווט (NavItem)
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
    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium whitespace-nowrap ${
      isActive 
        ? 'bg-white text-slate-900 shadow-md shadow-purple-900/10' // כפתור פעיל: לבן ומובלט
        : 'text-purple-100 hover:bg-white/10' // כפתור רגיל: טקסט בהיר ורקע שקוף
    } ${isCollapsed ? 'justify-center px-0' : 'flex-row-reverse'}`} // תמיכה בעברית
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
    // הסיידבר הופך לסגול עמוק ומעוגל, בדיוק כמו בעיצוב שלך
    <div className={`bg-[#432A61] text-white flex flex-col h-screen shadow-2xl fixed right-0 z-50 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      
      {/* אזור המיתוג העליון: לוגו גדול ומרכזי בלבד */}
      <div className="p-8 border-b border-white/10 relative flex flex-col items-center">
        {!isCollapsed ? (
          <div className="flex flex-col items-center w-full">
            {/* הלוגו הגדול מחליף את הכותרת הכפולה - מוגבה ומוגדל */}
            <div className="mb-6 transform hover:scale-105 transition-transform duration-300">
              {siteConfig.logoUrl ? (
                <img 
                  src={siteConfig.logoUrl} 
                  alt="Inactu Logo" 
                  className="w-40 h-auto object-contain drop-shadow-2xl" // הגדלה ל-w-40
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="bg-white/10 p-4 rounded-2xl shadow-lg shrink-0">
                  <Shield size={40} className="text-white" />
                </div>
              )}
            </div>
            
            {/* תגית שם המערכת והלקוח מעוצבת בצורה נקייה */}
            <div className="w-full text-center bg-white/5 px-3 py-2.5 rounded-xl border border-white/10 flex flex-col gap-1">
              <span className="text-white font-bold text-[13px] tracking-wide">
                {cite: siteConfig.clientSystemName}
              </span>
              <span className="text-purple-200 text-[10px] uppercase tracking-widest opacity-80 text-center">
                {cite: siteConfig.clientName}
              </span>
            </div>
          </div>
        ) : (
          /* מצב מכווץ (Collapsed) */
          <div className="mx-auto mt-2 shrink-0">
             {siteConfig.logoUrl ? (
               <img src={cite: siteConfig.logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
             ) : (
               <div className="bg-white/10 p-2 rounded-xl">
                 <Shield size={20} className="text-white" />
               </div>
             )}
           </div>
        )}

        {/* כפתור כיווץ/הרחבה */}
        <button 
          onClick={toggleSidebar} 
          className="p-1.5 hover:bg-white/10 rounded-full absolute -left-4 top-8 bg-[#432A61] border border-white/10 z-50 hidden md:flex items-center justify-center text-purple-200 hover:text-white transition-all shadow-lg"
        >
          <ChevronRight size={18} className={`transform transition-transform ${cite: isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* תפריט ניווט */}
      <nav className="flex-1 py-6 flex flex-col gap-3 px-4 overflow-y-auto overflow-x-hidden">
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
            {!isCollapsed && <div className="text-[10px] font-bold text-purple-300 uppercase tracking-wider mb-1 mt-4 px-3 text-right">ניהול מערכת</div>}
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

      {/* אזור תחתון: החלפת תפקיד (Role) */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => setRole(isAdmin ? Role.USER : Role.ADMIN)}
          className={`w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white/5 hover:bg-white/10 text-purple-100 rounded-xl transition-all font-medium text-sm border border-white/10 ${isCollapsed ? 'px-0' : ''}`}
        >
          {isAdmin ? <LogOut size={18} /> : <Shield size={18} />}
          {!isCollapsed && <span className="text-right">{isAdmin ? 'יציאה מניהול' : 'כניסת מנהל'}</span>}
        </button>
      </div>
    </div>
  );
};
