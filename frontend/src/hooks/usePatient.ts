import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';

export interface Patient {
  patientId: number;
  fullname: string;
  phone: string;
  email: string;
  address?: string;
  dob?: string;
  gender: boolean;
  patientGroup?: string;
  underlyingConditions?: string;
  avatar?: string;
}

// Get patient by ID
export const usePatient = (patientId: number) => {
  return useQuery({
    queryKey: ['patient', patientId],
    queryFn: async (): Promise<Patient> => {
      const response = await axiosInstance.get(`/patient/${patientId}`);
      return response.data;
    },
    enabled: !!patientId && patientId > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};