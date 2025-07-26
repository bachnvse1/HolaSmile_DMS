import { useMemo } from 'react';
import { useChatConversations } from './useChatConversations';
import { useInternalConversations } from './useInternalConversations';
import { useGuestConversations } from './useGuestConversations';
import { useAuth } from './useAuth';

export const useTotalUnreadCount = () => {
  const { role } = useAuth();
  
  // Get unread counts from all chat types
  const { totalUnreadCount: patientUnreadCount } = useChatConversations();
  const { totalUnreadCount: internalUnreadCount } = useInternalConversations();
  const { totalCount: guestUnreadCount } = useGuestConversations();

  // Calculate total based on user role
  const totalUnreadCount = useMemo(() => {
    let total = 0;
    
    // All staff can see internal messages
    if (['Administrator', 'Owner', 'Receptionist', 'Assistant', 'Dentist'].includes(role || '')) {
      total += internalUnreadCount;
    }
    
    // All staff and patients can see patient consultation
    if (['Administrator', 'Owner', 'Receptionist', 'Assistant', 'Dentist', 'Patient'].includes(role || '')) {
      total += patientUnreadCount;
    }
    
    // Only Receptionist can see guest consultation
    if (role === 'Receptionist') {
      total += guestUnreadCount;
    }
    
    return total;
  }, [patientUnreadCount, internalUnreadCount, guestUnreadCount, role]);

  return {
    totalUnreadCount,
    patientUnreadCount,
    internalUnreadCount,
    guestUnreadCount
  };
};