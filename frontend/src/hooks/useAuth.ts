import { useState, useEffect } from 'react';
import { TokenUtils } from '../utils/tokenUtils';

interface UserData {
  token: string | null;
  userId: string | null;
  username: string | null;
  fullName: string | null;
  role: string | null;
  roleTableId: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

export const useAuth = () => {
  const [userData, setUserData] = useState<UserData>({
    token: null,
    userId: null,
    username: null,
    fullName: null,
    role: null,
    roleTableId: null,
    refreshToken: null,
    isAuthenticated: false
  });
  const refreshUserData = () => {
    const data = TokenUtils.getUserData();
    const isAuth = TokenUtils.isAuthenticated();
    
    setUserData({
      ...data,
      roleTableId: data.role_table_id ?? null,
      isAuthenticated: isAuth
    });
  };

  useEffect(() => {
    refreshUserData();    // Listen for storage changes (in case user logs out from another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'authToken') {
        refreshUserData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const logout = () => {
    TokenUtils.clearTokenData();
    refreshUserData();
  };

  const isRole = (role: string): boolean => {
    return userData.role === role;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return userData.role ? roles.includes(userData.role) : false;
  };

  return {
    ...userData,
    logout,
    isRole,
    hasAnyRole,
    refreshUserData
  };
};