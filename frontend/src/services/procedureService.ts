import axiosInstance from "@/lib/axios"; 
import type { Procedure } from "@/types/procedure";

export const getAllProcedures = async (): Promise<Procedure[]> => {
  const response = await axiosInstance.get<Procedure[]>("/procedures");
  return response.data;
};
