{/* אזור המיתוג העליון */}
<div className="p-8 border-b border-slate-800 relative flex flex-col items-center">
  {!isCollapsed ? (
    <div className="flex flex-col items-center w-full">
      {/* הלוגו מחליף את הכותרת - מוגדל משמעותית */}
      <div className="mb-6 transform hover:scale-105 transition-transform duration-300">
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
      
      {/* תגית הלקוח */}
      <div className="w-full text-center bg-slate-800/40 px-3 py-2.5 rounded-xl border border-slate-700/50 flex flex-col gap-1">
        <span className="text-brand-300 font-bold text-[13px] tracking-wide">
          {siteConfig.clientSystemName}
        </span>
        <span className="text-slate-400 text-[10px] uppercase tracking-widest opacity-80">
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
</div>
