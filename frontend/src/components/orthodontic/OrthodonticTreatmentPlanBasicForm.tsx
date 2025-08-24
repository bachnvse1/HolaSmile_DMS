import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDentists } from '@/hooks/useDentists';
import { useOrthodonticTreatmentPlan } from '@/hooks/useOrthodonticTreatmentPlan';
import { usePatient } from '@/hooks/usePatient';

interface OrthodonticTreatmentPlanBasicFormProps {
  mode?: 'create' | 'edit';
}

export const OrthodonticTreatmentPlanBasicForm: React.FC<OrthodonticTreatmentPlanBasicFormProps> = ({ 
  mode = 'create' 
}) => {
  const { patientId, planId } = useParams<{ patientId: string; planId: string }>();
  const navigate = useNavigate();

  const basicPlanSchema = React.useMemo(() => z.object({
    planTitle: z.string().min(1, 'Tên kế hoạch là bắt buộc'),
    templateName: z.string().min(1, 'Tên mẫu là bắt buộc'),
    dentistId: mode === 'edit' ? z.coerce.number().optional() : z.coerce.number().min(1, 'Nha sĩ phụ trách là bắt buộc'),
    consultationDate: z.string().min(1, 'Ngày tư vấn là bắt buộc'),
  }), [mode]);

  type BasicPlanFormData = z.infer<typeof basicPlanSchema>;

  const { data: dentists = [], isLoading: isDentistsLoading } = useDentists();
  const { data: patientData} = usePatient(parseInt(patientId || '0'));
  const { data: treatmentPlan, isLoading: isPlanLoading } = useOrthodonticTreatmentPlan(
    parseInt(planId || '0'),
    parseInt(patientId || '0'),
    { enabled: mode === 'edit' && !!planId && !!patientId }
  );

  const [isFormPopulated, setIsFormPopulated] = React.useState(false);

  const patientInfo = patientData ? {
    fullname: patientData.fullname,
    dob: patientData.dob || 'Chưa cập nhật',
    phone: patientData.phone,
    email: patientData.email
  } : {
    fullname: "Đang tải...",
    dob: "...",
    phone: "...",
    email: "..."
  };

  const form = useForm<BasicPlanFormData>({
    resolver: zodResolver(basicPlanSchema),
    defaultValues: {
      planTitle: '',
      templateName: '',
      dentistId: 0,
      consultationDate: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    if (mode === 'edit' && treatmentPlan && !isDentistsLoading && dentists.length > 0 && !isFormPopulated) {
      const plan = treatmentPlan as Record<string, unknown>;
      
      const formData = {
        planTitle: (plan.planTitle as string) || '',
        templateName: (plan.templateName as string) || '',
        dentistId: (plan.dentistId as number) || 0,
        consultationDate: (plan.consultationDate as string)?.split('T')[0] || new Date().toISOString().split('T')[0],
      };
      
      form.reset(formData);
      setIsFormPopulated(true);
      
      setTimeout(() => {
        form.setValue('templateName', formData.templateName);
        form.setValue('dentistId', formData.dentistId)
      }, 100);
    }
  }, [treatmentPlan, form, mode, isDentistsLoading, dentists, isFormPopulated]);

  const onSubmit = (data: BasicPlanFormData) => {
    const selectedDentist = dentists.find(d => d.dentistId === data.dentistId);
    
    if (mode === 'edit') {
      sessionStorage.setItem('editBasicPlanData', JSON.stringify({
        ...data,
        planId: parseInt(planId || '0'),
        patientId: parseInt(patientId || '0'),
        dentistName: treatmentPlan && (treatmentPlan as { dentistName?: string }).dentistName,
        patientInfo
      })); 
      navigate(`/patients/${patientId}/orthodontic-treatment-plans/${planId}/edit/detail`);
    } else {
      sessionStorage.setItem('basicPlanData', JSON.stringify({
        ...data,
        patientId: parseInt(patientId || '0'),
        dentistName: selectedDentist?.fullName,
        patientInfo
      }));
      
      navigate(`/patients/${patientId}/orthodontic-treatment-plans/create/detail`);
    }
  };

  const handleGoBack = () => {
    navigate(`/patients/${patientId}/orthodontic-treatment-plans`);
  };

  if (mode === 'edit' && isPlanLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'edit' && !treatmentPlan) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-600">Không tìm thấy kế hoạch điều trị</p>
            <Button variant="outline" onClick={handleGoBack} className="mt-2">
              Quay lại
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleGoBack} className='border border-gray-300'>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {mode === 'edit' ? 'Chỉnh Sửa Kế Hoạch Điều Trị' : 'Tạo Kế Hoạch Điều Trị'}
            </h1>
            <p className="text-gray-600 mt-1">Thông tin cơ bản</p>
          </div>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Patient Information */}
        <Card>
          <CardHeader>
            <CardTitle>Thông Tin Khách Hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Họ và Tên</label>
                <Input
                  value={patientInfo.fullname}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Năm Sinh</label>
                <Input
                  value={patientInfo.dob}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Điện Thoại</label>
                <Input
                  value={patientInfo.phone}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <Input
                  value={patientInfo.email}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Plan Information */}
        <Card>
          <CardHeader>
            <CardTitle>Thông Tin Kế Hoạch</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Tên Kế Hoạch  <span className="text-red-600">*</span></label>
                <Input
                  placeholder="Nhập tên kế hoạch điều trị"
                  {...form.register('planTitle')}
                />
                {form.formState.errors.planTitle && (
                  <p className="text-sm text-red-600">{form.formState.errors.planTitle.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Tên Mẫu <span className="text-red-600">*</span></label>
                <Select 
                  value={form.watch('templateName') || ''}
                  onValueChange={(value) => form.setValue('templateName', value)}
                >
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

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nha sĩ Phụ Trách  <span className="text-red-600">*</span></label>
                {mode === 'edit' ? (
                  <Input
                    value={treatmentPlan && (treatmentPlan as { dentistName?: string }).dentistName || 'Không xác định'}
                    disabled
                    className="bg-gray-50"
                  />
                ) : (
                  <Select 
                    value={form.watch('dentistId') && form.watch('dentistId') !== 0 ? form.watch('dentistId')!.toString() : ''}
                    onValueChange={(value) => form.setValue('dentistId', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn Nha sĩ" />
                    </SelectTrigger>
                    <SelectContent>
                      {isDentistsLoading ? (
                        <SelectItem value="loading" disabled>Đang tải...</SelectItem>
                      ) : (
                        dentists.map((dentist) => (
                          <SelectItem key={dentist.dentistId} value={dentist.dentistId.toString()}>
                            {dentist.fullName}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
                {mode === 'edit' && (
                  <p className="text-xs text-gray-500">Không thể thay đổi Nha sĩ phụ trách khi chỉnh sửa</p>
                )}
                {form.formState.errors.dentistId && mode !== 'edit' && (
                  <p className="text-sm text-red-600">{form.formState.errors.dentistId.message}</p>
                )}
              </div>

              {/* <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Ngày Tư Vấn *</label>
                <Input
                  type="date"
                  {...form.register('consultationDate')}
                />
                {form.formState.errors.consultationDate && (
                  <p className="text-sm text-red-600">{form.formState.errors.consultationDate.message}</p>
                )}
              </div> */}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={handleGoBack}>
            <X className="h-4 w-4 mr-2" />
            Thoát
          </Button>
          {/* <Button type="submit">
            <Save className="h-4 w-4 mr-2" />
            Lưu
          </Button> */}
          <Button 
            type="button" 
            variant="secondary"
            onClick={() => {
              form.handleSubmit((data) => {
                const selectedDentist = dentists.find(d => d.dentistId === data.dentistId);
                if (mode === 'edit') {
                  sessionStorage.setItem('editBasicPlanData', JSON.stringify({
                    ...data,
                    planId: parseInt(planId || '0'),
                    patientId: parseInt(patientId || '0'),
                    dentistName: treatmentPlan && (treatmentPlan as { dentistName?: string }).dentistName,
                    patientInfo
                  }));
                  navigate(`/patients/${patientId}/orthodontic-treatment-plans/${planId}/edit/detail`);
                } else {
                  sessionStorage.setItem('basicPlanData', JSON.stringify({
                    ...data,
                    patientId: parseInt(patientId || '0'),
                    dentistName: selectedDentist?.fullName,
                    patientInfo
                  }));
                  navigate(`/patients/${patientId}/orthodontic-treatment-plans/create/detail`);
                }
              })();
            }}
          >
            <FileText className="h-4 w-4 mr-2" />
            Chi Tiết
          </Button>
        </div>
      </form>
    </div>
  );
};