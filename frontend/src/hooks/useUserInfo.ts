import { useAuth } from './useAuth';

export const useUserInfo = () => {
  const { fullName, role, userId } = useAuth();
  return {
    id: userId || '',
    name: fullName || 'User',
    email: '',
    role: role || '',
    avatar: undefined,
  };
};