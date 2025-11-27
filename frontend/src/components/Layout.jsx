import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleClose = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - Behind navbar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={handleClose}
        onToggle={handleToggle}
      />
      
      {/* Navbar - Fixed at top, NOT affected by sidebar expansion */}
      <Navbar 
        onMenuClick={handleToggle}
        sidebarOpen={sidebarOpen}
      />
      
      {/* Main content - shifts with sidebar, below navbar */}
      <div 
        className={`transition-all duration-300 pt-14 sm:pt-16 ${
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
        }`}
      >
        <main className="p-3 sm:p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
