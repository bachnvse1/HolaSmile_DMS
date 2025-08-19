export interface DetailFormData {
  // Tiểu sử y khoa
  medicalHistory: {
    benhtim: boolean;
    tieuduong: boolean;
    thankinh: boolean;
    benhtruyen: boolean;
    caohuyetap: boolean;
    loangxuong: boolean;
    benhngan: boolean;
    chaymausau: boolean;
  };
  
  // Lý do đến khám
  reasonForVisit: string;
  
  // Khám ngoài mặt
  faceShape: string;
  frontView: string;
  sideView: string;
  smileArc: string;
  smileLine: string;
  midline: string;
  
  // Khám chức năng
  openBite: string;
  crossBite: string;
  tongueThrunt: string;
  
  // Khám trong miệng
  intraoralExam: string;
  
  // Phân tích phim
  boneAnalysis: string;
  sideViewAnalysis: string;
  apicalSclerosis: string;
  
  // Phân tích mẫu hàm
  overjet: string;
  overbite: string;
  midlineAnalysis: string;
  crossbite: string;
  openbite: string;
  archForm: string;
  molarRelation: string;
  r3Relation: string;
  r6Relation: string;
  treatmentPlanContent: string;
  costItems: {
    khophang: string;
    xquang: string;
    minivis: string;
    maccai: string;
    chupcam: string;
    nongham: string;
  };
  otherCost: string;
  paymentMethod: string;
}

export interface BasicPlanData {
  patientId: number;
  dentistId: number;
  planTitle: string;
  templateName: string;
  consultationDate: string;
  dentistName?: string;
  patientInfo: {
    fullname: string;
    dob: string;
    phone: string;
    email: string;
  };
}

export const mapMedicalHistoryToString = (medicalHistory: DetailFormData['medicalHistory']): string => {
  const conditions = [];
  
  if (medicalHistory.benhtim) conditions.push('Bệnh tim');
  if (medicalHistory.tieuduong) conditions.push('Tiểu đường');
  if (medicalHistory.thankinh) conditions.push('Thần kinh');
  if (medicalHistory.benhtruyen) conditions.push('Bệnh truyền nhiễm (lao, hbv, hiv...)');
  if (medicalHistory.caohuyetap) conditions.push('Cao huyết áp');
  if (medicalHistory.loangxuong) conditions.push('Loãng xương, máu đông, máu loãng');
  if (medicalHistory.benhngan) conditions.push('Bệnh gan, thận bao tử');
  if (medicalHistory.chaymausau) conditions.push('Chảy máu kéo dài, đã có lần ngất xỉu');
  
  return conditions.length > 0 ? conditions.join('; ') : 'Không có tiền sử bệnh đặc biệt';
};

export const mapExaminationFindings = (data: DetailFormData): string => {
  const findings = [];
  
  // Khám ngoài mặt
  if (data.faceShape) findings.push(`Dạng mặt: ${data.faceShape}`);
  if (data.frontView) findings.push(`Mặt thẳng: ${data.frontView}`);
  if (data.sideView) findings.push(`Mặt nghiêng: ${data.sideView}`);
  if (data.smileArc) findings.push(`Cung cười: ${data.smileArc}`);
  if (data.smileLine) findings.push(`Đường cười: ${data.smileLine}`);
  if (data.midline) findings.push(`Đường giữa: ${data.midline}`);
  
  // Khám chức năng khác
  if (data.openBite) findings.push(`Cắn hở: ${data.openBite}`);
  if (data.crossBite) findings.push(`Cắn chéo: ${data.crossBite}`);
  if (data.tongueThrunt) findings.push(`Đẩy lưỡi: ${data.tongueThrunt}`);
  
  return findings.join('; ');
};

export const mapXRayAnalysis = (data: DetailFormData): string => {
  const analysis = [];
  
  if (data.boneAnalysis) analysis.push(`Xương: ${data.boneAnalysis}`);
  if (data.sideViewAnalysis) analysis.push(`Mặt nghiêng: ${data.sideViewAnalysis}`);
  if (data.apicalSclerosis) analysis.push(`Xơ cứng xương quanh chóp: ${data.apicalSclerosis}`);
  
  return analysis.join('; ');
};

export const mapModelAnalysis = (data: DetailFormData): string => {
  const analysis = [];
  
  if (data.overjet) analysis.push(`Cắn phủ: ${data.overjet}`);
  if (data.overbite) analysis.push(`Cắn chỉa: ${data.overbite}`);
  if (data.midlineAnalysis) analysis.push(`Đường giữa: ${data.midlineAnalysis}`);
  if (data.crossbite) analysis.push(`Cắn ngược: ${data.crossbite}`);
  if (data.openbite) analysis.push(`Cắn hở: ${data.openbite}`);
  if (data.archForm) analysis.push(`Cung hàm: ${data.archForm}`);
  if (data.molarRelation) analysis.push(`Tương quan: ${data.molarRelation}`);
  if (data.r3Relation) analysis.push(`Tương quan R3: ${data.r3Relation}`);
  if (data.r6Relation) analysis.push(`Tương quan R6: ${data.r6Relation}`);
  
  return analysis.join('; ');
};

export const mapCostItemsToTotalCost = (costItems: DetailFormData['costItems'], additionalCost: string): number => {
  const costs = [];
  
  if (costItems.khophang) costs.push(parseCurrencyValue(costItems.khophang));
  if (costItems.xquang) costs.push(parseCurrencyValue(costItems.xquang));
  if (costItems.minivis) costs.push(parseCurrencyValue(costItems.minivis));
  if (costItems.maccai) costs.push(parseCurrencyValue(costItems.maccai));
  if (costItems.chupcam) costs.push(parseCurrencyValue(costItems.chupcam));
  if (costItems.nongham) costs.push(parseCurrencyValue(costItems.nongham));
  
  const totalFromItems = costs.reduce((sum, cost) => sum + cost, 0);
  const additionalCostValue = parseCurrencyValue(additionalCost);
  
  return totalFromItems + additionalCostValue;
};

const parseCurrencyValue = (value: string): number => {
  if (!value) return 0;
  const cleaned = value.replace(/[^\d]/g, '');
  return cleaned ? parseInt(cleaned) : 0;
};

export const mapCostItemsToString = (costItems: DetailFormData['costItems'], additionalCost: string): string => {
  const items = [];
  
  if (costItems.khophang) items.push(`Khớp hàng: ${costItems.khophang}`);
  if (costItems.xquang) items.push(`X-Quang: ${costItems.xquang}`);
  if (costItems.minivis) items.push(`Minivis: ${costItems.minivis}`);
  if (costItems.maccai) items.push(`Mắc cài kim loại: ${costItems.maccai}`);
  if (costItems.chupcam) items.push(`Chụp cằm: ${costItems.chupcam}`);
  if (costItems.nongham) items.push(`Nong hàm: ${costItems.nongham}`);
  if (additionalCost) items.push(`Chi phí khác: ${additionalCost}`);
  
  return items.join('; ');
};