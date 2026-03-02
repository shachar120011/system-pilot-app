import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { UserDashboard } from './pages/UserDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { IssueReporter } from './pages/IssueReporter'; // הוספנו את ייבוא מסך הדיווח
import { ErrorBoundary } from './components/ErrorBoundary';
import { Role } from './types';

function App() {
  const [currentRole, setCurrentRole] = useState<Role>(Role.USER);
  const [activeView, setActiveView] = useState('search'); // 'search', 'report', 'dashboard', 'knowledge'
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // מעבר בין תפקידים מאפס את התצוגה למסך ברירת המחדל הרלוונטי
  const handleRoleSwitch = (newRole: Role) => {
    setCurrentRole(newRole);
    if (newRole === Role.USER) {
      setActiveView('search');
    } else {
      setActiveView('dashboard');
    }
  };

  return (
    <ErrorBoundary>
      {/* הוספנו dir="rtl" והפכנו את המסגרת הראשית לנקייה כדי שהסיידבר והמסכים ישבו מושלם */}
      <div className="flex h-screen w-full bg-slate-100 overflow-hidden font-sans" dir="rtl">
        
        <Sidebar 
          currentRole={currentRole} 
          setRole={handleRoleSwitch}
          activeView={activeView}
          setActiveView={setActiveView}
          isCollapsed={isSidebarCollapsed}
          toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        
        {/* אזור התוכן המרכזי - ללא Margins מיותרים ששברו את המסך! */}
        <main className="flex-1 h-full overflow-hidden transition-all duration-300">
          
          {/* ניתוב מסכי משתמש */}
          {currentRole === Role.USER && activeView === 'search' && (
            <UserDashboard />
          )}
          {currentRole === Role.USER && activeView === 'report' && (
            <IssueReporter />
          )}

          {/* ניתוב מסכי מנהל */}
          {currentRole === Role.ADMIN && (
            <AdminDashboard activeView={activeView} />
          )}

        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;
