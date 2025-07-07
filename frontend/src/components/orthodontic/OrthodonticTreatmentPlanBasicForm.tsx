import React from 'react';
import { useParams, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDentists } from '@/hooks/useDentists';

const basicPlanSchema = z.object({
  planTitle: z.string().min(1, 'Tên kế hoạch là bắt buộc'),
  templateName: z.string().min(1, 'Template là bắt buộc'),
  dentistId: z.coerce.number().min(1, 'Bác sĩ phụ trách là bắt buộc'),
  consultationDate: z.string().min(1, 'Ngày tư vấn là bắt buộc'),
});

type BasicPlanFormData = z.infer<typeof basicPlanSchema>;

export const OrthodonticTreatmentPlanBasicForm: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  // Get dentists list
  const { data: dentists = [], isLoading: isDentistsLoading } = useDentists();

  // Mock patient data - should be fetched from API
  const patientInfo = {
    fullname: "Nguyễn Hoài Na",
    dob: "1991",
    phone: "0941120025",
    email: "hoaina@email.com"
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

  const onSubmit = (data: BasicPlanFormData) => {
    const selectedDentist = dentists.find(d => d.dentistId === data.dentistId);
    
    // Save basic data to sessionStorage
    sessionStorage.setItem('basicPlanData', JSON.stringify({
      ...data,
      patientId: parseInt(patientId || '0'),
      dentistName: selectedDentist?.fullName,
      patientInfo
    }));
    
    // Navigate to detail form
    navigate(`/patients/${patientId}/orthodontic-treatment-plans/create/detail`);
  };

  const handleGoBack = () => {
    navigate(`/patients/${patientId}/orthodontic-treatment-plans`);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleGoBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tạo Kế Hoạch Điều Trị</h1>
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
                <label className="text-sm font-medium text-gray-700">Tên Kế Hoạch *</label>
                <Input
                  placeholder="Nhập tên kế hoạch điều trị"
                  {...form.register('planTitle')}
                />
                {form.formState.errors.planTitle && (
                  <p className="text-sm text-red-600">{form.formState.errors.planTitle.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Tên Mẫu *</label>
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

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Bác Sĩ Phụ Trách *</label>
                <Select onValueChange={(value) => form.setValue('dentistId', parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn bác sĩ" />
                  </SelectTrigger>
                  <SelectContent>
                    {isDentistsLoading ? (
                      <SelectItem value="0" disabled>Đang tải...</SelectItem>
                    ) : (
                      dentists.map((dentist) => (
                        <SelectItem key={dentist.dentistId} value={dentist.dentistId.toString()}>
                          {dentist.fullName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {form.formState.errors.dentistId && (
                  <p className="text-sm text-red-600">{form.formState.errors.dentistId.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={handleGoBack}>
            <X className="h-4 w-4 mr-2" />
            Thoát
          </Button>
          <Button type="submit">
            <Save className="h-4 w-4 mr-2" />
            Lưu
          </Button>
          <Button 
            type="button" 
            variant="secondary"
            onClick={() => {
              // Save and go to detail
              form.handleSubmit((data) => {
                sessionStorage.setItem('basicPlanData', JSON.stringify({
                  ...data,
                  patientId: parseInt(patientId || '0'),
                  patientInfo
                }));
                navigate(`/patients/${patientId}/orthodontic-treatment-plans/create/detail`);
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