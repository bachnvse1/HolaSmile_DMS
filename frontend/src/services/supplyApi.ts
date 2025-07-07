import axiosInstance from "@/lib/axios";
import type {
  Supply,
  CreateSupplyRequest,
  UpdateSupplyRequest,
} from "@/types/supply";

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
    CreatedBy: Number(apiSupply.createdBy ?? apiSupply.CreatedBy ?? 0),
    UpdatedBy: Number(apiSupply.updateBy ?? apiSupply.UpdatedBy ?? 0),
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
    return response.data;
  },

  // Delete/Undelete supply (toggle activation)
  toggleSupplyActivation: async (supplyId: number): Promise<void> => {
    await axiosInstance.put(`/supplies/DeleteandUndeleteSupply/${supplyId}`);
  },

  // Export supplies to Excel
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
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },
};
