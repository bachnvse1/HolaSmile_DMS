import { useState, useEffect } from 'react';
import type { 
  PrescriptionTemplate, 
  CreatePrescriptionTemplateRequest, 
  UpdatePrescriptionTemplateRequest 
} from '@/types/prescriptionTemplate';
import { 
  getMockPrescriptionTemplates, 
  getMockPrescriptionTemplateById,
  searchMockPrescriptionTemplates,
  mockPrescriptionTemplates 
} from '@/data/mockPrescriptionTemplates';

// Simulate API delay
const simulateDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Hook for getting all prescription templates
export const usePrescriptionTemplates = (searchQuery?: string) => {
  const [data, setData] = useState<PrescriptionTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        await simulateDelay(300);
        
        const templates = searchQuery 
          ? searchMockPrescriptionTemplates(searchQuery)
          : getMockPrescriptionTemplates();
          
        setData(templates);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [searchQuery]);

  return { data, isLoading, error, refetch: () => setIsLoading(true) };
};

// Hook for getting single prescription template
export const usePrescriptionTemplate = (id: number) => {
  const [data, setData] = useState<PrescriptionTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        await simulateDelay(300);
        
        const template = getMockPrescriptionTemplateById(id);
        setData(template || null);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  return { data, isLoading, error };
};

// Hook for creating prescription template
export const useCreatePrescriptionTemplate = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async (templateData: CreatePrescriptionTemplateRequest): Promise<PrescriptionTemplate> => {
    try {
      setIsLoading(true);
      setError(null);
      
      await simulateDelay(800);
      
      const newTemplate: PrescriptionTemplate = {
        PreTemplateID: Math.max(...mockPrescriptionTemplates.map(t => t.PreTemplateID)) + 1,
        PreTemplateName: templateData.PreTemplateName,
        PreTemplateContext: templateData.PreTemplateContext,
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString(),
        IsDeleted: false
      };
      
      // Add to mock data
      mockPrescriptionTemplates.push(newTemplate);
      
      return newTemplate;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { mutate, isLoading, error };
};

// Hook for updating prescription template
export const useUpdatePrescriptionTemplate = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async (templateData: UpdatePrescriptionTemplateRequest): Promise<PrescriptionTemplate> => {
    try {
      setIsLoading(true);
      setError(null);
      
      await simulateDelay(800);
      
      const templateIndex = mockPrescriptionTemplates.findIndex(
        t => t.PreTemplateID === templateData.PreTemplateID
      );
      
      if (templateIndex === -1) {
        throw new Error('Template không tồn tại');
      }
      
      // Update the template
      mockPrescriptionTemplates[templateIndex] = {
        ...mockPrescriptionTemplates[templateIndex],
        PreTemplateName: templateData.PreTemplateName,
        PreTemplateContext: templateData.PreTemplateContext,
        UpdatedAt: new Date().toISOString()
      };
      
      return mockPrescriptionTemplates[templateIndex];
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { mutate, isLoading, error };
};

// Hook for deactivating prescription template
export const useDeactivatePrescriptionTemplate = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async (id: number): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      await simulateDelay(500);
      
      const templateIndex = mockPrescriptionTemplates.findIndex(
        t => t.PreTemplateID === id
      );
      
      if (templateIndex === -1) {
        throw new Error('Template không tồn tại');
      }
      
      // Mark as deleted
      mockPrescriptionTemplates[templateIndex].IsDeleted = true;
      mockPrescriptionTemplates[templateIndex].UpdatedAt = new Date().toISOString();
      
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { mutate, isLoading, error };
};