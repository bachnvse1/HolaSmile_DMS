import type { PrescriptionTemplate } from '@/types/prescriptionTemplate';

export const mockPrescriptionTemplates: PrescriptionTemplate[] = [
  {
    PreTemplateID: 1,
    PreTemplateName: "Điều trị viêm lợi cấp tính",
    PreTemplateContext: `1. Amoxicillin 500mg
   - Liều dùng: 1 viên x 3 lần/ngày
   - Thời gian: 7 ngày
   - Cách dùng: Uống sau ăn

2. Metronidazole 250mg
   - Liều dùng: 1 viên x 3 lần/ngày
   - Thời gian: 5 ngày
   - Cách dùng: Uống sau ăn

3. Ibuprofen 400mg
   - Liều dùng: 1 viên khi đau
   - Tối đa: 3 viên/ngày
   - Cách dùng: Uống sau ăn

Lưu ý: Tái khám sau 1 tuần`,
    CreatedAt: "2024-01-15T08:30:00Z",
    UpdatedAt: "2024-01-15T08:30:00Z",
    IsDeleted: false
  },
  {
    PreTemplateID: 2,
    PreTemplateName: "Sau nhổ răng khôn",
    PreTemplateContext: `1. Augmentin 625mg
   - Liều dùng: 1 viên x 2 lần/ngày
   - Thời gian: 5 ngày
   - Cách dùng: Uống sau ăn

2. Ketonal 50mg
   - Liều dùng: 1 viên x 2 lần/ngày
   - Thời gian: 3 ngày
   - Cách dùng: Uống sau ăn

3. Betadine 10% dung dịch súc miệng
   - Cách dùng: Pha loãng 1:1 với nước, súc miệng 2-3 lần/ngày

Hướng dẫn chăm sóc:
- Không nên súc miệng mạnh trong 24h đầu
- Ăn thức ăn mềm, tránh nóng
- Tái khám nếu có bất thường`,
    CreatedAt: "2024-01-20T10:15:00Z",
    UpdatedAt: "2024-02-01T14:20:00Z",
    IsDeleted: false
  },
  {
    PreTemplateID: 3,
    PreTemplateName: "Điều trị nhiệt miệng",
    PreTemplateContext: `1. Acyclovir 400mg
   - Liều dùng: 1 viên x 5 lần/ngày
   - Thời gian: 5 ngày
   - Cách dùng: Uống với nước

2. Kenalog in Orabase
   - Cách dùng: Thoa mỏng lên vết loét 3-4 lần/ngày
   - Thời gian: Cho đến khi khỏi

3. Vitamin B1, B6, B12
   - Liều dùng: 1 viên x 2 lần/ngày
   - Thời gian: 2 tuần
   - Cách dùng: Uống sau ăn

Lưu ý: Tránh thức ăn cay, nóng. Giữ vệ sinh răng miệng`,
    CreatedAt: "2024-02-05T09:45:00Z",
    UpdatedAt: "2024-02-05T09:45:00Z",
    IsDeleted: false
  },
  {
    PreTemplateID: 4,
    PreTemplateName: "Điều trị đau sau điều trị tủy",
    PreTemplateContext: `1. Paracetamol 500mg
   - Liều dùng: 1-2 viên khi đau
   - Tối đa: 8 viên/ngày
   - Cách dùng: Uống với nước

2. Ibuprofen 400mg
   - Liều dùng: 1 viên x 3 lần/ngày nếu đau nhiều
   - Thời gian: Tối đa 3 ngày
   - Cách dùng: Uống sau ăn

Hướng dẫn:
- Tránh nhai ở vùng răng đã điều trị
- Tái khám đúng lịch hẹn
- Liên hệ nếu đau quá nhiều`,
    CreatedAt: "2024-02-10T16:30:00Z",
    UpdatedAt: "2024-02-15T11:10:00Z",
    IsDeleted: false
  },
  {
    PreTemplateID: 5,
    PreTemplateName: "Phòng ngừa sau phẫu thuật",
    PreTemplateContext: `1. Amoxicillin/Clavulanate 625mg
   - Liều dùng: 1 viên x 2 lần/ngày
   - Thời gian: 7 ngày
   - Cách dùng: Uống sau ăn

2. Prednisolone 5mg
   - Ngày 1-2: 3 viên x 2 lần/ngày
   - Ngày 3-4: 2 viên x 2 lần/ngày
   - Ngày 5-6: 1 viên x 2 lần/ngày
   - Cách dùng: Uống sau ăn sáng

3. Dung dịch súc miệng Chlorhexidine 0.12%
   - Cách dùng: Súc miệng 30 giây x 2 lần/ngày

Chăm sóc sau phẫu thuật:
- Nghỉ ngơi đầy đủ
- Chườm lạnh 48h đầu
- Ăn thức ăn mềm, lạnh
- Tái khám sau 1 tuần`,
    CreatedAt: "2024-02-12T13:20:00Z",
    UpdatedAt: "2024-02-12T13:20:00Z",
    IsDeleted: false
  }
];

// Helper functions for mock API
export const getMockPrescriptionTemplates = (): PrescriptionTemplate[] => {
  return mockPrescriptionTemplates.filter(template => !template.IsDeleted);
};

export const getMockPrescriptionTemplateById = (id: number): PrescriptionTemplate | undefined => {
  return mockPrescriptionTemplates.find(template => 
    template.PreTemplateID === id && !template.IsDeleted
  );
};

export const searchMockPrescriptionTemplates = (query: string): PrescriptionTemplate[] => {
  if (!query) return getMockPrescriptionTemplates();
  
  return mockPrescriptionTemplates.filter(template => 
    !template.IsDeleted && 
    template.PreTemplateName.toLowerCase().includes(query.toLowerCase())
  );
};