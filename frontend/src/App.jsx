import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './components/common/Navbar.jsx';
import Sidebar from './components/common/Sidebar.jsx';
import AppRoutes from './routes/AppRoutes.jsx';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const isAuthPage = location.pathname === '/login' || location.pathname === '/role-select';

  if (isAuthPage) {
    return <AppRoutes />;
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-900 overflow-hidden font-sans">
      {/* Deep Dark-Forest Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Telemetry & Action Navbar */}
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Scrollable Main Canvas */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8 bg-[#f8fafc]">
          <div className="max-w-7xl mx-auto w-full space-y-6">
            <AppRoutes />
          </div>
        </main>
      </div>
    </div>
  );
}
