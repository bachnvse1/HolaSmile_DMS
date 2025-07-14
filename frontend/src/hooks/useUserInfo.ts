import { useAuth } from './useAuth';

export const useUserInfo = () => {
  const { fullName, role, userId, roleTableId } = useAuth();
  return {
    id: userId || '',
    name: fullName || 'User',
    email: '',
    role: role || '',
    roleTableId: roleTableId || '',
    avatar: undefined,
  };
};