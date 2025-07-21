import axiosInstance from "@/lib/axios";
import type {
  CreatePatientImageRequest,
  GetPatientImagesParams,
  PatientImageResponse,
  CreatePatientImageResponse,
} from "@/types/patientImage";

export const patientImageService = {
  // Get patient images
  async getPatientImages(
    params: GetPatientImagesParams
  ): Promise<PatientImageResponse> {
    const response = await axiosInstance.get("/patient-image", { params });
    return response.data;
  },

  // Create patient image
  async createPatientImage(
    data: CreatePatientImageRequest
  ): Promise<CreatePatientImageResponse> {
    const formData = new FormData();
    formData.append("PatientId", data.patientId.toString());
    formData.append("ImageFile", data.imageFile);

    if (data.description) {
      formData.append("Description", data.description);
    }

    if (data.treatmentRecordId) {
      formData.append("TreatmentRecordId", data.treatmentRecordId.toString());
    }

    if (data.orthodonticTreatmentPlanId) {
      formData.append(
        "OrthodonticTreatmentPlanId",
        data.orthodonticTreatmentPlanId.toString()
      );
    }

    const response = await axiosInstance.post("/patient-image", formData, {
      headers: {
        "ngrok-skip-browser-warning": "true",
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Delete patient image
  async deletePatientImage(
    imageId: number
  ): Promise<{ message: string; success: boolean }> {
    const response = await axiosInstance.delete("/patient-image", {
      params: { imageId },
    });
    return response.data;
  },
};
