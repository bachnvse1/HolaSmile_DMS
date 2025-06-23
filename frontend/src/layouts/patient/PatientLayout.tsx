import { PatientNavigation } from './PatientNavigation';
import { Footer } from '../homepage/Footer';

interface UserInfo {
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

interface PatientLayoutProps {
  children: React.ReactNode;
  userInfo?: UserInfo; // Make optional
}

export const PatientLayout: React.FC<PatientLayoutProps> = ({ children, userInfo }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <PatientNavigation userInfo={userInfo} />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
};