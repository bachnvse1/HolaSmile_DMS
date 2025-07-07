import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, Printer, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useCreateOrthodonticTreatmentPlan } from '@/hooks/useOrthodonticTreatmentPlan';
import { formatCurrency, handleCurrencyInput } from '@/utils/currencyUtils';
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

export const OrthodonticTreatmentPlanDetailForm: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  const createMutation = useCreateOrthodonticTreatmentPlan();

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

  // Get basic data from sessionStorage
  const [basicData, setBasicData] = React.useState<BasicPlanData | null>(null);

  // Watch cost items to calculate total
  const costItems = form.watch('costItems');
  const otherCost = form.watch('otherCost');
  const totalCost = mapCostItemsToTotalCost(costItems, otherCost);

  useEffect(() => {
    const savedData = sessionStorage.getItem('basicPlanData');
    if (savedData) {
      setBasicData(JSON.parse(savedData));
    }
  }, []);

  React.useEffect(() => {
    console.log('Cost items:', costItems);
    console.log('Total cost:', totalCost);
  }, [costItems, totalCost]);

  // Handle currency input for cost fields
  const handleCostItemChange = (field: keyof DetailFormData['costItems'], value: string) => {
    handleCurrencyInput(value, (formattedValue) => {
      form.setValue(`costItems.${field}`, formattedValue, { shouldDirty: true });
    });
  };

  const onSave = async (data: DetailFormData) => {
    if (!basicData) return;

    try {

      // Map form data to API request
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
        totalCost: totalCost, // Use calculated total cost
        paymentMethod: `${data.paymentMethod}\n\nChi tiết chi phí: ${mapCostItemsToString(data.costItems, data.otherCost)}`,
        startToday: true,
      };

      // Debug logging
      console.log('Request data being sent:', requestData);
      console.log('PatientId from params:', patientId);
      console.log('PatientId in request:', requestData.patientId);

      await createMutation.mutateAsync(requestData);

      // Clear session storage
      sessionStorage.removeItem('basicPlanData');

      navigate(`/patients/${patientId}/orthodontic-treatment-plans`);
    } catch (error) {
      console.error('Error creating treatment plan:', error);

      // Log more detailed error info
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response?: { data?: unknown; status?: number; headers?: unknown } };
        console.error('API Error Response:', apiError.response?.data);
        console.error('API Error Status:', apiError.response?.status);
        console.error('API Error Headers:', apiError.response?.headers);
      }
    }
  };

  const onSaveAndPrint = async (data: DetailFormData) => {
    await onSave(data);
    window.print();
  };

  const handleGoBack = () => {
    navigate(`/patients/${patientId}/orthodontic-treatment-plans/create`);
  };

  if (!basicData) {
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
            <h1 className="text-2xl font-bold text-gray-900">Chi Tiết Kế Hoạch Điều Trị</h1>
            <p className="text-gray-600 mt-1">{basicData.planTitle}</p>
          </div>
        </div>
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
                <span className="font-medium">Họ và tên:</span> {basicData.patientInfo.fullname}
              </div>
              <div>
                <span className="font-medium">Năm sinh:</span> {basicData.patientInfo.dob}
              </div>
              <div>
                <span className="font-medium">Địa chỉ:</span>
              </div>
              <div>
                <span className="font-medium">Điện thoại:</span> {basicData.patientInfo.phone}
              </div>
              <div>
                <span className="font-medium">Ngày tư vấn:</span> {basicData.consultationDate}
              </div>
              <div>
                <span className="font-medium">Bác sĩ phụ trách:</span> {basicData.dentistName || 'BS. Chưa xác định'}
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
                      onCheckedChange={(checked) =>
                        form.setValue(fieldName as any, !!checked)
                      }
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
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mặt thẳng</label>
                  <Input
                    placeholder="Lệch trái/Lệch phải/Bình thường"
                    {...form.register('frontView')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mặt nghiêng</label>
                  <Input
                    placeholder="Lồi/Lõm/Bình thường"
                    {...form.register('sideView')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cung cười</label>
                  <Input
                    placeholder="Méo/Bình thường"
                    {...form.register('smileArc')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Đường cười</label>
                  <Input
                    {...form.register('smileLine')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Đường giữa</label>
                  <Input
                    placeholder="Lệch trái/Lệch phải/Bình thường"
                    {...form.register('midline')}
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
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cắn chéo</label>
                  <Input
                    {...form.register('crossBite')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Đẩy lưỡi</label>
                  <Input
                    placeholder="Có/Chưa phát hiện"
                    {...form.register('tongueThrunt')}
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
                  <Textarea rows={2} {...form.register('boneAnalysis')} />
                </div>
                <div>
                  <label className="text-sm font-medium">Mặt nghiêng</label>
                  <Input {...form.register('sideViewAnalysis')} />
                </div>
                <div>
                  <label className="text-sm font-medium">Xơ cứng xương quanh chóp</label>
                  <Input {...form.register('apicalSclerosis')} />
                </div>
              </div>
            </div>

            {/* Phân tích mẫu hàm */}
            <div>
              <h4 className="font-medium mb-3">Phân tích mẫu hàm</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cắn phủ</label>
                  <Input {...form.register('overjet')} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cắn chỉa</label>
                  <Input {...form.register('overbite')} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Đường giữa</label>
                  <Input
                    placeholder="Bên trái/Bên phải/Bình thường"
                    {...form.register('midlineAnalysis')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cắn ngược</label>
                  <Input
                    placeholder="1-15mm"
                    {...form.register('crossbite')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cắn hở</label>
                  <Input
                    placeholder="1-15mm"
                    {...form.register('openbite')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cung hàm</label>
                  <Input {...form.register('archForm')} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tương quan</label>
                  <Input
                    placeholder="Tương quan 1/Tương quan 2/Tương quan 3"
                    {...form.register('molarRelation')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tương quan R3</label>
                  <Input
                    placeholder="1-10mm"
                    {...form.register('r3Relation')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tương quan R6</label>
                  <Input
                    placeholder="1-10mm"
                    {...form.register('r6Relation')}
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
                      onChange={(e) => handleCostItemChange('khophang', e.target.value)}
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
                      onChange={(e) => handleCostItemChange('xquang', e.target.value)}
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
                      onChange={(e) => handleCostItemChange('minivis', e.target.value)}
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
                      onChange={(e) => handleCostItemChange('maccai', e.target.value)}
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
                      onChange={(e) => handleCostItemChange('chupcam', e.target.value)}
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
                      onChange={(e) => handleCostItemChange('nongham', e.target.value)}
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
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Chi phí khác (nếu có)</label>
                <div className="relative">
                  <Input
                    placeholder="0"
                    value={form.watch('otherCost')}
                    onChange={(e) => handleCurrencyInput(e.target.value, (v) => form.setValue('otherCost', v))}
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
              onChange={(e) => form.setValue('paymentMethod', e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 print:hidden">
          <Button type="button" variant="outline" onClick={handleGoBack}>
            <X className="h-4 w-4 mr-2" />
            Thoát
          </Button>
          <Button
            type="button"
            onClick={form.handleSubmit(onSave)}
            disabled={createMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {createMutation.isPending ? 'Đang lưu...' : 'Lưu'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={form.handleSubmit(onSaveAndPrint)}
            disabled={createMutation.isPending}
          >
            <Printer className="h-4 w-4 mr-2" />
            Lưu và In
          </Button>
        </div>
      </form>
    </div>
  );
};
