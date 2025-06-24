import { useQuery } from '@tanstack/react-query';
import { AuthService } from '../services/AuthService';
import { TokenUtils } from '../utils/tokenUtils';

export const useUserProfile = () => {
  const isAuthenticated = TokenUtils.isAuthenticated();
  
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: () => AuthService.fetchUserProfile(),
    enabled: isAuthenticated, 
    staleTime: 1000 * 60 * 5, // Cache 5 minutes
    retry: false, // Don't retry on failure
    refetchOnWindowFocus: false,
    throwOnError: false,
  });
};