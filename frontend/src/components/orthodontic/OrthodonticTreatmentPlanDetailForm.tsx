import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, Printer, X, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useCreateOrthodonticTreatmentPlan, useUpdateOrthodonticTreatmentPlan, useOrthodonticTreatmentPlan, useDeactivateOrthodonticTreatmentPlan } from '@/hooks/useOrthodonticTreatmentPlan';
import { usePatient } from '@/hooks/usePatient';
import { formatCurrency, handleCurrencyInput } from '@/utils/currencyUtils';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useUserInfo } from '@/hooks/useUserInfo';
import { TokenUtils } from '@/utils/tokenUtils';
import {
  mapMedicalHistoryToString,
  mapExaminationFindings,
  mapXRayAnalysis,
  mapModelAnalysis,
  mapCostItemsToString,
  mapCostItemsToTotalCost,
} from '@/utils/orthodonticMapping';
import type { BasicPlanData } from '@/utils/orthodonticMapping';


interface DetailFormData {
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

  // Nội dung và kế hoạch điều trị
  treatmentPlanContent: string;


  // Chi phí chi tiết
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

interface OrthodonticTreatmentPlanDetailFormProps {
  mode?: 'create' | 'edit' | 'view';
}

export const OrthodonticTreatmentPlanDetailForm: React.FC<OrthodonticTreatmentPlanDetailFormProps> = ({
  mode = 'create'
}) => {
  const { patientId: paramPatientId, planId } = useParams<{ patientId: string; planId: string }>();
  const navigate = useNavigate();

  const userInfo = useUserInfo();
  const isDentist = userInfo?.role === 'Dentist';

  // Add loading state for user info
  const [isUserInfoLoaded, setIsUserInfoLoaded] = React.useState(false);

  // Wait for user info to be loaded
  React.useEffect(() => {
    if (userInfo && (userInfo.role === 'Patient' || userInfo.role === 'Dentist' || userInfo.role === 'Administrator')) {
      setIsUserInfoLoaded(true);
    } else if (!userInfo) {
      // If no userInfo yet, check if we have a token and try to get role
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (token) {
        const role = TokenUtils.getRoleFromToken(token);
        if (role) {
          console.log('Found role from token:', role);
          // Set a small timeout to allow hook to load user info
          setTimeout(() => {
            if (!userInfo) {
              setIsUserInfoLoaded(true); // Force loaded if we have token but no user info
            }
          }, 300);
        }
      }
      setIsUserInfoLoaded(false);
    }
  }, [userInfo]);

  const createMutation = useCreateOrthodonticTreatmentPlan();
  const updateMutation = useUpdateOrthodonticTreatmentPlan();
  const deactivateMutation = useDeactivateOrthodonticTreatmentPlan();
  
  // Determine patientId based on user role
  let patientId: string | undefined = paramPatientId;
  if (userInfo?.role === 'Patient') {
    const roleTableId = userInfo.roleTableId ?? TokenUtils.getRoleTableIdFromToken(localStorage.getItem('token') || '');
    patientId = roleTableId === null ? undefined : roleTableId;
  }

  // For Patient role in view mode, ensure we have the correct patientId for API calls
  const apiPatientId = userInfo?.role === 'Patient' 
    ? (userInfo.roleTableId ?? TokenUtils.getRoleTableIdFromToken(localStorage.getItem('token') || '') ?? '0')
    : patientId ?? '0';

  // Debug logging
  React.useEffect(() => {
    if (userInfo) {
      console.log('Patient ID Debug:', {
        mode,
        userRole: userInfo.role,
        paramPatientId,
        patientId,
        apiPatientId,
        userRoleTableId: userInfo.roleTableId
      });
    }
  }, [mode, userInfo, paramPatientId, patientId, apiPatientId]);


  // Fetch existing plan data if editing or viewing
  const { data: treatmentPlan, isLoading: isPlanLoading, error: planError } = useOrthodonticTreatmentPlan(
    parseInt(planId || '0'),
    parseInt(apiPatientId || '0'),
    { enabled: (mode === 'edit' || mode === 'view') && !!planId }
  );

  // Get basic data from sessionStorage
  const [basicData, setBasicData] = React.useState<BasicPlanData | null>(null);

  // Get patient data from API
  const { data: patientData } = usePatient(parseInt(apiPatientId || '0'));

  // Helper functions để parse data từ strings
  const parseMedicalHistory = (treatmentHistory: string) => {
    const defaultHistory = {
      benhtim: false,
      tieuduong: false,
      thankinh: false,
      benhtruyen: false,
      caohuyetap: false,
      loangxuong: false,
      benhngan: false,
      chaymausau: false,
    };

    if (!treatmentHistory) return defaultHistory;

    const lowerText = treatmentHistory.toLowerCase();
    return {
      benhtim: lowerText.includes('bệnh tim') || lowerText.includes('tim'),
      tieuduong: lowerText.includes('tiểu đường') || lowerText.includes('đường huyết'),
      thankinh: lowerText.includes('thần kinh'),
      benhtruyen: lowerText.includes('truyền nhiễm') || lowerText.includes('lao') || lowerText.includes('hiv'),
      caohuyetap: lowerText.includes('cao huyết áp') || lowerText.includes('huyết áp'),
      loangxuong: lowerText.includes('loãng xương') || lowerText.includes('máu đông'),
      benhngan: lowerText.includes('bệnh gan') || lowerText.includes('thận'),
      chaymausau: lowerText.includes('chảy máu') || lowerText.includes('ngất xỉu'),
    };
  };

  const parseExaminationFindings = (examinationFindings: string) => {
    const extractValue = (text: string, patterns: string[]) => {
      for (const pattern of patterns) {
        const regex = new RegExp(`${pattern}[:\\s]*([^;\\n,]+)`, 'i');
        const match = text.match(regex);
        if (match && match[1].trim()) {
          return match[1].trim();
        }
      }
      return '';
    };

    return {
      faceShape: extractValue(examinationFindings, ['dạng mặt', 'dang mat']),
      frontView: extractValue(examinationFindings, ['mặt thẳng', 'mat thang']),
      sideView: extractValue(examinationFindings, ['mặt nghiêng', 'mat nghieng']),
      smileArc: extractValue(examinationFindings, ['cung cười', 'cung cuoi']),
      smileLine: extractValue(examinationFindings, ['đường cười', 'duong cuoi']),
      midline: extractValue(examinationFindings, ['đường giữa', 'duong giua']),
      openBite: extractValue(examinationFindings, ['cắn hở', 'can ho']),
      crossBite: extractValue(examinationFindings, ['cắn chéo', 'can cheo']),
      tongueThrunt: extractValue(examinationFindings, ['đẩy lưỡi', 'day luoi']),
    };
  };

  const parseXRayAnalysis = (xRayAnalysis: string) => {
    const extractValue = (text: string, pattern: string) => {
      const regex = new RegExp(`${pattern}[:\\s]*([^;\\n,]+)`, 'i');
      const match = text.match(regex);
      return match ? match[1].trim() : '';
    };

    return {
      boneAnalysis: extractValue(xRayAnalysis, 'xương'),
      sideViewAnalysis: extractValue(xRayAnalysis, 'mặt nghiêng'),
      apicalSclerosis: extractValue(xRayAnalysis, 'xơ cứng'),
    };
  };

  const parseModelAnalysis = (modelAnalysis: string) => {
    const extractValue = (text: string, pattern: string) => {
      const regex = new RegExp(`${pattern}[:\\s]*([^;\\n,]+)`, 'i');
      const match = text.match(regex);
      return match ? match[1].trim() : '';
    };

    return {
      overjet: extractValue(modelAnalysis, 'cắn phủ'),
      overbite: extractValue(modelAnalysis, 'cắn chỉa'),
      midlineAnalysis: extractValue(modelAnalysis, 'đường giữa'),
      crossbite: extractValue(modelAnalysis, 'cắn ngược'),
      openbite: extractValue(modelAnalysis, 'cắn hở'),
      archForm: extractValue(modelAnalysis, 'cung hàm'),
      molarRelation: extractValue(modelAnalysis, 'tương quan'),
      r3Relation: extractValue(modelAnalysis, 'tương quan r3'),
      r6Relation: extractValue(modelAnalysis, 'tương quan r6'),
    };
  };

  const parseCostItems = (paymentMethod: string) => {
    if (!paymentMethod) return {
      costItems: {
        khophang: '',
        xquang: '',
        minivis: '',
        maccai: '',
        chupcam: '',
        nongham: '',
      },
      otherCost: '',
      cleanPaymentMethod: paymentMethod,
    };

    // Extract cost details from payment method
    const costDetailsRegex = /chi tiết chi phí[:\s]*([^]+)/i;
    const match = paymentMethod.match(costDetailsRegex);

    if (match) {
      const costDetails = match[1];
      const extractCost = (text: string, pattern: string) => {
        const regex = new RegExp(`${pattern}[:\\s]*([0-9,\\.\\s]+)`, 'i');
        const costMatch = text.match(regex);
        return costMatch ? costMatch[1].trim() : '';
      };

      const costItems = {
        khophang: extractCost(costDetails, 'khớp hàng'),
        xquang: extractCost(costDetails, 'x-quang'),
        minivis: extractCost(costDetails, 'minivis'),
        maccai: extractCost(costDetails, 'mắc cài'),
        chupcam: extractCost(costDetails, 'chụp cằm'),
        nongham: extractCost(costDetails, 'nong hàm'),
      };

      const otherCost = extractCost(costDetails, 'khác');
      const cleanPaymentMethod = paymentMethod.replace(costDetailsRegex, '').trim();

      return { costItems, otherCost, cleanPaymentMethod };
    }

    return {
      costItems: {
        khophang: '',
        xquang: '',
        minivis: '',
        maccai: '',
        chupcam: '',
        nongham: '',
      },
      otherCost: '',
      cleanPaymentMethod: paymentMethod,
    };
  };

  const form = useForm<DetailFormData>({
    defaultValues: {
      medicalHistory: {
        benhtim: false,
        tieuduong: false,
        thankinh: false,
        benhtruyen: false,
        caohuyetap: false,
        loangxuong: false,
        benhngan: false,
        chaymausau: false,
      },
      reasonForVisit: '',
      faceShape: '',
      frontView: '',
      sideView: '',
      smileArc: '',
      smileLine: '',
      midline: '',
      openBite: '',
      crossBite: '',
      tongueThrunt: '',
      intraoralExam: '',
      boneAnalysis: '',
      sideViewAnalysis: '',
      apicalSclerosis: '',
      overjet: '',
      overbite: '',
      midlineAnalysis: '',
      crossbite: '',
      openbite: '',
      archForm: '',
      molarRelation: '',
      r3Relation: '',
      r6Relation: '',
      treatmentPlanContent: '',
      costItems: {
        khophang: '',
        xquang: '',
        minivis: '',
        maccai: '',
        chupcam: '',
        nongham: '',
      },
      otherCost: '',
      paymentMethod: `Thanh toán 1 lần: Giảm trực tiếp 1 triệu đồng\n\nTrả góp: Thanh toán lần đầu tối thiểu 5 - 10 triệu đồng. Còn lại 1 tháng tối thiểu 1-2 triệu đồng (không lãi suất)`,
    },
  });

  // Watch cost items to calculate total
  const costItems = form.watch('costItems');
  const otherCost = form.watch('otherCost');
  const totalCost = mapCostItemsToTotalCost(costItems, otherCost);

  useEffect(() => {
    const storageKey = mode === 'edit' ? 'editBasicPlanData' : (mode === 'view' ? 'viewBasicPlanData' : 'basicPlanData');
    const savedData = sessionStorage.getItem(storageKey);
    if (savedData) {
      setBasicData(JSON.parse(savedData));
    }
  }, [mode, setBasicData]);

  // Populate form với existing data khi edit hoặc view
  useEffect(() => {
    if ((mode === 'edit' || mode === 'view') && treatmentPlan) {
      try {
        // Parse existing data từ API response
        const plan = treatmentPlan as Record<string, unknown>;

        // Parse các trường complex từ string
        const medicalHistory = parseMedicalHistory((plan.treatmentHistory as string) || '');
        const examinationData = parseExaminationFindings((plan.examinationFindings as string) || '');
        const xrayData = parseXRayAnalysis((plan.xRayAnalysis as string) || '');
        const modelData = parseModelAnalysis((plan.modelAnalysis as string) || '');
        const costData = parseCostItems((plan.paymentMethod as string) || '');

        const formData = {
          medicalHistory,
          reasonForVisit: (plan.reasonForVisit as string) || '',
          ...examinationData,
          intraoralExam: (plan.intraoralExam as string) || '',
          ...xrayData,
          ...modelData,
          treatmentPlanContent: (plan.treatmentPlanContent as string) || '',
          costItems: costData.costItems,
          otherCost: costData.otherCost,
          paymentMethod: costData.cleanPaymentMethod,
        };

        form.reset(formData);
      } catch (error) {
        console.error('Error parsing treatment plan data:', error);
      }
    }
  }, [treatmentPlan, form, mode]);

  // Handle currency input for cost fields
  const handleCostItemChange = (field: keyof DetailFormData['costItems'], value: string) => {
    handleCurrencyInput(value, (formattedValue) => {
      form.setValue(`costItems.${field}`, formattedValue, { shouldDirty: true });
    });
  };

  const onSave = async (data: DetailFormData) => {
    if (!basicData) return;

    try {
      if (mode === 'edit') {
        // Update existing plan
        const requestData = {
          planId: parseInt(planId || '0'),
          patientId: basicData.patientId,
          planTitle: basicData.planTitle,
          templateName: basicData.templateName,
          treatmentHistory: mapMedicalHistoryToString(data.medicalHistory),
          reasonForVisit: data.reasonForVisit,
          examinationFindings: mapExaminationFindings(data),
          intraoralExam: data.intraoralExam,
          xRayAnalysis: mapXRayAnalysis(data),
          modelAnalysis: mapModelAnalysis(data),
          treatmentPlanContent: data.treatmentPlanContent,
          totalCost: totalCost,
          paymentMethod: `${data.paymentMethod}\n\nChi tiết chi phí: ${mapCostItemsToString(data.costItems, data.otherCost)}`,
          startToday: true,
          consultationDate: basicData.consultationDate,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 1,
          updatedBy: 1,
          isDeleted: false,
        };

        await updateMutation.mutateAsync(requestData);
      } else {
        // Create new plan
        const requestData = {
          patientId: basicData.patientId,
          dentistId: basicData.dentistId,
          planTitle: basicData.planTitle,
          templateName: basicData.templateName,
          treatmentHistory: mapMedicalHistoryToString(data.medicalHistory),
          reasonForVisit: data.reasonForVisit,
          examinationFindings: mapExaminationFindings(data),
          intraoralExam: data.intraoralExam,
          xRayAnalysis: mapXRayAnalysis(data),
          modelAnalysis: mapModelAnalysis(data),
          treatmentPlanContent: data.treatmentPlanContent,
          totalCost: totalCost,
          paymentMethod: `${data.paymentMethod}\n\nChi tiết chi phí: ${mapCostItemsToString(data.costItems, data.otherCost)}`,
          startToday: true,
        };

        await createMutation.mutateAsync(requestData);
      }

      // Clear session storage
      const storageKey = mode === 'edit' ? 'editBasicPlanData' : 'basicPlanData';
      sessionStorage.removeItem(storageKey);

      // Navigate based on user role with small delay to ensure state is updated
      setTimeout(() => {
        if (userInfo?.role === 'Patient') {
          navigate(`/patient/orthodontic-treatment-plans`);
        } else {
          navigate(`/patients/${patientId}/orthodontic-treatment-plans`);
        }
      }, 100);
    } catch (error) {
      console.error('Error saving treatment plan:', error);
    }
  };

  const onSaveAndPrint = async (data: DetailFormData) => {
    window.print();
    onSave(data);
  };

  const handleGoBack = () => {
    // Ensure user info is loaded before navigation
    if (!isUserInfoLoaded || !userInfo) {
      console.warn('User info not loaded yet, delaying navigation');
      
      // Fallback: try to get role from token directly
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const roleFromToken = token ? TokenUtils.getRoleFromToken(token) : null;
      
      // Add a small delay and retry
      setTimeout(() => {
        if (userInfo?.role === 'Patient' || roleFromToken === 'Patient') {
          navigate(`/patient/orthodontic-treatment-plans`);
        } else {
          navigate(`/patients/${patientId}/orthodontic-treatment-plans`);
        }
      }, 100);
      return;
    }

    if (mode === 'edit') {
      navigate(`/patients/${patientId}/orthodontic-treatment-plans/${planId}/edit`);
    } else if (userInfo.role === 'Patient') {
      // For Patient role, always go to patient-specific route
      navigate(`/patient/orthodontic-treatment-plans`);
    } else if (mode === 'view') {
      navigate(`/patients/${patientId}/orthodontic-treatment-plans`);
    } else {
      navigate(`/patients/${patientId}/orthodontic-treatment-plans/create`);
    }
  };

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deactivateMutation.mutateAsync(parseInt(planId || '0'));
      // Navigate based on user role with small delay
      setTimeout(() => {
        if (userInfo?.role === 'Patient') {
          navigate(`/patient/orthodontic-treatment-plans`);
        } else {
          navigate(`/patients/${patientId}/orthodontic-treatment-plans`);
        }
      }, 100);
    } catch (error) {
      console.error('Error deleting treatment plan:', error);
    } finally {
      setIsDeleting(false);
      setConfirmOpen(false);
    }
  };

  // Show loading screen until user info is loaded
  if (!isUserInfoLoaded) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Đang tải thông tin người dùng...</p>
            <p className="mt-1 text-xs text-gray-500">Mode: {mode}, Plan ID: {planId}</p>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'edit' && isPlanLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
            <p className="mt-1 text-xs text-gray-500">Plan ID: {planId}, Patient ID: {patientId}</p>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'edit' && planError) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-600">Lỗi tải dữ liệu: {planError.message}</p>
            <Button variant="outline" onClick={() => navigate(`/patients/${patientId}/orthodontic-treatment-plans`)} className="mt-2">
              Quay lại
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'view' && !treatmentPlan && !isPlanLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-600">Không tìm thấy kế hoạch điều trị</p>
            <Button variant="outline" onClick={() => navigate(`/patients/${patientId}/orthodontic-treatment-plans`)} className="mt-2">
              Quay lại
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!basicData && mode !== 'view') {
    return (
      <div className="container mx-auto p-6">
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleGoBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {mode === 'edit' ? 'Chỉnh Sửa Chi Tiết Kế Hoạch Điều Trị' :
                mode === 'view' ? 'Xem Chi Tiết Kế Hoạch Điều Trị' :
                  'Chi Tiết Kế Hoạch Điều Trị'}
            </h1>
            <p className="text-gray-600 mt-1">
              {mode === 'view' && treatmentPlan && (treatmentPlan as { planTitle?: string }).planTitle ||
                basicData?.planTitle ||
                'Kế hoạch điều trị'}
            </p>
          </div>
        </div>

        {mode === 'view' && isDentist && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/patients/${patientId}/orthodontic-treatment-plans/${planId}/edit`)}
              className="w-full sm:w-auto"
            >
              <Edit className="h-4 w-4 mr-2" />
              <span className="sm:hidden">Chỉnh sửa</span>
              <span className="hidden sm:inline">Chỉnh Sửa</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(true)}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? 'Đang xóa...' : 'Xóa'}
            </Button>
          </div>
        )}
      </div>

      <form className="space-y-6">
        {/* Thông tin khách hàng */}
        <Card>
          <CardHeader>
            <CardTitle>THÔNG TIN KHÁCH HÀNG</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Họ và tên:</span> {patientData?.fullname || basicData?.patientInfo?.fullname || 'Đang tải...'}
              </div>
              <div>
                <span className="font-medium">Năm sinh:</span> {patientData?.dob || basicData?.patientInfo?.dob || 'Chưa cập nhật'}
              </div>
              <div>
                <span className="font-medium">Địa chỉ:</span> {patientData?.address || 'Chưa cập nhật'}
              </div>
              <div>
                <span className="font-medium">Điện thoại:</span> {patientData?.phone || basicData?.patientInfo?.phone || 'Chưa cập nhật'}
              </div>
              {/* <div>
                <span className="font-medium">Ngày tư vấn:</span> {basicData?.consultationDate || 'Chưa xác định'}
              </div> */}
              <div>
                <span className="font-medium">Bác sĩ phụ trách:</span> {
                  mode === 'view' && treatmentPlan && (treatmentPlan as { dentistName?: string }).dentistName ||
                  basicData?.dentistName ||
                  'BS. Chưa xác định'
                }
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tiểu sử y khoa */}
        <Card>
          <CardHeader>
            <CardTitle>TIỂU SỬ Y KHOA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: 'benhtim', label: 'Bệnh tim' },
                { key: 'caohuyetap', label: 'Cao huyết áp' },
                { key: 'tieuduong', label: 'Tiểu đường' },
                { key: 'loangxuong', label: 'Loãng xương, máu đông, máu loãng' },
                { key: 'thankinh', label: 'Thần kinh' },
                { key: 'benhngan', label: 'Bệnh gan, thận bao tử' },
                { key: 'benhtruyen', label: 'Bệnh truyền nhiễm (lao, hbv, hiv...)' },
                { key: 'chaymausau', label: 'Chảy máu kéo dài, đã có lần ngất xỉu' },
              ].map(({ key, label }) => {
                const fieldName = `medicalHistory.${key}` as const;
                return (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={form.watch(fieldName as any)}
                      onCheckedChange={mode === 'view' ? undefined : (checked) =>
                        form.setValue(fieldName as any, !!checked)
                      }
                      className={mode === 'view' ? 'opacity-60 cursor-not-allowed' : ''}
                    />
                    <label htmlFor={key} className="text-sm">{label}</label>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Lý do đến khám */}
        <Card>
          <CardHeader>
            <CardTitle>LÝ DO ĐẾN KHÁM</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Chính nha hàm trên"
              rows={2}
              {...form.register('reasonForVisit')}
              readOnly={mode === 'view'}
            />
          </CardContent>
        </Card>

        {/* Khám */}
        <Card>
          <CardHeader>
            <CardTitle>KHÁM</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Khám ngoài mặt */}
            <div>
              <h4 className="font-medium mb-3">Khám ngoài mặt</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Dạng mặt</label>
                  <Input
                    placeholder="Lệch/Bình thường"
                    {...form.register('faceShape')}
                    readOnly={mode === 'view'}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mặt thẳng</label>
                  <Input
                    placeholder="Lệch trái/Lệch phải/Bình thường"
                    {...form.register('frontView')}
                    readOnly={mode === 'view'}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mặt nghiêng</label>
                  <Input
                    placeholder="Lồi/Lõm/Bình thường"
                    {...form.register('sideView')}
                    readOnly={mode === 'view'}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cung cười</label>
                  <Input
                    placeholder="Méo/Bình thường"
                    {...form.register('smileArc')}
                    readOnly={mode === 'view'}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Đường cười</label>
                  <Input
                    {...form.register('smileLine')}
                    readOnly={mode === 'view'}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Đường giữa</label>
                  <Input
                    placeholder="Lệch trái/Lệch phải/Bình thường"
                    {...form.register('midline')}
                    readOnly={mode === 'view'}
                  />
                </div>
              </div>
            </div>

            {/* Khám chức năng khác */}
            <div>
              <h4 className="font-medium mb-3">Khám chức năng khác</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cắn hở</label>
                  <Input
                    {...form.register('openBite')}
                    readOnly={mode === 'view'}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cắn chéo</label>
                  <Input
                    {...form.register('crossBite')}
                    readOnly={mode === 'view'}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Đẩy lưỡi</label>
                  <Input
                    placeholder="Có/Chưa phát hiện"
                    {...form.register('tongueThrunt')}
                    readOnly={mode === 'view'}
                  />
                </div>
              </div>
            </div>

            {/* Hình ảnh */}
            {/* <div>
              <h4 className="font-medium mb-3">Hình ảnh</h4>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <p className="text-gray-500">Chọn tệp hình ảnh</p>
                  <p className="text-sm text-gray-400 mt-1">Hỗ trợ nhiều file ảnh</p>
                </label>
              </div>
            </div> */}

            {/* Khám trong miệng */}
            <div>
              <h4 className="font-medium mb-3">Khám trong miệng</h4>
              <Textarea
                rows={4}
                {...form.register('intraoralExam')}
                readOnly={mode === 'view'}
              />
            </div>
          </CardContent>
        </Card>

        {/* Chẩn đoán */}
        <Card>
          <CardHeader>
            <CardTitle>CHẨN ĐOÁN</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Phân tích phim */}
            <div>
              <h4 className="font-medium mb-3">Phân tích phim</h4>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Xương</label>
                  <Textarea
                    rows={2}
                    {...form.register('boneAnalysis')}
                    readOnly={mode === 'view'}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Mặt nghiêng</label>
                  <Input
                    {...form.register('sideViewAnalysis')}
                    readOnly={mode === 'view'}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Xơ cứng xương quanh chóp</label>
                  <Input
                    {...form.register('apicalSclerosis')}
                    readOnly={mode === 'view'}
                  />
                </div>
              </div>
            </div>

            {/* Phân tích mẫu hàm */}
            <div>
              <h4 className="font-medium mb-3">Phân tích mẫu hàm</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cắn phủ</label>
                  <Input {...form.register('overjet')} readOnly={mode === 'view'} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cắn chỉa</label>
                  <Input {...form.register('overbite')} readOnly={mode === 'view'} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Đường giữa</label>
                  <Input
                    placeholder="Bên trái/Bên phải/Bình thường"
                    {...form.register('midlineAnalysis')}
                    readOnly={mode === 'view'}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cắn ngược</label>
                  <Input
                    placeholder="1-15mm"
                    {...form.register('crossbite')}
                    readOnly={mode === 'view'}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cắn hở</label>
                  <Input
                    placeholder="1-15mm"
                    {...form.register('openbite')}
                    readOnly={mode === 'view'}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cung hàm</label>
                  <Input {...form.register('archForm')} readOnly={mode === 'view'} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tương quan</label>
                  <Input
                    placeholder="Tương quan 1/Tương quan 2/Tương quan 3"
                    {...form.register('molarRelation')}
                    readOnly={mode === 'view'}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tương quan R3</label>
                  <Input
                    placeholder="1-10mm"
                    {...form.register('r3Relation')}
                    readOnly={mode === 'view'}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tương quan R6</label>
                  <Input
                    placeholder="1-10mm"
                    {...form.register('r6Relation')}
                    readOnly={mode === 'view'}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nội dung và kế hoạch điều trị */}
        <Card>
          <CardHeader>
            <CardTitle>NỘI DUNG VÀ KẾ HOẠCH ĐIỀU TRỊ</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={8}
              {...form.register('treatmentPlanContent')}
              readOnly={mode === 'view'}
            />
          </CardContent>
        </Card>

        {/* Chi phí */}
        <Card>
          <CardHeader>
            <CardTitle>CHI PHÍ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Khớp hàng</label>
                  <div className="relative">
                    <Input
                      placeholder="0"
                      value={form.watch('costItems.khophang')}
                      onChange={mode === 'view' ? undefined : (e) => handleCostItemChange('khophang', e.target.value)}
                      readOnly={mode === 'view'}
                      className={mode === 'view' ? 'bg-gray-50' : ''}
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₫</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">X-Quang</label>
                  <div className="relative">
                    <Input
                      placeholder="0"
                      value={form.watch('costItems.xquang')}
                      onChange={mode === 'view' ? undefined : (e) => handleCostItemChange('xquang', e.target.value)}
                      readOnly={mode === 'view'}
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₫</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Minivis</label>
                  <div className="relative">
                    <Input
                      placeholder="0"
                      value={form.watch('costItems.minivis')}
                      onChange={mode === 'view' ? undefined : (e) => handleCostItemChange('minivis', e.target.value)}
                      readOnly={mode === 'view'}
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₫</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mắc cài kim loại</label>
                  <div className="relative">
                    <Input
                      placeholder="0"
                      value={form.watch('costItems.maccai')}
                      onChange={mode === 'view' ? undefined : (e) => handleCostItemChange('maccai', e.target.value)}
                      readOnly={mode === 'view'}
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₫</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Chụp cằm</label>
                  <div className="relative">
                    <Input
                      placeholder="0"
                      value={form.watch('costItems.chupcam')}
                      onChange={mode === 'view' ? undefined : (e) => handleCostItemChange('chupcam', e.target.value)}
                      readOnly={mode === 'view'}
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₫</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nong hàm</label>
                  <div className="relative">
                    <Input
                      placeholder="0"
                      value={form.watch('costItems.nongham')}
                      onChange={mode === 'view' ? undefined : (e) => handleCostItemChange('nongham', e.target.value)}
                      readOnly={mode === 'view'}
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₫</span>
                  </div>
                </div>
              </div>

              {/* Real-time total display */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-800">Tổng chi phí:</span>
                  <span className="text-lg font-bold text-blue-900">{formatCurrency(totalCost)} ₫</span>
                </div>
              </div>                <div className="space-y-2">
                <label className="text-sm font-medium">Chi phí khác (nếu có)</label>
                <div className="relative">
                  <Input
                    placeholder="0"
                    value={form.watch('otherCost')}
                    onChange={mode === 'view' ? undefined : (e) => handleCurrencyInput(e.target.value, (v) => form.setValue('otherCost', v))}
                    readOnly={mode === 'view'}
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₫</span>
                </div>
                <p className="text-xs text-gray-500">Nhập thêm chi phí khác không có trong danh sách trên</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hình thức thanh toán */}
        <Card>
          <CardHeader>
            <CardTitle>HÌNH THỨC THANH TOÁN</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={6}
              value={form.watch('paymentMethod')}
              onChange={mode === 'view' ? undefined : (e) => form.setValue('paymentMethod', e.target.value)}
              readOnly={mode === 'view'}
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {mode !== 'view' && (
          <div className="flex justify-end gap-3 print:hidden">
            <Button type="button" variant="outline" onClick={handleGoBack}>
              <X className="h-4 w-4 mr-2" />
              Thoát
            </Button>
            <Button
              type="button"
              onClick={form.handleSubmit(onSave)}
              disabled={mode === 'edit' ? updateMutation.isPending : createMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {mode === 'edit'
                ? (updateMutation.isPending ? 'Đang cập nhật...' : 'Cập Nhật')
                : (createMutation.isPending ? 'Đang lưu...' : 'Lưu')
              }
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={form.handleSubmit(onSaveAndPrint)}
              disabled={mode === 'edit' ? updateMutation.isPending : createMutation.isPending}
            >
              <Printer className="h-4 w-4 mr-2" />
              {mode === 'edit' ? 'Cập Nhật và In' : 'Lưu và In'}
            </Button>
          </div>
        )}

        {/* View Mode Buttons */}
        {mode === 'view' && (
          <div className="flex justify-end gap-3 print:hidden">
            <Button type="button" variant="outline" onClick={handleGoBack}>
              <X className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4 mr-2" />
              In
            </Button>

          </div>
        )}
      </form>

      {/* Confirm Deletion Modal */}
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Xác nhận xóa kế hoạch điều trị"
        message="Bạn có chắc chắn muốn xóa kế hoạch điều trị này? Hành động này không thể hoàn tác."
        confirmText="Xóa kế hoạch"
        confirmVariant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
};
