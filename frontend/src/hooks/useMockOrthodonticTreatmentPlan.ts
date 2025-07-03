import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import type { 
  OrthodonticTreatmentPlan, 
  CreateOrthodonticTreatmentPlanRequest, 
  UpdateOrthodonticTreatmentPlanRequest 
} from '@/types/orthodonticTreatmentPlan';
import { 
  mockOrthodonticTreatmentPlans,
  getMockTreatmentPlansByPatientId,
  getMockTreatmentPlanById
} from '@/data/mockOrthodonticTreatmentPlans';

// Simulate loading delay
const simulateDelay = (ms: number = 1000) => new Promise(resolve => setTimeout(resolve, ms));

// Get all treatment plans for a patient
export const useOrthodonticTreatmentPlans = (patientId: number) => {
  const [data, setData] = useState<OrthodonticTreatmentPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Mock hook loading data for patientId:', patientId);
        setIsLoading(true);
        await simulateDelay(800); // Simulate API call
        
        if (patientId) {
          const plans = getMockTreatmentPlansByPatientId(patientId);
          console.log('Mock hook found plans:', plans);
          setData(plans);
        } else {
          setData([]);
        }
        setError(null);
      } catch (err) {
        console.error('Mock hook error:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
        console.log('Mock hook finished loading');
      }
    };

    fetchData();
  }, [patientId]);

  return { data, isLoading, error };
};

// Get single treatment plan
export const useOrthodonticTreatmentPlan = (planId: number) => {
  const [data, setData] = useState<OrthodonticTreatmentPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        await simulateDelay(500);
        
        if (planId) {
          const plan = getMockTreatmentPlanById(planId);
          setData(plan || null);
        } else {
          setData(null);
        }
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [planId]);

  return { data, isLoading, error };
};

// Create treatment plan
export const useCreateOrthodonticTreatmentPlan = () => {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async (data: CreateOrthodonticTreatmentPlanRequest): Promise<OrthodonticTreatmentPlan> => {
    setIsPending(true);
    
    try {
      await simulateDelay(1500); // Simulate API call
      
      // Create new plan with mock ID
      const newPlan: OrthodonticTreatmentPlan = {
        ...data,
        planId: Math.max(...mockOrthodonticTreatmentPlans.map(p => p.planId)) + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: data.dentistId,
        updatedBy: data.dentistId,
        isDeleted: false,
        patient: {
          fullname: "Nguyễn Hoài Na", // Mock patient info
          phone: "0941120025",
          email: "hoaina@email.com"
        },
        dentist: {
          fullname: "BS. Trần Văn Minh" // Mock dentist info
        }
      };

      // Add to mock data
      mockOrthodonticTreatmentPlans.push(newPlan);
      
      toast.success('Tạo kế hoạch điều trị thành công!');
      return newPlan;
    } catch (error) {
      toast.error('Có lỗi xảy ra khi tạo kế hoạch điều trị');
      throw error;
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
};

// Update treatment plan
export const useUpdateOrthodonticTreatmentPlan = () => {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async (data: UpdateOrthodonticTreatmentPlanRequest): Promise<OrthodonticTreatmentPlan> => {
    setIsPending(true);
    
    try {
      await simulateDelay(1200); // Simulate API call
      
      const existingPlanIndex = mockOrthodonticTreatmentPlans.findIndex(p => p.planId === data.planId);
      if (existingPlanIndex === -1) {
        throw new Error('Không tìm thấy kế hoạch điều trị');
      }

      // Update the plan
      const updatedPlan: OrthodonticTreatmentPlan = {
        ...mockOrthodonticTreatmentPlans[existingPlanIndex],
        ...data,
        updatedAt: new Date().toISOString(),
        updatedBy: data.dentistId,
      };

      mockOrthodonticTreatmentPlans[existingPlanIndex] = updatedPlan;
      
      toast.success('Cập nhật kế hoạch điều trị thành công!');
      return updatedPlan;
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật kế hoạch điều trị');
      throw error;
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
};

// Delete treatment plan
export const useDeleteOrthodonticTreatmentPlan = () => {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async (planId: number): Promise<void> => {
    setIsPending(true);
    
    try {
      await simulateDelay(800); // Simulate API call
      
      const planIndex = mockOrthodonticTreatmentPlans.findIndex(p => p.planId === planId);
      if (planIndex === -1) {
        throw new Error('Không tìm thấy kế hoạch điều trị');
      }

      // Remove from mock data (or mark as deleted)
      mockOrthodonticTreatmentPlans.splice(planIndex, 1);
      // Alternative: mockOrthodonticTreatmentPlans[planIndex].isDeleted = true;
      
      toast.success('Xóa kế hoạch điều trị thành công!');
    } catch (error) {
      toast.error('Có lỗi xảy ra khi xóa kế hoạch điều trị');
      throw error;
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
};