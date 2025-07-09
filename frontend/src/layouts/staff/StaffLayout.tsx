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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="flex-shrink-0">
        <StaffSidebar 
          userRole={userInfo.role} 
          isCollapsed={isSidebarCollapsed}
          isMobile={isMobile}
          onClose={closeSidebar}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <StaffHeader 
          userInfo={userInfo} 
          onToggleSidebar={toggleSidebar}
          isSidebarOpen={!isSidebarCollapsed}
          isMobile={isMobile}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};