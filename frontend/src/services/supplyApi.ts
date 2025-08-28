import axiosInstance from "@/lib/axios";
import type {
  Supply,
  CreateSupplyRequest,
  UpdateSupplyRequest,
} from "@/types/supply";

import type { SupplyItem } from "@/types/procedure"

export const mapToSupplyItem = (supply: Supply): SupplyItem => ({
  id: supply.SupplyID,
  name: supply.Name,
  unit: supply.Unit,
  price: supply.Price,
  inStock: supply.QuantityInStock,
  createdAt: supply.CreatedAt || null,
})


function mapSupplyFromApi(apiSupply: any): Supply {
  return {
    SupplyID: apiSupply.supplyID ?? apiSupply.SupplyID ?? 0,
    Name: apiSupply.name ?? apiSupply.Name ?? "",
    Unit: apiSupply.unit ?? apiSupply.Unit ?? "",
    QuantityInStock:
      apiSupply.quantityInStock ?? apiSupply.QuantityInStock ?? 0,
    ExpiryDate: apiSupply.expiryDate ?? apiSupply.ExpiryDate ?? "",
    Price: apiSupply.price ?? apiSupply.Price ?? 0,
    CreatedAt: apiSupply.createdAt ?? apiSupply.CreatedAt ?? "",
    UpdatedAt: apiSupply.updatedAt ?? apiSupply.UpdatedAt ?? "",
    CreatedBy: apiSupply.createdBy ?? apiSupply.CreatedBy ?? null,
    UpdatedBy: (apiSupply.updateBy ?? apiSupply.UpdatedBy) === 0 || 
               (apiSupply.updateBy ?? apiSupply.UpdatedBy) === null || 
               (apiSupply.updateBy ?? apiSupply.UpdatedBy) === undefined ||
               (apiSupply.updateBy ?? apiSupply.UpdatedBy) === 'unknown' ? 
               null : (apiSupply.updateBy ?? apiSupply.UpdatedBy),
    IsDeleted: apiSupply.isDeleted ?? apiSupply.IsDeleted ?? false,
    isDeleted: apiSupply.isDeleted ?? apiSupply.IsDeleted ?? 0, // 0 = active, 1 = deleted
  };
}

export const supplyApi = {
  // Get all supplies
  getSupplies: async (): Promise<Supply[]> => {
    const response = await axiosInstance.get("/supplies/ListSupplies");
    return (response.data as any[]).map(mapSupplyFromApi);
  },

  // Get single supply by ID
  getSupplyById: async (supplyId: number): Promise<Supply> => {
    const response = await axiosInstance.get(`/supplies/${supplyId}`);
    return mapSupplyFromApi(response.data);
  },

  // Create new supply
  createSupply: async (data: CreateSupplyRequest): Promise<Supply> => {
    const response = await axiosInstance.post("/supplies/createSupply", data);
    return mapSupplyFromApi(response.data);
  },

  // Update supply
  updateSupply: async (data: UpdateSupplyRequest): Promise<Supply> => {
    const response = await axiosInstance.put("/supplies/editSupply", data);
    return mapSupplyFromApi(response.data);
  },

  // Delete/Undelete supply (toggle activation)
  toggleSupplyActivation: async (supplyId: number): Promise<void> => {
    await axiosInstance.put(`/supplies/DeleteandUndeleteSupply/${supplyId}`);
  },

  // Export Excel 
  exportExcel: async (): Promise<Blob> => {
    const response = await axiosInstance.post(
      "/supplies/export-excel",
      {},
      {
        responseType: "blob",
      }
    );
    return response.data;
  },

  // Download Excel template
  downloadExcelTemplate: async (): Promise<Blob> => {
    const response = await axiosInstance.post(
      "/supplies/excel-template",
      {},
      { responseType: "blob" }
    );
    return response.data;
  },

  // Import supplies from Excel
  importExcel: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axiosInstance.post(
      "/supplies/import-excel",
      formData,
      {
        headers: {
          "ngrok-skip-browser-warning": "true",
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },
};

