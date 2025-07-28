import { useState, useEffect } from 'react';
import { StaffHeader } from './StaffHeader';
import { StaffSidebar } from './StaffSidebar';

interface UserInfo {
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface StaffLayoutProps {
  children: React.ReactNode;
  userInfo: UserInfo;
}

export const StaffLayout: React.FC<StaffLayoutProps> = ({ children, userInfo }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile and set initial sidebar state
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768; // md breakpoint
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarCollapsed(true); // Always collapsed on mobile
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isMobile && !isSidebarCollapsed) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isMobile, isSidebarCollapsed]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setIsSidebarCollapsed(true);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Fixed Sidebar */}
      <StaffSidebar 
        userRole={userInfo.role} 
        isCollapsed={isSidebarCollapsed}
        isMobile={isMobile}
        onClose={closeSidebar}
        onToggle={toggleSidebar}
      />

      {/* Main Content Area - No margin, header will handle its own positioning */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Fixed Header with dynamic margin */}
        <StaffHeader 
          userInfo={userInfo} 
          onToggleSidebar={toggleSidebar}
          isSidebarOpen={!isSidebarCollapsed}
          isMobile={isMobile}
          isCollapsed={isSidebarCollapsed}
        />

        {/* Scrollable Content with margin to avoid sidebar overlap */}
        <main className={`flex-1 overflow-y-auto bg-gray-50 transition-all duration-300 ${
          isMobile ? '' : `pt-16 ${!isSidebarCollapsed ? 'ml-64' : 'ml-16'}`
        }`}>
          <div className="p-4 sm:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};