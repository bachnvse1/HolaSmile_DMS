import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientImageService } from '@/services/patientImageService';
import type { CreatePatientImageRequest, GetPatientImagesParams } from '@/types/patientImage';
import { toast } from 'react-toastify';

// Hook to get patient images
export const usePatientImages = (params: GetPatientImagesParams) => {
  return useQuery({
    queryKey: ['patient-images', params],
    queryFn: async () => {
      try {
        const response = await patientImageService.getPatientImages(params);
        
        // If response is already an array, return it directly
        if (Array.isArray(response)) {
          return response;
        }
        
        // If response has data property, return that
        if (response && typeof response === 'object' && 'data' in response) {
          return response.data;
        }
        
        // Fallback
        return response;
      } catch (error: unknown) {
        // Return empty data for 404 instead of throwing
        const err = error as { response?: { status: number }; message?: string };
        if (err?.response?.status === 404 || err?.message?.includes('404')) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!(params.patientId || params.treatmentRecordId || params.orthodonticTreatmentPlanId),
    retry: (failureCount, error: unknown) => {
      // Don't retry on 404 errors
      const err = error as { response?: { status: number }; message?: string };
      if (err?.response?.status === 404 || err?.message?.includes('404') || err?.message?.includes('Not Found')) {
        return false;
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus: false,
    staleTime: 1 * 60 * 1000, 
  });
};

// Hook to create patient image
export const useCreatePatientImage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreatePatientImageRequest) => 
      patientImageService.createPatientImage(data),
    onSuccess: (data) => {
      toast.success(data.message || 'Thêm ảnh thành công');
      queryClient.invalidateQueries({ 
        queryKey: ['patient-images'],
        exact: false 
      });
    },
    onError: (error) => {
      console.error('Error creating patient image:', error);
      toast.error('Có lỗi xảy ra khi thêm ảnh');
    },
  });
};

// Hook to delete patient image
export const useDeletePatientImage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (imageId: number) => 
      patientImageService.deletePatientImage(imageId),
    onSuccess: (data) => {
      toast.success(data.message || 'Xóa ảnh thành công');
      queryClient.invalidateQueries({ 
        queryKey: ['patient-images'],
        exact: false  
      });
    },
    onError: (error) => {
      console.error('Error deleting patient image:', error);
      toast.error('Có lỗi xảy ra khi xóa ảnh');
    },
  });
};