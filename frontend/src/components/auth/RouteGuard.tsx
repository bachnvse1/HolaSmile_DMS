import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '@/hooks/useAuth';

interface RouteGuardProps {
  children: React.ReactNode;
  requiresAuth?: boolean;
  publicOnly?: boolean; 
  allowedRoles?: string[];
}

export const RouteGuard: React.FC<RouteGuardProps> = ({ 
  children, 
  requiresAuth = false,
  publicOnly = false,
  allowedRoles = []
}) => {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) { 
        checkAuthAndRedirect();
      }
    };

    const handlePopState = () => {
      checkAuthAndRedirect();
    };

    const checkAuthAndRedirect = () => {
      const currentPath = location.pathname;
      
      if (publicOnly && isAuthenticated && role) {
        redirectBasedOnRole(role);
        return;
      }

      if (requiresAuth && !isAuthenticated) {
        navigate('/login', { 
          replace: true,
          state: { from: currentPath }
        });
        return;
      }

      if (isAuthenticated && allowedRoles.length > 0 && !allowedRoles.includes(role || '')) {
        redirectBasedOnRole(role || '');
        return;
      }
    };

    const redirectBasedOnRole = (userRole: string) => {
      switch (userRole) {
        case 'Patient':
          navigate('/patient/appointments', { replace: true });
          break;
        case 'Owner':
          navigate('/dashboard', { replace: true });
          break;
        case 'Administrator':
        case 'Dentist':
        case 'Receptionist':
        case 'Assistant':
          navigate('/appointments', { replace: true });
          break;
        default:
          navigate('/', { replace: true });
      }
    };

    checkAuthAndRedirect();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [navigate, location.pathname, isAuthenticated, role, requiresAuth, publicOnly, allowedRoles]);

  return <>{children}</>;
};