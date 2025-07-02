import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../lib/axios";

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

// Types for API response
type ApiScheduleItem = {
  scheduleId: number;
  dentistName?: string;
  workDate: string;
  shift: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  note?: string;
  isActive?: boolean; // Thêm field isActive từ API
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
  return useQuery({
    queryKey: ["schedules", "all"],
    queryFn: async () => {
      const response = await axiosInstance.get("/schedule/dentist/list");

      // Transform dữ liệu từ API format sang component format
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
              date: schedule.workDate.split("T")[0], // Chuyển từ ISO string sang YYYY-MM-DD
              workDate: schedule.workDate,
              shift: schedule.shift,
              status: schedule.status,
              note: schedule.note || "",
              createdAt: schedule.createdAt,
              updatedAt: schedule.updatedAt,
              isActive: true, // Luôn hiển thị để user thấy trạng thái
            }))
          ),
        };
        return transformedData;
      }

      return response.data;
    },
    staleTime: 0, // Luôn fetch dữ liệu mới
    gcTime: 0, // Không cache dữ liệu (gcTime thay cho cacheTime trong v5)
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

      // Transform dữ liệu từ API format sang component format
      if (response.data && Array.isArray(response.data)) {
        const transformedData = {
          data: response.data.flatMap((dentist: any) =>
            dentist.schedules.map((schedule: any) => ({
              id: schedule.scheduleId,
              scheduleId: schedule.scheduleId,
              dentistId: dentist.dentistID,
              dentistName: dentist.dentistName,
              date: schedule.workDate.split("T")[0], // Chuyển từ ISO string sang YYYY-MM-DD
              workDate: schedule.workDate,
              shift: schedule.shift,
              status: schedule.status,
              note: schedule.note || "",
              createdAt: schedule.createdAt,
              updatedAt: schedule.updatedAt,
              isActive: true, // Luôn hiển thị để user thấy trạng thái
            }))
          ),
        };
        return transformedData;
      }

      return { data: [] };
    },
    enabled: !!dentistId, // Chỉ gọi API khi có dentistId
    staleTime: 0, // Luôn fetch dữ liệu mới
    gcTime: 0, // Không cache dữ liệu
  });
};

// Hook để tạo lịch làm việc mới cho bác sĩ
export const useCreateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      scheduleData: ScheduleInput | ScheduleInput[] | ApiScheduleInput
    ) => {
      // Transform data to match API format
      let apiData;
      if (Array.isArray(scheduleData)) {
        // If array of schedules
        apiData = {
          regisSchedules: scheduleData.map((schedule) => ({
            workDate: `${schedule.date}T${
              shiftHourMap[schedule.shift] || "08:00:00"
            }`,
            shift: schedule.shift,
          })),
        };
      } else if ("regisSchedules" in scheduleData) {
        // If already in correct format
        apiData = scheduleData;
      } else {
        // If single schedule object
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
    onSuccess: (data) => {
      console.log("Tạo lịch thành công:", data);

      // Invalidate và refetch các queries liên quan khi thành công
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.refetchQueries({ queryKey: ["schedules"] });
    },
    onError: (error: unknown) => {
      console.error("Lỗi khi tạo lịch:", error);
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
      // Format data theo yêu cầu API
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
    onSuccess: (data) => {
      console.log("Cập nhật lịch thành công:", data);
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.refetchQueries({ queryKey: ["schedules"] });
    },
    onError: (error: unknown) => {
      console.error("Lỗi khi cập nhật lịch:", error);
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
    onSuccess: (data) => {
      console.log("Phê duyệt lịch thành công:", data);
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.refetchQueries({ queryKey: ["schedules"] });
    },
    onError: (error: unknown) => {
      console.error("Lỗi khi phê duyệt lịch:", error);
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
      // Transform data to match API format
      let apiData;
      if ("regisSchedules" in schedulesData) {
        // If already in correct format
        apiData = schedulesData;
      } else if (Array.isArray(schedulesData)) {
        // If array of schedules
        apiData = {
          regisSchedules: schedulesData.map((schedule) => ({
            workDate: `${schedule.date}T${
              shiftHourMap[schedule.shift] || "08:00:00"
            }`,
            shift: schedule.shift,
          })),
        };
      } else {
        // Single schedule
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
    onSuccess: (data) => {
      console.log("Tạo nhiều lịch thành công:", data);
      // Invalidate và refetch các queries liên quan khi thành công
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.refetchQueries({ queryKey: ["schedules"] });
    },
    onError: (error: unknown) => {
      console.error("Lỗi khi tạo nhiều lịch:", error);
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
    onSuccess: (data) => {
      console.log("Xóa lịch thành công:", data);
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.refetchQueries({ queryKey: ["schedules"] });
    },
    onError: (error: unknown) => {
      console.error("Lỗi khi xóa lịch:", error);
      console.error(
        "Chi tiết lỗi:",
        (error as { response?: { data?: unknown } }).response?.data
      );
    },
  });
};
