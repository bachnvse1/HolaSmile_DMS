import { useMemo } from 'react';
import { useAuth } from '../useAuth';
import { useInternalConversations } from './useInternalConversations';
import { useGuestConversations } from './useGuestConversations';
import { usePatientConversations } from './usePatientConversations';
import { useChatConversations } from './useChatConversations';

export const useTotalUnreadCount = () => {
  const { role, userId } = useAuth();
  
  // Định nghĩa staff roles
  const STAFF_ROLES = ['Administrator', 'Owner', 'Receptionist', 'Assistant', 'Dentist'];
  const isStaff = STAFF_ROLES.includes(role || '');

  // Get unread counts from all chat types
  const { totalUnreadCount: internalUnreadCount } = useInternalConversations();
  const { conversations: guestConversations } = useGuestConversations();
  const { totalUnreadCount: patientUnreadCountStaff } = usePatientConversations();
  const { conversations: patientConversationsPatient } = useChatConversations();

  // Calculate guest unread count (sum from conversations)
  const guestUnreadCount = useMemo(() => {
    if (!guestConversations) return 0;
    return guestConversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
  }, [guestConversations]);

  // Calculate patient unread count for patients (filter staff only)
  const patientUnreadCountPatient = useMemo(() => {
    if (!patientConversationsPatient || role !== 'Patient') return 0;
    const staffConversations = patientConversationsPatient.filter(conv => 
      STAFF_ROLES.includes(conv.role)
    );
    return staffConversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
  }, [patientConversationsPatient, role, STAFF_ROLES]);

  // Get final patient unread count based on role
  const patientUnreadCount = useMemo(() => {
    if (role === 'Patient') {
      return patientUnreadCountPatient;
    } else if (isStaff) {
      return patientUnreadCountStaff || 0;
    }
    return 0;
  }, [role, isStaff, patientUnreadCountPatient, patientUnreadCountStaff]);

  // Calculate total based on user role
  const totalUnreadCount = useMemo(() => {
    if (!userId) return 0;
    
    let total = 0;
    
    if (isStaff) {
      // Staff sees: internal + patient + guest (chỉ receptionist)
      total += internalUnreadCount || 0;
      total += patientUnreadCount || 0;
      
      // Only Receptionist can see guest consultation
      if (role === 'Receptionist') {
        total += guestUnreadCount || 0;
      }
    } else if (role === 'Patient') {
      // Patient chỉ thấy staff conversations
      total += patientUnreadCount || 0;
    }
    
    return total;
  }, [
    userId,
    role,
    isStaff,
    internalUnreadCount,
    patientUnreadCount,
    guestUnreadCount
  ]);

  // Get unread count by type for detailed breakdown
  const getUnreadCountByType = useMemo(() => {
    if (!userId) return { internal: 0, guest: 0, patient: 0 };

    let internal = 0;
    let guest = 0;
    let patient = 0;

    if (isStaff) {
      internal = internalUnreadCount || 0;
      patient = patientUnreadCount || 0;
      
      if (role === 'Receptionist') {
        guest = guestUnreadCount || 0;
      }
    } else if (role === 'Patient') {
      patient = patientUnreadCount || 0;
    }

    return { internal, guest, patient };
  }, [
    userId,
    role,
    isStaff,
    internalUnreadCount,
    guestUnreadCount,
    patientUnreadCount
  ]);

  return {
    totalUnreadCount,
    patientUnreadCount,
    internalUnreadCount,
    guestUnreadCount,
    getUnreadCountByType,
    // Backward compatibility method
    getTotalUnreadCount: () => totalUnreadCount
  };
};