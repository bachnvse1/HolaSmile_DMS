import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../lib/axios';

// Define types for the hooks
type ScheduleInput = {
  date: string;
  shift: string;
  dentistId?: number;
  note?: string;
  status?: string;
};

type ApiScheduleInput = {
  regisSchedules: Array<{ workDate: string; shift: string }>;
};

// Hook để lấy lịch làm việc của tất cả bác sĩ
export const useAllDentistSchedules = () => {
  return useQuery({
    queryKey: ['schedules', 'all'],
    queryFn: async () => {
      console.log('Đang tải danh sách lịch làm việc...');
      const response = await axiosInstance.get('/schedule/dentist/list');
      console.log('Dữ liệu lịch làm việc nhận được:', response.data);
      return response.data;
    },
    staleTime: 0, // Luôn fetch dữ liệu mới
    gcTime: 0     // Không cache dữ liệu (gcTime thay cho cacheTime trong v5)
  });
};

// Hook để lấy lịch làm việc của một bác sĩ cụ thể
export const useDentistSchedule = (dentistId?: number) => {
  return useQuery({
    queryKey: ['schedules', 'dentist', dentistId],
    queryFn: async () => {
      if (!dentistId) return null;
      console.log('Đang tải lịch bác sĩ ID:', dentistId);
      const response = await axiosInstance.get(`/schedule/dentist/${dentistId}`);
      console.log('Dữ liệu lịch bác sĩ nhận được:', response.data);
      return response.data;
    },
    enabled: !!dentistId, // Chỉ gọi API khi có dentistId
    staleTime: 0, // Luôn fetch dữ liệu mới
    gcTime: 0     // Không cache dữ liệu
  });
};

// Hook để tạo lịch làm việc mới cho bác sĩ
export const useCreateSchedule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({    mutationFn: async (scheduleData: ScheduleInput | ScheduleInput[] | ApiScheduleInput) => {
      console.log('Đang tạo lịch làm việc:', scheduleData);
      
      // Transform data to match API format
      let apiData;
      if (Array.isArray(scheduleData)) {
        // If array of schedules
        apiData = {
          regisSchedules: scheduleData.map(schedule => ({
            workDate: new Date(schedule.date).toISOString(),
            shift: schedule.shift
          }))
        };
      } else if ('regisSchedules' in scheduleData) {
        // If already in correct format
        apiData = scheduleData;
      } else {
        // If single schedule object
        apiData = {
          regisSchedules: [{
            workDate: new Date(scheduleData.date).toISOString(),
            shift: scheduleData.shift
          }]
        };
      }
      
      console.log('Dữ liệu gửi đến API:', apiData);
      const response = await axiosInstance.post('/schedule/dentist/create', apiData);
      console.log('Phản hồi từ server:', response.data);
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Tạo lịch thành công:', data);
      
      // Invalidate và refetch các queries liên quan khi thành công
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.refetchQueries({ queryKey: ['schedules'] });
    },
    onError: (error: unknown) => {
      console.error('Lỗi khi tạo lịch:', error);
      console.error('Chi tiết lỗi:', (error as { response?: { data?: unknown } }).response?.data);
    }
  });
};

// Hook để chỉnh sửa lịch làm việc
export const useEditSchedule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (scheduleData: { scheduleId: number; workDate: string; shift: string }) => {
      console.log('Đang cập nhật lịch làm việc:', scheduleData);
      const response = await axiosInstance.post('/schedule/dentist/edit', scheduleData);
      console.log('Phản hồi cập nhật từ server:', response.data);
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Cập nhật lịch thành công:', data);
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.refetchQueries({ queryKey: ['schedules'] });
    },
    onError: (error: unknown) => {
      console.error('Lỗi khi cập nhật lịch:', error);
      console.error('Chi tiết lỗi:', (error as { response?: { data?: unknown } }).response?.data);
    }
  });
};

// Hook để phê duyệt hoặc từ chối lịch làm việc
export const useApproveSchedules = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { scheduleIds: number[]; action: 'confirm' | 'reject' }) => {
      console.log('Đang phê duyệt lịch:', data);
      const response = await axiosInstance.post('/schedule/dentist/approve', data);
      console.log('Phản hồi phê duyệt từ server:', response.data);
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Phê duyệt lịch thành công:', data);
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.refetchQueries({ queryKey: ['schedules'] });
    },
    onError: (error: unknown) => {
      console.error('Lỗi khi phê duyệt lịch:', error);
      console.error('Chi tiết lỗi:', (error as { response?: { data?: unknown } }).response?.data);
    }
  });
};

// Hook để tạo nhiều lịch làm việc cùng lúc
export const useBulkCreateSchedules = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (schedulesData: ScheduleInput | ScheduleInput[] | ApiScheduleInput) => {
      console.log('Đang tạo nhiều lịch:', schedulesData);
        // Transform data to match API format
      let apiData;
      if ('regisSchedules' in schedulesData) {
        // If already in correct format
        apiData = schedulesData;
      } else if (Array.isArray(schedulesData)) {
        // If array of schedules
        apiData = {
          regisSchedules: schedulesData.map(schedule => ({
            workDate: new Date(schedule.date).toISOString(),
            shift: schedule.shift
          }))
        };
      } else {
        // Single schedule
        apiData = {
          regisSchedules: [{
            workDate: new Date(schedulesData.date).toISOString(),
            shift: schedulesData.shift
          }]
        };
      }
      
      console.log('Dữ liệu bulk gửi đến API:', apiData);
      const response = await axiosInstance.post('/schedule/dentist/create', apiData);
      console.log('Phản hồi tạo nhiều lịch từ server:', response.data);
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Tạo nhiều lịch thành công:', data);
      // Invalidate và refetch các queries liên quan khi thành công
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.refetchQueries({ queryKey: ['schedules'] });
    },
    onError: (error: unknown) => {
      console.error('Lỗi khi tạo nhiều lịch:', error);
      console.error('Chi tiết lỗi:', (error as { response?: { data?: unknown } }).response?.data);
    }
  });
};