import type { Supply } from '@/types/supply';

export const mockSupplies: Supply[] = [
  {
    SupplyId: 1,
    Name: "Khẩu trang y tế 3 lớp",
    Unit: "Hộp",
    QuantityInStock: 150,
    ExpiryDate: "2025-12-31",
    Price: 45000,
    CreatedAt: "2024-01-15T08:30:00Z",
    UpdatedAt: "2024-02-20T10:15:00Z",
    CreatedBy: 1,
    UpdatedBy: 1,
    IsDeleted: false
  },
  {
    SupplyId: 2,
    Name: "Găng tay cao su không bột",
    Unit: "Hộp",
    QuantityInStock: 75,
    ExpiryDate: "2025-06-30",
    Price: 120000,
    CreatedAt: "2024-01-20T09:45:00Z",
    UpdatedAt: "2024-02-25T14:20:00Z",
    CreatedBy: 1,
    UpdatedBy: 2,
    IsDeleted: false
  },
  {
    SupplyId: 3,
    Name: "Kim tiêm 21G",
    Unit: "Cái",
    QuantityInStock: 500,
    ExpiryDate: "2026-03-15",
    Price: 2500,
    CreatedAt: "2024-02-01T11:20:00Z",
    UpdatedAt: "2024-02-01T11:20:00Z",
    CreatedBy: 2,
    UpdatedBy: 2,
    IsDeleted: false
  },
  {
    SupplyId: 4,
    Name: "Dung dịch sát khuẩn Betadine",
    Unit: "Chai",
    QuantityInStock: 25,
    ExpiryDate: "2024-08-30",
    Price: 85000,
    CreatedAt: "2024-02-05T13:15:00Z",
    UpdatedAt: "2024-02-28T16:30:00Z",
    CreatedBy: 1,
    UpdatedBy: 1,
    IsDeleted: false
  },
  {
    SupplyId: 5,
    Name: "Băng gạc y tế vô trùng",
    Unit: "Cuộn",
    QuantityInStock: 200,
    ExpiryDate: "2025-10-20",
    Price: 15000,
    CreatedAt: "2024-02-10T15:45:00Z",
    UpdatedAt: "2024-03-01T09:10:00Z",
    CreatedBy: 2,
    UpdatedBy: 1,
    IsDeleted: false
  },
  {
    SupplyId: 6,
    Name: "Ống tiêm 5ml",
    Unit: "Cái",
    QuantityInStock: 300,
    ExpiryDate: "2025-09-15",
    Price: 3000,
    CreatedAt: "2024-02-12T10:30:00Z",
    UpdatedAt: "2024-02-12T10:30:00Z",
    CreatedBy: 1,
    UpdatedBy: 1,
    IsDeleted: false
  },
  {
    SupplyId: 7,
    Name: "Cồn y tế 90%",
    Unit: "Chai",
    QuantityInStock: 40,
    ExpiryDate: "2025-12-25",
    Price: 35000,
    CreatedAt: "2024-02-15T14:20:00Z",
    UpdatedAt: "2024-03-05T11:45:00Z",
    CreatedBy: 2,
    UpdatedBy: 2,
    IsDeleted: false
  },
  {
    SupplyId: 8,
    Name: "Bông y tế vô trùng",
    Unit: "Gói",
    QuantityInStock: 120,
    ExpiryDate: "2025-07-10",
    Price: 25000,
    CreatedAt: "2024-02-18T16:00:00Z",
    UpdatedAt: "2024-02-18T16:00:00Z",
    CreatedBy: 1,
    UpdatedBy: 1,
    IsDeleted: false
  },
  {
    SupplyId: 9,
    Name: "Máy đo huyết áp điện tử",
    Unit: "Cái",
    QuantityInStock: 5,
    ExpiryDate: "2027-01-01",
    Price: 1500000,
    CreatedAt: "2024-02-20T09:30:00Z",
    UpdatedAt: "2024-02-20T09:30:00Z",
    CreatedBy: 1,
    UpdatedBy: 1,
    IsDeleted: false
  },
  {
    SupplyId: 10,
    Name: "Thuốc giảm đau Paracetamol 500mg",
    Unit: "Hộp",
    QuantityInStock: 80,
    ExpiryDate: "2024-11-30",
    Price: 45000,
    CreatedAt: "2024-02-22T11:15:00Z",
    UpdatedAt: "2024-03-08T14:25:00Z",
    CreatedBy: 2,
    UpdatedBy: 1,
    IsDeleted: false
  }
];

// Helper functions for mock API
export const getMockSupplies = (): Supply[] => {
  return mockSupplies.filter(supply => !supply.IsDeleted);
};

export const getMockSupplyById = (id: number): Supply | undefined => {
  return mockSupplies.find(supply => 
    supply.SupplyId === id && !supply.IsDeleted
  );
};

export const searchMockSupplies = (query: string): Supply[] => {
  if (!query) return getMockSupplies();
  
  return mockSupplies.filter(supply => 
    !supply.IsDeleted && 
    supply.Name.toLowerCase().includes(query.toLowerCase())
  );
};

export const getLowStockSupplies = (threshold: number = 50): Supply[] => {
  return mockSupplies.filter(supply => 
    !supply.IsDeleted && 
    supply.QuantityInStock <= threshold
  );
};

export const getExpiringSoonSupplies = (days: number = 30): Supply[] => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return mockSupplies.filter(supply => 
    !supply.IsDeleted && 
    new Date(supply.ExpiryDate) <= futureDate
  );
};