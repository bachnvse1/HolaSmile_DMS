import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { prescriptionTemplateApi } from '@/services/prescriptionTemplateApi';
import type { 
  PrescriptionTemplate, 
  CreatePrescriptionTemplateRequest,
  UpdatePrescriptionTemplateRequest
} from '@/types/prescriptionTemplate';

// Query keys
const PRESCRIPTION_TEMPLATE_KEYS = {
  all: ['prescription-templates'] as const,
  lists: () => [...PRESCRIPTION_TEMPLATE_KEYS.all, 'list'] as const,
  list: (searchQuery?: string) => [...PRESCRIPTION_TEMPLATE_KEYS.lists(), { searchQuery }] as const,
};

// Hook for getting all prescription templates
export const usePrescriptionTemplates = (searchQuery?: string) => {
  return useQuery({
    queryKey: PRESCRIPTION_TEMPLATE_KEYS.list(searchQuery),
    queryFn: async () => {
      const templates = await prescriptionTemplateApi.getPrescriptionTemplates();
      
      // Filter by search query if provided
      if (searchQuery) {
        return templates.filter(template => 
          template.PreTemplateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.PreTemplateContext.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      return templates;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Hook for getting single prescription template (from list API)
export const usePrescriptionTemplate = (id: number) => {
  const { data: allTemplates, isLoading, error } = usePrescriptionTemplates();
  
  return {
    data: allTemplates?.find(template => template.PreTemplateID === id) || null,
    isLoading,
    error
  };
};

// Hook for creating prescription template
export const useCreatePrescriptionTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePrescriptionTemplateRequest) => 
      prescriptionTemplateApi.createPrescriptionTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRESCRIPTION_TEMPLATE_KEYS.lists() });
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
      queryClient.invalidateQueries({ queryKey: PRESCRIPTION_TEMPLATE_KEYS.lists() });
    },
  });
};

// Hook for deactivating prescription template
export const useDeactivatePrescriptionTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => prescriptionTemplateApi.deactivatePrescriptionTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRESCRIPTION_TEMPLATE_KEYS.all });
    },
  });
};