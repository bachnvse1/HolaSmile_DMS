import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { prescriptionTemplateApi } from "@/services/prescriptionTemplateApi";
import type {
  CreatePrescriptionTemplateRequest,
  UpdatePrescriptionTemplateRequest,
} from "@/types/prescriptionTemplate";

// Query keys
const PRESCRIPTION_TEMPLATE_KEYS = {
  all: ["prescription-templates"] as const,
  lists: () => [...PRESCRIPTION_TEMPLATE_KEYS.all, "list"] as const,
  list: (searchQuery?: string) =>
    [...PRESCRIPTION_TEMPLATE_KEYS.lists(), { searchQuery }] as const,
};

// Hook for getting all prescription templates
export const usePrescriptionTemplates = (searchQuery?: string) => {
  return useQuery({
    queryKey: PRESCRIPTION_TEMPLATE_KEYS.list(searchQuery),
    queryFn: async () => {
      try {
        const response = await prescriptionTemplateApi.getPrescriptionTemplates();
        
        // Handle different response formats
        let templates = response;
        
        // If response is not an array, check for data property or message
        if (!Array.isArray(response)) {
          // Check if response has message indicating no data
          if (response?.message === "Không có dữ liệu phù hợp") {
            return [];
          }
          
          // Check if response has data property
          if (response?.data && Array.isArray(response.data)) {
            templates = response.data;
          } else {
            // If response format is unexpected but not empty data error, return empty array
            console.warn('Unexpected response format:', response);
            return [];
          }
        }

        // Filter by search query if provided
        if (searchQuery && Array.isArray(templates)) {
          return templates.filter(
            (template) =>
              template.PreTemplateName.toLowerCase().includes(
                searchQuery.toLowerCase()
              ) ||
              template.PreTemplateContext.toLowerCase().includes(
                searchQuery.toLowerCase()
              )
          );
        }

        return Array.isArray(templates) ? templates : [];
      } catch (error: unknown) {
        // Handle API errors that indicate empty data
        const apiError = error as { 
          response?: { 
            status?: number; 
            data?: { message?: string } | string 
          };
          message?: string;
        };
        
        // Handle status 200 with empty data message
        if (apiError?.response?.status === 200) {
          const responseData = apiError.response.data;
          if (typeof responseData === 'object' && responseData?.message === "Không có dữ liệu phù hợp") {
            return [];
          }
          if (typeof responseData === 'string' && responseData.includes("Không có dữ liệu phù hợp")) {
            return [];
          }
        }
        
        // Handle other common empty data scenarios
        if (apiError?.message?.includes('is not a function') || 
            apiError?.message?.includes('Cannot read property') ||
            apiError?.message?.includes('map is not a function')) {
          console.warn('Data format error, treating as empty data:', apiError.message);
          return [];
        }
        
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Hook for getting single prescription template (from list API)
export const usePrescriptionTemplate = (id: number) => {
  const { data: allTemplates, isLoading, error } = usePrescriptionTemplates();

  return {
    data:
      allTemplates?.find((template) => template.PreTemplateID === id) || null,
    isLoading,
    error,
  };
};

// Hook for creating prescription template
export const useCreatePrescriptionTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePrescriptionTemplateRequest) =>
      prescriptionTemplateApi.createPrescriptionTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: PRESCRIPTION_TEMPLATE_KEYS.lists(),
      });
    },
  });
};

// Hook for updating prescription template
export const useUpdatePrescriptionTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePrescriptionTemplateRequest) =>
      prescriptionTemplateApi.updatePrescriptionTemplate(data),
    onSuccess: () => {
      // Just invalidate the list, detail will automatically update
      queryClient.invalidateQueries({
        queryKey: PRESCRIPTION_TEMPLATE_KEYS.lists(),
      });
    },
  });
};

// Hook for deactivating prescription template
export const useDeactivatePrescriptionTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      prescriptionTemplateApi.deactivatePrescriptionTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: PRESCRIPTION_TEMPLATE_KEYS.all,
      });
    },
  });
};
