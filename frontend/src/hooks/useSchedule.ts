import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../lib/axios';
import type { Schedule, ApprovalRequest } from '../types/schedule';

// Hook để lấy lịch làm việc của tất cả bác sĩ
export const useAllDentistSchedules = () => {
  return useQuery({
    queryKey: ['schedules', 'all'],
    queryFn: async () => {
      const response = await axiosInstance.get('/schedule/dentist/list');
      return response.data;
    }
  });
};

// Hook để lấy lịch làm việc của một bác sĩ cụ thể
export const useDentistSchedule = (dentistId?: number) => {
  return useQuery({
    queryKey: ['schedules', 'dentist', dentistId],
    queryFn: async () => {
      if (!dentistId) return null;
      const response = await axiosInstance.get(`/schedule/dentist/${dentistId}`);
      return response.data;
    },
    enabled: !!dentistId // Chỉ gọi API khi có dentistId
  });
};

// Hook để tạo lịch làm việc mới cho bác sĩ
export const useCreateSchedule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (scheduleData: Schedule) => {
      console.log('Đang tạo lịch làm việc:', scheduleData);
      const response = await axiosInstance.post('/schedule/dentist/create', scheduleData);
      console.log('Phản hồi từ server:', response.data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      console.log('Tạo lịch thành công:', data);
      
      // Invalidate và refetch các queries liên quan khi thành công
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      
      // Cụ thể hóa invalidation cho lịch của từng bác sĩ
      if (variables.dentistId) {
        console.log('Invalidating cache for dentist:', variables.dentistId);
        queryClient.invalidateQueries({ 
          queryKey: ['schedules', 'dentist', variables.dentistId] 
        });
        
        // Force refetch để cập nhật UI ngay lập tức
        queryClient.refetchQueries({ 
          queryKey: ['schedules', 'dentist', variables.dentistId],
          type: 'active'
        });
      }
    },
    onError: (error) => {
      console.error('Lỗi khi tạo lịch:', error);
    }
  });
};

// Hook để chỉnh sửa lịch làm việc
export const useEditSchedule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (scheduleData: Schedule) => {
      console.log('Đang cập nhật lịch làm việc:', scheduleData);
      const response = await axiosInstance.post('/schedule/dentist/edit', scheduleData);
      console.log('Phản hồi cập nhật từ server:', response.data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      console.log('Cập nhật lịch thành công:', data);
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      
      // Cụ thể hóa invalidation cho lịch của từng bác sĩ
      if (variables.dentistId) {
        queryClient.invalidateQueries({ 
          queryKey: ['schedules', 'dentist', variables.dentistId] 
        });
      }
    },
    onError: (error) => {
      console.error('Lỗi khi cập nhật lịch:', error);
    }
  });
};

// Hook để phê duyệt hoặc từ chối lịch làm việc
export const useApproveSchedules = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: ApprovalRequest) => {
      const response = await axiosInstance.post('/schedule/dentist/approve', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    }
  });
};

// Hook để tạo nhiều lịch làm việc cùng lúc
export const useBulkCreateSchedules = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (schedulesData: Schedule[]) => {
      const response = await axiosInstance.post('/schedule/dentist/bulk-create', { schedules: schedulesData });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate và refetch các queries liên quan khi thành công
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    }
  });
};