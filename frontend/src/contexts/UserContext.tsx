import { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { AuthService } from '../services/AuthService';

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: 'Patient' | 'Administrator' | 'Owner' | 'Receptionist' | 'Assistant' | 'Dentist';
  avatar?: string;
  phone?: string;  roleId?: string; // ID from role-specific table
  roleData?: Record<string, unknown>; // Additional data from role-specific table
}

interface UserContextType {
  user: UserInfo | null;
  setUser: (user: UserInfo | null) => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export { UserContext };

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);  useEffect(() => {
    const initializeUser = async () => {
      const { token, role } = AuthService.getAuthData();
      
      if (token && role) {
        try {
          // Since we only have basic info from login, fetch detailed profile
          const userData = await AuthService.fetchUserProfile();
          setUser({
            id: userData.id,
            name: userData.name,
            email: userData.email,
            role: userData.role as UserInfo['role'],
            roleId: userData.roleId,
            roleData: userData.roleData,
            phone: userData.phone,
            avatar: userData.avatar
          });
        } catch (error) {
          console.error('Failed to fetch user info:', error);
          // If profile fetch fails, create basic user from stored data
          setUser({
            id: 'temp_id',
            name: 'User',
            email: '',
            role: role as UserInfo['role'],
            roleId: 'temp_role_id'
          });
        }
      }
      
      setIsLoading(false);
    };

    initializeUser();
  }, []);

  const isAuthenticated = !!user;
  return (
    <UserContext.Provider value={{ user, setUser, isLoading, isAuthenticated }}>
      {children}
    </UserContext.Provider>
  );
};