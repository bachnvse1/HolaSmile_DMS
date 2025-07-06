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
      const supplies = await supplyApi.getSupplies();
      
      // Filter by search query if provided
      if (searchQuery) {
        return supplies.filter(supply => 
          supply.Name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      return supplies;
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
    },
    staleTime: 5 * 60 * 1000, 
  });
};