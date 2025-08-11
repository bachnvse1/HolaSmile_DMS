import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthService } from '../services/AuthService';
import { toast } from 'react-toastify';

interface CancelAppointmentPayload {
  appointmentId: number;
  reason?: string;
}

export const useCancelAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CancelAppointmentPayload) => {
      console.log('[useCancelAppointment] Cancelling appointment:', payload);
      
      const response = await AuthService.makeAuthenticatedRequest(`/appointment/cancelAppointment`, {
        method: 'PUT',
        data: {
          appointmentId: payload.appointmentId,
          reason: payload.reason || 'Bệnh nhân hủy lịch'
        }
      });
      
      console.log('[useCancelAppointment] Cancel response:', response);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate appointments query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      
      toast.success('Hủy lịch hẹn thành công');
    },
    onError: (error: unknown) => {
      console.error('[useCancelAppointment] Error:', error);
      
      let errorMessage = 'Không thể hủy lịch hẹn. Vui lòng thử lại.';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string; error?: string } } };
        errorMessage = axiosError.response?.data?.message || 
                      axiosError.response?.data?.error || 
                      errorMessage;
      }
      
      toast.error(errorMessage);
    },
  });
};