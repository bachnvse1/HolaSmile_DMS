export interface OrthodonticTreatmentPlan {
  planId: number;
  patientId: number;
  dentistId: number;
  planTitle: string;
  templateName: string;
  consultationDate: string;
  
  // Thông tin bệnh nhân (lấy từ bảng patient)
  patientInfo?: {
    fullname: string;
    dob: string;
    phone: string;
    email: string;
    address?: string;
  };
  
  // Tiểu sử y khoa
  medicalHistory: {
    benhtim: boolean;
    tieuduong: boolean;
    thenkinh: boolean;
    benhtruyen: boolean;
    caohuyetap: boolean;
    loangxuong: boolean;
    benhngan: boolean;
    chaymauhau: boolean;
  };
  
  // Lý do đến khám
  reasonForVisit: string;
  
  // Khám
  examination: {
    // Khám ngoài mặt
    facialExam: {
      faceShape: string; // Dạng mặt
      frontView: string; // Mặt thẳng
      sideView: string; // Mặt nghiêng
      smileArc: string; // Cung cười
      smileLine: string; // Đường cười
      midline: string; // Đường giữa
    };
    
    // Khám chức năng khác
    functionalExam: {
      openBite: boolean; // Cắn hở
      crossBite: boolean; // Cắn chéo
      tongueThrunt: boolean; // Đẩy lưỡi
    };
    
    // Hình ảnh
    images: string[]; // URLs của ảnh
    
    // Khám trong miệng
    intraoralExam: string;
  };
  
  // Chẩn đoán
  diagnosis: {
    // Phân tích phim
    filmAnalysis: {
      bone: string; // Xương
      sideView: string; // Mặt nghiêng
      apicalSclerosis: string; // Xơ cứng xương quanh chóp
    };
    
    // Phân tích mẫu hàm
    modelAnalysis: {
      overjet: string; // Cắn phủ
      overbite: string; // Cắn chỉa
      midline: string; // Đường giữa
      crossbite: string; // Cắn ngược
      openbite: string; // Cắn hở
      archForm: string; // Cung hàm
      molarRelation: string; // Tương quan
      r3Relation: string; // Tương quan R3
      r6Relation: string; // Tương quan R6
    };
  };
  
  // Nội dung và kế hoạch điều trị
  treatmentPlanContent: string;
  
  // Chi phí và thanh toán
  totalCost: number;
  paymentMethod: string;
  
  // Meta
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy: number;
  isDeleted: boolean;
}

export interface CreateOrthodonticTreatmentPlanRequest {
  patientId: number;
  dentistId: number;
  planTitle: string;
  templateName: string;
  consultationDate: string;
}


export interface UpdateOrthodonticTreatmentPlanRequest {
  planId: number;
  planTitle: string;
  templateName: string;
  treatmentHistory: string;
  reasonForVisit: string;
  examinationFindings: string;
  intraoralExam: string;
  xRayAnalysis: string;
  modelAnalysis: string;
  treatmentPlanContent: string;
  totalCost: number;
  paymentMethod: string;
}

export enum PaymentMethod {
  CASH = 'Tiền mặt',
  BANK_TRANSFER = 'Chuyển khoản',
  CREDIT_CARD = 'Thẻ tín dụng',
  INSTALLMENT = 'Trả góp'
}