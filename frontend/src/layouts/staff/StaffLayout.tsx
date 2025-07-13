import { useState } from 'react';
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

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="flex-shrink-0">
        <StaffSidebar 
          userRole={userInfo.role} 
          isCollapsed={isSidebarCollapsed}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <StaffHeader 
          userInfo={userInfo} 
          onToggleSidebar={toggleSidebar}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};