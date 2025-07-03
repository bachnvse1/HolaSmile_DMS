import type { OrthodonticTreatmentPlan } from '@/types/orthodonticTreatmentPlan';
import { PaymentMethod } from '@/types/orthodonticTreatmentPlan';

export const mockOrthodonticTreatmentPlans: OrthodonticTreatmentPlan[] = [
  {
    planId: 1,
    patientId: 26,
    dentistId: 1,
    planTitle: "Kế Hoạch Niềng Răng Cơ Bản",
    templateName: "Chỉnh Nha Cơ Bản",
    treatmentHistory: "Bệnh nhân có tiền sử chấn thương răng cửa khi còn nhỏ, gây ra tình trạng răng mọc lệch. Không có tiền sử bệnh lý nha chu nghiêm trọng. Đã từng điều trị tủy răng số 21.",
    reasonForVisit: "Bệnh nhân đến khám vì muốn chỉnh răng để có nụ cười đẹp hơn. Cảm thấy tự ti vì răng cửa bị lệch và có khoảng trống giữa các răng cửa.",
    examinationFindings: "Quan sát lâm sàng: Răng cửa trên bị lệch về phía phải khoảng 3mm. Có khoảng trống 2mm giữa răng 11 và 21. Cung răng hình chữ V, hẹp. Cắn chìa ra phía trước 4mm.",
    intraoralExam: "Vệ sinh răng miệng tương đối tốt. Nướu hồng, không có dấu hiệu viêm nướu. Răng số 21 đã được điều trị tủy, còn lại các răng khỏe mạnh. Không có sâu răng mới.",
    xRayAnalysis: "Phim X-quang panoramic cho thấy: Chân răng phát triển bình thường. Không có răng khôn mọc lệch. Xương hàm phát triển đầy đủ. Tỷ lệ vương miện/chân răng bình thường.",
    modelAnalysis: "Mô hình thạch cao cho thấy: Cung răng trên hẹp 4mm so với bình thường. Độ chênh lệch cung răng trên/dưới: 3mm. Cần mở rộng cung răng và di chuyển răng cửa về vị trí chuẩn.",
    treatmentPlanContent: "Giai đoạn 1 (6 tháng đầu): Đặt mắc cài kim loại truyền thống, sử dụng dây cung nhỏ để căn chỉnh ban đầu.\n\nGiai đoạn 2 (12 tháng tiếp theo): Tăng dần kích thước dây cung, sử dụng lò xo để mở rộng cung răng và đóng khoảng trống.\n\nGiai đoạn 3 (6 tháng cuối): Hoàn thiện vị trí răng, sử dụng elastic để điều chỉnh cắn khớp.\n\nSau điều trị: Đeo hàm duy trì ít nhất 2 năm.",
    totalCost: 35000000,
    paymentMethod: PaymentMethod.INSTALLMENT,
    createdAt: "2024-01-15T09:30:00Z",
    updatedAt: "2024-01-15T09:30:00Z",
    createdBy: 1,
    updatedBy: 1,
    isDeleted: false,
    patient: {
      fullname: "Nguyễn Hoài Na",
      phone: "0941120025",
      email: "hoaina@email.com"
    },
    dentist: {
      fullname: "BS. Trần Văn Minh"
    }
  },
  {
    planId: 2,
    patientId: 26,
    dentistId: 1,
    planTitle: "Điều Trị Niềng Răng Trong Suốt",
    templateName: "Niềng Răng Trong Suốt",
    treatmentHistory: "Bệnh nhân 28 tuổi, đã kết hôn. Làm việc trong môi trường văn phòng, cần hình ảnh chuyên nghiệp. Từng có ý định niềng răng từ lâu nhưng không muốn ảnh hưởng đến công việc.",
    reasonForVisit: "Muốn chỉnh răng nhưng không muốn sử dụng mắc cài kim loại vì lý do thẩm mỹ và công việc. Mong muốn có giải pháp kín đáo và hiệu quả.",
    examinationFindings: "Răng chen chúc nhẹ ở hàm dưới. Răng nanh trên nhô ra khỏi cung răng. Tình trạng không quá phức tạp, phù hợp với niềng răng trong suốt.",
    intraoralExam: "Vệ sinh răng miệng tốt. Không có sâu răng. Nướu khỏe mạnh. Tất cả các răng đều còn nguyên vẹn, không có răng bị mất hoặc răng giả.",
    xRayAnalysis: "Cấu trúc xương bình thường. Không có bất thường về chân răng. Răng khôn đã mọc đầy đủ và không gây ảnh hưởng đến kế hoạch điều trị.",
    modelAnalysis: "Độ chen chúc: 3mm ở hàm dưới. Cần tạo khoảng trống bằng cách mở rộng cung răng nhẹ. Dự kiến cần 25-30 bộ khay trong suốt.",
    treatmentPlanContent: "Sử dụng hệ thống niềng răng trong suốt (Clear Aligners):\n\n- Tổng cộng 28 bộ khay\n- Thay khay mỗi 2 tuần\n- Đeo 22 giờ/ngày\n- Tái khám mỗi 6-8 tuần\n- Thời gian điều trị: 14-16 tháng\n- Có thể tháo ra khi ăn uống và vệ sinh\n\nGắn attachment (nút nhựa) tại một số răng để tăng hiệu quả di chuyển.",
    totalCost: 85000000,
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    createdAt: "2024-02-20T14:15:00Z",
    updatedAt: "2024-02-20T14:15:00Z",
    createdBy: 1,
    updatedBy: 1,
    isDeleted: false,
    patient: {
      fullname: "Nguyễn Hoài Na",
      phone: "0941120025",
      email: "hoaina@email.com"
    },
    dentist: {
      fullname: "BS. Trần Văn Minh"
    }
  },
  {
    planId: 3,
    patientId: 26,
    dentistId: 1,
    planTitle: "Chỉnh Hình Răng Phức Tạp",
    templateName: "Chỉnh Nha Phức Tạp",
    treatmentHistory: "Bệnh nhân có tình trạng cắn ngược, cắn sâu. Đã được tư vấn phẫu thuật hàm mặt nhưng mong muốn thử điều trị chỉnh nha trước. Có tiền sử viêm nướu nhẹ đã được điều trị.",
    reasonForVisit: "Khó khăn trong việc nhai và phát âm. Cảm thấy không tự tin với hình dáng khuôn mặt. Muốn cải thiện chức năng ăn nhai và thẩm mỹ.",
    examinationFindings: "Cắn ngược trước với 3 răng cửa. Cắn sâu 70%. Đường giữa lệch 3mm. Hàm dưới lùi so với hàm trên. Khớp cắn không ổn định.",
    intraoralExam: "Có dấu hiệu mài mòn răng do cắn sai. Nướu ở một số vùng có viêm nhẹ do vệ sinh khó khăn. Cần điều trị nướu trước khi niềng răng.",
    xRayAnalysis: "Phim đầu nghiêng cho thấy: Hàm dưới lùi 6mm. Góc mặt phẳng mandibular tăng. Cần kết hợp điều trị chỉnh hình với có thể cần can thiệp phẫu thuật nhỏ.",
    modelAnalysis: "Thiếu hụt khoảng trống 8mm ở hàm trên, 5mm ở hàm dưới. Cần nhổ răng hàm nhỏ để tạo khoảng trống. Mô phỏng cho thấy có thể cải thiện 80% tình trạng.",
    treatmentPlanContent: "Kế hoạch điều trị phức tạp gồm 3 giai đoạn:\n\nGiai đoạn chuẩn bị (2 tháng):\n- Điều trị nướu\n- Nhổ 4 răng hàm nhỏ\n- Đặt implant anchor nếu cần\n\nGiai đoạn chính (24-30 tháng):\n- Đặt mắc cài ceramic\n- Sử dụng lực nhẹ để di chuyển răng\n- Điều chỉnh khớp cắn từng bước\n- Có thể cần phẫu thuật chỉnh hình nhỏ\n\nGiai đoạn hoàn thiện (6 tháng):\n- Tinh chỉnh vị trí răng\n- Ổn định khớp cắn\n- Đào tạo chức năng nhai mới",
    totalCost: 120000000,
    paymentMethod: PaymentMethod.INSTALLMENT,
    createdAt: "2024-03-10T10:20:00Z",
    updatedAt: "2024-03-10T10:20:00Z",
    createdBy: 1,
    updatedBy: 1,
    isDeleted: false,
    patient: {
      fullname: "Nguyễn Hoài Na",
      phone: "0941120025",
      email: "hoaina@email.com"
    },
    dentist: {
      fullname: "BS. Trần Văn Minh"
    }
  }
];

// Mock function để lấy kế hoạch điều trị theo patient ID
export const getMockTreatmentPlansByPatientId = (patientId: number): OrthodonticTreatmentPlan[] => {
  return mockOrthodonticTreatmentPlans.filter(plan => plan.patientId === patientId);
};

// Mock function để lấy một kế hoạch điều trị theo plan ID
export const getMockTreatmentPlanById = (planId: number): OrthodonticTreatmentPlan | undefined => {
  return mockOrthodonticTreatmentPlans.find(plan => plan.planId === planId);
};