import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, FileText, DollarSign, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  useCreateOrthodonticTreatmentPlan, 
  useUpdateOrthodonticTreatmentPlan,
  useOrthodonticTreatmentPlan 
} from '@/hooks/useMockOrthodonticTreatmentPlan';
import { PaymentMethod } from '@/types/orthodonticTreatmentPlan';

const treatmentPlanSchema = z.object({
  planTitle: z.string().min(1, 'Tên kế hoạch là bắt buộc'),
  templateName: z.string().min(1, 'Template là bắt buộc'),
  treatmentHistory: z.string().min(1, 'Tiểu sử bệnh là bắt buộc'),
  reasonForVisit: z.string().min(1, 'Lý do đến khám là bắt buộc'),
  examinationFindings: z.string().min(1, 'Kết quả khám lâm sàng là bắt buộc'),
  intraoralExam: z.string().min(1, 'Khám trong miệng là bắt buộc'),
  xRayAnalysis: z.string().min(1, 'Phân tích X-quang là bắt buộc'),
  modelAnalysis: z.string().min(1, 'Phân tích mẫu hàm là bắt buộc'),
  treatmentPlanContent: z.string().min(1, 'Nội dung kế hoạch điều trị là bắt buộc'),
  totalCost: z.coerce.number().min(0, 'Chi phí phải lớn hơn 0'),
  paymentMethod: z.enum([
    PaymentMethod.CASH,
    PaymentMethod.BANK_TRANSFER,
    PaymentMethod.CREDIT_CARD,
    PaymentMethod.INSTALLMENT
  ] as const),
});

type TreatmentPlanFormData = z.infer<typeof treatmentPlanSchema>;

interface OrthodonticTreatmentPlanFormProps {
  mode: 'create' | 'edit';
}

export const OrthodonticTreatmentPlanForm: React.FC<OrthodonticTreatmentPlanFormProps> = ({ mode }) => {
  const { patientId, planId } = useParams<{ patientId: string; planId?: string }>();
  const navigate = useNavigate();

  const createMutation = useCreateOrthodonticTreatmentPlan();
  const updateMutation = useUpdateOrthodonticTreatmentPlan();
  
  // Get existing plan data for edit mode
  const { data: existingPlan } = useOrthodonticTreatmentPlan(
    mode === 'edit' && planId ? parseInt(planId) : 0
  );

  const form = useForm<TreatmentPlanFormData>({
    resolver: zodResolver(treatmentPlanSchema),
    defaultValues: {
      planTitle: '',
      templateName: '',
      treatmentHistory: '',
      reasonForVisit: '',
      examinationFindings: '',
      intraoralExam: '',
      xRayAnalysis: '',
      modelAnalysis: '',
      treatmentPlanContent: '',
      totalCost: 0,
      paymentMethod: PaymentMethod.CASH,
    },
  });

  // Populate form with existing data in edit mode
  useEffect(() => {
    if (mode === 'edit' && existingPlan) {
      form.reset({
        planTitle: existingPlan.planTitle,
        templateName: existingPlan.templateName,
        treatmentHistory: existingPlan.treatmentHistory,
        reasonForVisit: existingPlan.reasonForVisit,
        examinationFindings: existingPlan.examinationFindings,
        intraoralExam: existingPlan.intraoralExam,
        xRayAnalysis: existingPlan.xRayAnalysis,
        modelAnalysis: existingPlan.modelAnalysis,
        treatmentPlanContent: existingPlan.treatmentPlanContent,
        totalCost: existingPlan.totalCost,
        paymentMethod: existingPlan.paymentMethod as PaymentMethod,
      });
    }
  }, [existingPlan, form, mode]);

  const onSubmit = async (data: TreatmentPlanFormData) => {
    try {
      if (mode === 'create') {
        await createMutation.mutateAsync({
          ...data,
          patientId: parseInt(patientId || '0'),
          dentistId: 1, // TODO: Get from auth context
        });
      } else if (mode === 'edit' && planId) {
        await updateMutation.mutateAsync({
          ...data,
          planId: parseInt(planId),
          patientId: parseInt(patientId || '0'),
          dentistId: 1, // TODO: Get from auth context
        });
      }
      
      navigate(`/patients/${patientId}/orthodontic-treatment-plans`);
    } catch (error) {
      console.error('Error saving treatment plan:', error);
    }
  };

  const handleGoBack = () => {
    navigate(`/patients/${patientId}/orthodontic-treatment-plans`);
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleGoBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {mode === 'create' ? 'Tạo Kế Hoạch Điều Trị' : 'Chỉnh Sửa Kế Hoạch Điều Trị'}
            </h1>
            <p className="text-gray-600 mt-1">
              {mode === 'create' 
                ? 'Tạo kế hoạch điều trị nha khoa chỉnh hình mới' 
                : 'Cập nhật thông tin kế hoạch điều trị'
              }
            </p>
          </div>
        </div>
        <Button 
          type="submit" 
          form="treatment-plan-form"
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {isLoading ? 'Đang lưu...' : (mode === 'create' ? 'Tạo Kế Hoạch' : 'Cập Nhật')}
        </Button>
      </div>

      <form id="treatment-plan-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Thông Tin Cơ Bản
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tên Kế Hoạch Điều Trị *</label>
                <Input 
                  placeholder="Nhập tên kế hoạch điều trị" 
                  {...form.register('planTitle')}
                />
                {form.formState.errors.planTitle && (
                  <p className="text-sm text-red-600">{form.formState.errors.planTitle.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Template *</label>
                <Select onValueChange={(value) => form.setValue('templateName', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn mẫu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Chỉnh Nha Cơ Bản">Chỉnh Nha Cơ Bản</SelectItem>
                    <SelectItem value="Chỉnh Nha Phức Tạp">Chỉnh Nha Phức Tạp</SelectItem>
                    <SelectItem value="Niềng Răng Mắc Cài">Niềng Răng Mắc Cài</SelectItem>
                    <SelectItem value="Niềng Răng Trong Suốt">Niềng Răng Trong Suốt</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.templateName && (
                  <p className="text-sm text-red-600">{form.formState.errors.templateName.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patient History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Tiểu Sử Bệnh Nhân
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tiểu Sử Bệnh *</label>
              <Textarea 
                placeholder="Mô tả tiểu sử bệnh của bệnh nhân..."
                rows={4}
                {...form.register('treatmentHistory')}
              />
              {form.formState.errors.treatmentHistory && (
                <p className="text-sm text-red-600">{form.formState.errors.treatmentHistory.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Lý Do Đến Khám *</label>
              <Textarea 
                placeholder="Mô tả lý do bệnh nhân đến khám..."
                rows={3}
                {...form.register('reasonForVisit')}
              />
              {form.formState.errors.reasonForVisit && (
                <p className="text-sm text-red-600">{form.formState.errors.reasonForVisit.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Clinical Examination */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Khám Lâm Sàng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Kết Quả Khám Lâm Sàng *</label>
              <Textarea 
                placeholder="Mô tả kết quả khám lâm sàng..."
                rows={4}
                {...form.register('examinationFindings')}
              />
              {form.formState.errors.examinationFindings && (
                <p className="text-sm text-red-600">{form.formState.errors.examinationFindings.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Khám Trong Miệng *</label>
              <Textarea 
                placeholder="Mô tả tình trạng trong miệng..."
                rows={4}
                {...form.register('intraoralExam')}
              />
              {form.formState.errors.intraoralExam && (
                <p className="text-sm text-red-600">{form.formState.errors.intraoralExam.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Phân Tích Chẩn Đoán</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Phân Tích X-quang *</label>
              <Textarea 
                placeholder="Mô tả kết quả phân tích X-quang..."
                rows={4}
                {...form.register('xRayAnalysis')}
              />
              {form.formState.errors.xRayAnalysis && (
                <p className="text-sm text-red-600">{form.formState.errors.xRayAnalysis.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Phân Tích Mẫu Hàm *</label>
              <Textarea 
                placeholder="Mô tả kết quả phân tích mẫu hàm..."
                rows={4}
                {...form.register('modelAnalysis')}
              />
              {form.formState.errors.modelAnalysis && (
                <p className="text-sm text-red-600">{form.formState.errors.modelAnalysis.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Treatment Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Kế Hoạch Điều Trị</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nội Dung Kế Hoạch Điều Trị *</label>
              <Textarea 
                placeholder="Mô tả chi tiết kế hoạch điều trị..."
                rows={6}
                {...form.register('treatmentPlanContent')}
              />
              {form.formState.errors.treatmentPlanContent && (
                <p className="text-sm text-red-600">{form.formState.errors.treatmentPlanContent.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cost Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Chi Phí & Thanh Toán
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tổng Chi Phí (VND) *</label>
                <Input 
                  type="number" 
                  placeholder="0" 
                  {...form.register('totalCost', { valueAsNumber: true })}
                />
                {form.formState.errors.totalCost && (
                  <p className="text-sm text-red-600">{form.formState.errors.totalCost.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Phương Thức Thanh Toán *</label>
                <Select onValueChange={(value) => form.setValue('paymentMethod', value as PaymentMethod)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn phương thức thanh toán" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PaymentMethod.CASH}>Tiền mặt</SelectItem>
                    <SelectItem value={PaymentMethod.BANK_TRANSFER}>Chuyển khoản</SelectItem>
                    <SelectItem value={PaymentMethod.CREDIT_CARD}>Thẻ tín dụng</SelectItem>
                    <SelectItem value={PaymentMethod.INSTALLMENT}>Trả góp</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.paymentMethod && (
                  <p className="text-sm text-red-600">{form.formState.errors.paymentMethod.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

      </form>
    </div>
  );
};