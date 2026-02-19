import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { UserDashboard } from './pages/UserDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Role } from './types';

function App() {
  const [currentRole, setCurrentRole] = useState<Role>(Role.USER);
  const [activeView, setActiveView] = useState('search'); // 'search', 'report', 'dashboard', 'knowledge'
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Handle role switch logic to reset view
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
      <div className="flex min-h-screen bg-[#f8fafc] text-slate-800 font-sans">
        <Sidebar 
          currentRole={currentRole} 
          setRole={handleRoleSwitch}
          activeView={activeView}
          setActiveView={setActiveView}
          isCollapsed={isSidebarCollapsed}
          toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        
        <main 
          className={`flex-1 transition-all duration-300 ${
            isSidebarCollapsed ? 'mr-20' : 'mr-20 md:mr-64'
          }`}
        >
          {currentRole === Role.USER ? (
            <UserDashboard activeView={activeView} />
          ) : (
            <AdminDashboard activeView={activeView} />
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;