import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supplyApi } from '@/services/supplyApi';
import type { 
  CreateSupplyRequest, 
  UpdateSupplyRequest 
} from '@/types/supply';

// Query keys
const SUPPLY_KEYS = {
  all: ['supplies'] as const,
  lists: () => [...SUPPLY_KEYS.all, 'list'] as const,
  list: (searchQuery?: string) => [...SUPPLY_KEYS.lists(), { searchQuery }] as const,
  details: () => [...SUPPLY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...SUPPLY_KEYS.details(), id] as const,
  stats: () => [...SUPPLY_KEYS.all, 'stats'] as const,
};

// Hook for getting all supplies
export const useSupplies = (searchQuery?: string) => {
  return useQuery({
    queryKey: SUPPLY_KEYS.list(searchQuery),
    queryFn: async () => {
      try {
        const supplies = await supplyApi.getSupplies();
        
        // Filter by search query if provided
        if (searchQuery) {
          return supplies.filter(supply => 
            supply.Name.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        
        return supplies;
      } catch (error: unknown) {
        // Handle empty data case - return empty array instead of throwing error
        const apiError = error as { response?: { status?: number; data?: { message?: string } } };
        if (apiError?.response?.status === 500 && 
            apiError?.response?.data?.message === "Không có dữ liệu phù hợp") {
          return [];
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, 
  });
};

// Hook for getting single supply
export const useSupply = (id: number) => {
  return useQuery({
    queryKey: SUPPLY_KEYS.detail(id),
    queryFn: () => supplyApi.getSupplyById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, 
  });
};

// Hook for creating supply
export const useCreateSupply = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSupplyRequest) => supplyApi.createSupply(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: SUPPLY_KEYS.stats() });
    },
  });
};

// Hook for updating supply
export const useUpdateSupply = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateSupplyRequest) => supplyApi.updateSupply(data),
    onSuccess: (updatedSupply) => {
      // Update the specific supply in cache
      queryClient.setQueryData(
        SUPPLY_KEYS.detail(updatedSupply.SupplyID),
        updatedSupply
      );
      
      queryClient.invalidateQueries({ queryKey: SUPPLY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: SUPPLY_KEYS.stats() });
    },
  });
};

// Hook for deactivating supply
export const useDeactivateSupply = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => supplyApi.toggleSupplyActivation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLY_KEYS.all });
    },
  });
};

// Hook for supply statistics
export const useSupplyStats = () => {
  return useQuery({
    queryKey: SUPPLY_KEYS.stats(),
    queryFn: async () => {
      try {
        const supplies = await supplyApi.getSupplies();
        
        // Calculate statistics
        const lowStockSupplies = supplies.filter(supply => supply.QuantityInStock <= 50);
        const expiringSoonSupplies = supplies.filter(supply => {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 30);
          return new Date(supply.ExpiryDate) <= futureDate;
        });
        const totalValue = supplies.reduce((sum, supply) => 
          sum + (supply.Price * supply.QuantityInStock), 0
        );

        return {
          totalSupplies: supplies.length,
          lowStockCount: lowStockSupplies.length,
          expiringSoonCount: expiringSoonSupplies.length,
          totalValue
        };
      } catch (error: unknown) {
        // Handle empty data case - return zero stats instead of throwing error
        const apiError = error as { response?: { status?: number; data?: { message?: string } } };
        if (apiError?.response?.status === 500 && 
            apiError?.response?.data?.message === "Không có dữ liệu phù hợp") {
          return {
            totalSupplies: 0,
            lowStockCount: 0,
            expiringSoonCount: 0,
            totalValue: 0
          };
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, 
  });
};

// Hook for exporting supplies to Excel
export const useDownloadExcelSupplies = () => {
  return useMutation({
    mutationFn: () => supplyApi.downloadExcelTemplate(),
    onSuccess: (blob) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mẫu danh sách vật tư_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });
};

// Hook for exporting current supplies to Excel
export const useExportSupplies = () => {
  return useMutation({
    mutationFn: () => supplyApi.exportExcel(),
    onSuccess: (blob: Blob) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `danh sách vật tư_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });
};

// Hook for importing supplies from Excel
export const useImportSupplies = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => supplyApi.importExcel(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLY_KEYS.all });
    },
  });
};