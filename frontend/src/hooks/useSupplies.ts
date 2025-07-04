import { useState, useEffect } from 'react';
import type { 
  Supply, 
  CreateSupplyRequest, 
  UpdateSupplyRequest 
} from '@/types/supply';
import { 
  getMockSupplies, 
  getMockSupplyById,
  searchMockSupplies,
  getLowStockSupplies,
  getExpiringSoonSupplies,
  mockSupplies 
} from '@/data/mockSupplies';

// Simulate API delay
const simulateDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Hook for getting all supplies
export const useSupplies = (searchQuery?: string) => {
  const [data, setData] = useState<Supply[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        await simulateDelay(300);
        
        const supplies = searchQuery 
          ? searchMockSupplies(searchQuery)
          : getMockSupplies();
          
        setData(supplies);
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

// Hook for getting single supply
export const useSupply = (id: number) => {
  const [data, setData] = useState<Supply | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        await simulateDelay(300);
        
        const supply = getMockSupplyById(id);
        setData(supply || null);
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

// Hook for creating supply
export const useCreateSupply = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async (supplyData: CreateSupplyRequest): Promise<Supply> => {
    try {
      setIsLoading(true);
      setError(null);
      
      await simulateDelay(800);
      
      const newSupply: Supply = {
        SupplyId: Math.max(...mockSupplies.map(s => s.SupplyId)) + 1,
        Name: supplyData.Name,
        Unit: supplyData.Unit,
        QuantityInStock: supplyData.QuantityInStock,
        ExpiryDate: supplyData.ExpiryDate,
        Price: supplyData.Price,
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString(),
        CreatedBy: 1, // Mock user ID
        UpdatedBy: 1,
        IsDeleted: false
      };
      
      // Add to mock data
      mockSupplies.push(newSupply);
      
      return newSupply;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { mutate, isLoading, error };
};

// Hook for updating supply
export const useUpdateSupply = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async (supplyData: UpdateSupplyRequest): Promise<Supply> => {
    try {
      setIsLoading(true);
      setError(null);
      
      await simulateDelay(800);
      
      const supplyIndex = mockSupplies.findIndex(
        s => s.SupplyId === supplyData.SupplyId
      );
      
      if (supplyIndex === -1) {
        throw new Error('Vật tư không tồn tại');
      }
      
      // Update the supply
      mockSupplies[supplyIndex] = {
        ...mockSupplies[supplyIndex],
        Name: supplyData.Name,
        Unit: supplyData.Unit,
        QuantityInStock: supplyData.QuantityInStock,
        ExpiryDate: supplyData.ExpiryDate,
        Price: supplyData.Price,
        UpdatedAt: new Date().toISOString(),
        UpdatedBy: 1 // Mock user ID
      };
      
      return mockSupplies[supplyIndex];
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { mutate, isLoading, error };
};

// Hook for deactivating supply
export const useDeactivateSupply = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async (id: number): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      await simulateDelay(500);
      
      const supplyIndex = mockSupplies.findIndex(
        s => s.SupplyId === id
      );
      
      if (supplyIndex === -1) {
        throw new Error('Vật tư không tồn tại');
      }
      
      // Mark as deleted
      mockSupplies[supplyIndex].IsDeleted = true;
      mockSupplies[supplyIndex].UpdatedAt = new Date().toISOString();
      mockSupplies[supplyIndex].UpdatedBy = 1;
      
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { mutate, isLoading, error };
};

// Hook for supply statistics
export const useSupplyStats = () => {
  const [data, setData] = useState({
    totalSupplies: 0,
    lowStockCount: 0,
    expiringSoonCount: 0,
    totalValue: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        await simulateDelay(200);
        
        const supplies = getMockSupplies();
        const lowStock = getLowStockSupplies();
        const expiringSoon = getExpiringSoonSupplies();
        const totalValue = supplies.reduce((sum, supply) => 
          sum + (supply.Price * supply.QuantityInStock), 0
        );
        
        setData({
          totalSupplies: supplies.length,
          lowStockCount: lowStock.length,
          expiringSoonCount: expiringSoon.length,
          totalValue
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { data, isLoading };
};