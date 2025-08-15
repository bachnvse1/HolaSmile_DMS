import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../lib/axios";
import { useAuth } from "@/hooks/useAuth";
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

type ApiScheduleItem = {
  scheduleId: number;
  dentistName?: string;
  workDate: string;
  shift: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  note?: string;
  isActive?: boolean;
};

type ApiDentistData = {
  dentistID: number;
  dentistName: string;
  avatar?: string;
  schedules: ApiScheduleItem[];
};

const shiftHourMap: Record<string, string> = {
  morning: "08:00:00",
  afternoon: "14:00:00",
  evening: "17:00:00",
};

// Hook để lấy lịch làm việc của tất cả bác sĩ
export const useAllDentistSchedules = () => {
  const user = useAuth()
  return useQuery({
    queryKey: ["schedules", "all", user],
    queryFn: async () => {
      const response = await axiosInstance.get("/schedule/dentist/list");

      if (
        response.data &&
        response.data.data &&
        Array.isArray(response.data.data)
      ) {
        const transformedData = {
          ...response.data,
          data: response.data.data.flatMap((dentist: ApiDentistData) =>
            dentist.schedules.map((schedule: ApiScheduleItem) => ({
              id: schedule.scheduleId,
              scheduleId: schedule.scheduleId,
              dentistId: dentist.dentistID,
              dentistName: dentist.dentistName,
              date: schedule.workDate.split("T")[0], 
              workDate: schedule.workDate,
              shift: schedule.shift,
              status: schedule.status,
              note: schedule.note || "",
              createdAt: schedule.createdAt,
              updatedAt: schedule.updatedAt,
              isActive: true, 
            }))
          ),
        };
        return transformedData;
      }

      return response.data;
    },
    enabled: !!user, 
    staleTime: 5 * 60 * 1000,      
    gcTime: 10 * 60 * 1000,  
    refetchOnWindowFocus: true, 
    refetchOnMount: false, 
  });
};

// Hook để lấy lịch làm việc của một bác sĩ cụ thể
export const useDentistSchedule = (dentistId?: number) => {
  return useQuery({
    queryKey: ["schedules", "dentist", dentistId],
    queryFn: async () => {
      if (!dentistId) return { data: [] };
      const response = await axiosInstance.get(
        `/schedule/dentist/${dentistId}`
      );

      if (response.data && Array.isArray(response.data)) {
        const transformedData = {
          data: response.data.flatMap((dentist: any) =>
            dentist.schedules.map((schedule: any) => ({
              id: schedule.scheduleId,
              scheduleId: schedule.scheduleId,
              dentistId: dentist.dentistID,
              dentistName: dentist.dentistName,
              date: schedule.workDate.split("T")[0], 
              workDate: schedule.workDate,
              shift: schedule.shift,
              status: schedule.status,
              note: schedule.note || "",
              createdAt: schedule.createdAt,
              updatedAt: schedule.updatedAt,
              isActive: true, 
            }))
          ),
        };
        return transformedData;
      }

      return { data: [] };
    },
    enabled: !!dentistId, 
    staleTime: 0, 
    gcTime: 0,
  });
};

// Hook để tạo lịch làm việc mới cho bác sĩ
export const useCreateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      scheduleData: ScheduleInput | ScheduleInput[] | ApiScheduleInput
    ) => {
      let apiData;
      if (Array.isArray(scheduleData)) {
        apiData = {
          regisSchedules: scheduleData.map((schedule) => ({
            workDate: `${schedule.date}T${
              shiftHourMap[schedule.shift] || "08:00:00"
            }`,
            shift: schedule.shift,
          })),
        };
      } else if ("regisSchedules" in scheduleData) {
        apiData = scheduleData;
      } else {
        apiData = {
          regisSchedules: [
            {
              workDate: `${scheduleData.date}T${
                shiftHourMap[scheduleData.shift] || "08:00:00"
              }`,
              shift: scheduleData.shift,
            },
          ],
        };
      }

      const response = await axiosInstance.post(
        "/schedule/dentist/create",
        apiData
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.refetchQueries({ queryKey: ["schedules"] });
    },
    onError: (error: unknown) => {
      console.error(
        "Chi tiết lỗi:",
        (error as { response?: { data?: unknown } }).response?.data
      );
    },
  });
};

// Hook để chỉnh sửa lịch làm việc
export const useEditSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scheduleData: {
      scheduleId: number;
      workDate: string;
      shift: string;
    }) => {
      const apiData = {
        scheduleId: scheduleData.scheduleId,
        workDate: new Date(scheduleData.workDate).toISOString(),
        shift: scheduleData.shift,
      };

      const response = await axiosInstance.put(
        "/schedule/dentist/edit",
        apiData
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.refetchQueries({ queryKey: ["schedules"] });
    },
    onError: (error: unknown) => {
      console.error(
        "Chi tiết lỗi:",
        (error as { response?: { data?: unknown } }).response?.data
      );
    },
  });
};

// Hook để phê duyệt hoặc từ chối lịch làm việc
export const useApproveSchedules = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      scheduleIds: number[];
      action: "approved" | "rejected";
    }) => {
      const response = await axiosInstance.put(
        "/schedule/dentist/approve",
        data
      );
      return response.data;
    },
    retry: false, 
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
    },
    onError: (error: unknown) => {
      console.error(
        "Chi tiết lỗi:",
        (error as { response?: { data?: unknown } }).response?.data
      );
    },
  });
};

// Hook để tạo nhiều lịch làm việc cùng lúc
export const useBulkCreateSchedules = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      schedulesData: ScheduleInput | ScheduleInput[] | ApiScheduleInput
    ) => {
      let apiData;
      if ("regisSchedules" in schedulesData) {
        apiData = schedulesData;
      } else if (Array.isArray(schedulesData)) {
        apiData = {
          regisSchedules: schedulesData.map((schedule) => ({
            workDate: `${schedule.date}T${
              shiftHourMap[schedule.shift] || "08:00:00"
            }`,
            shift: schedule.shift,
          })),
        };
      } else {
        apiData = {
          regisSchedules: [
            {
              workDate: `${schedulesData.date}T${
                shiftHourMap[schedulesData.shift] || "08:00:00"
              }`,
              shift: schedulesData.shift,
            },
          ],
        };
      }

      const response = await axiosInstance.post(
        "/schedule/dentist/create",
        apiData
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.refetchQueries({ queryKey: ["schedules"] });
    },
    onError: (error: unknown) => {
      console.error(
        "Chi tiết lỗi:",
        (error as { response?: { data?: unknown } }).response?.data
      );
    },
  });
};

// Hook để xóa lịch làm việc bằng DELETE method
export const useDeleteSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scheduleId: number) => {
      const response = await axiosInstance.delete(`/schedule/dentist/cancel/`, {
        data: { scheduleId },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.refetchQueries({ queryKey: ["schedules"] });
    },
    onError: (error: unknown) => {
      console.error(
        "Chi tiết lỗi:",
        (error as { response?: { data?: unknown } }).response?.data
      );
    },
  });
};
