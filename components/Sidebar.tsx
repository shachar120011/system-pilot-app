export const Sidebar: React.FC<SidebarProps> = ({ currentRole, setRole, activeView, setActiveView, isCollapsed, toggleSidebar }) => {
  const isAdmin = currentRole === Role.ADMIN;

  return (
    <div className={`bg-[#432A61] text-white flex flex-col h-screen shadow-2xl relative z-40 transition-all duration-300 shrink-0 ${isCollapsed ? 'w-20' : 'w-72'}`}>
      
      {/* אזור המיתוג - מוקטן, מוצמד למעלה וקומפקטי יותר */}
      <div className="p-4 pt-6 pb-4 border-b border-white/10 relative flex flex-col items-center">
        {!isCollapsed && (
          <div className="flex flex-col items-center w-full">
            {/* הקטנו את גודל הלוגו ואת הרווח מתחתיו */}
            <img src={siteConfig.logoUrl} alt="Inactu" className="w-full max-w-[110px] h-auto object-contain mb-3 drop-shadow-xl" />
            <div className="w-full text-center bg-white/5 px-2 py-2 rounded-xl border border-white/10">
              <span className="text-purple-200 font-bold text-[12px] block">{siteConfig.clientSystemName}</span>
              <span className="text-white/60 text-[10px] block uppercase tracking-widest">{siteConfig.clientName}</span>
            </div>
          </div>
        )}
        
        {isCollapsed && (
           <div className="mx-auto bg-white/10 p-2 rounded-xl shadow-lg shrink-0 mt-2">
              <Shield size={20} className="text-white" />
            </div>
        )}

        {/* כפתור כיווץ - הותאם לגובה החדש */}
        <button 
          onClick={toggleSidebar} 
          className="p-1.5 absolute -left-4 top-10 bg-[#432A61] border border-white/10 rounded-full text-white shadow-xl hover:bg-white/10 transition-colors hidden md:flex"
        >
          <ChevronRight size={18} className={isCollapsed ? 'rotate-180 transition-transform' : 'transition-transform'} />
        </button>
      </div>

      {/* תפריט הניווט - הקטנו את הריווח העליון (py-4 במקום py-8) כדי שהלשוניות יתחילו גבוה יותר */}
      <nav className="flex-1 py-4 flex flex-col gap-2 px-3 overflow-y-auto">
        {/* ... כאן ממשיך הקוד של הלשוניות (NavItem) שלך ללא שינוי ... */}
      </nav>

      {/* יציאה / כניסת מנהל */}
      <div className="p-4 border-t border-white/10">
        <button onClick={() => setRole(isAdmin ? Role.USER : Role.ADMIN)} className={`w-full flex items-center justify-center gap-3 px-4 py-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors ${isCollapsed ? 'px-0' : 'flex-row-reverse'}`}>
          {isAdmin ? <LogOut size={20} /> : <Shield size={20} />}
          {!isCollapsed && <span className="text-right font-bold">{isAdmin ? 'יציאה מניהול' : 'כניסת מנהל'}</span>}
        </button>
      </div>
    </div>
  );
};
