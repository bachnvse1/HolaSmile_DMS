import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';    
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  usePrescriptionTemplate,
  useUpdatePrescriptionTemplate 
} from '@/hooks/usePrescriptionTemplates';
import { getErrorMessage } from '@/utils/formatUtils';

const prescriptionTemplateSchema = z.object({
  PreTemplateName: z.string().min(1, 'Tên mẫu đơn là bắt buộc'),
  PreTemplateContext: z.string().min(1, 'Nội dung mẫu đơn là bắt buộc'),
});

type PrescriptionTemplateFormData = z.infer<typeof prescriptionTemplateSchema>;

export const PrescriptionTemplateEditForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const templateId = id ? parseInt(id) : 0;
  const { data: template, isLoading: isLoadingTemplate } = usePrescriptionTemplate(templateId);
  const { mutate: updateTemplate, isPending: isUpdating } = useUpdatePrescriptionTemplate();

  const form = useForm<PrescriptionTemplateFormData>({
    resolver: zodResolver(prescriptionTemplateSchema),
    defaultValues: {
      PreTemplateName: '',
      PreTemplateContext: '',
    },
  });

  useEffect(() => {
    if (template) {
      form.reset({
        PreTemplateName: template.PreTemplateName,
        PreTemplateContext: template.PreTemplateContext,
      });
    }
  }, [template, form]);

  const onSubmit = async (data: PrescriptionTemplateFormData) => {
    updateTemplate({
      PreTemplateID: templateId,
      ...data,
    }, {
      onSuccess: (response) => {
        toast.success(response?.message || 'Cập nhật mẫu đơn thuốc thành công');
        navigate('/prescription-templates');
      },
      onError: (error ) => {
        toast.error(getErrorMessage(error) || 'Có lỗi xảy ra khi cập nhật mẫu đơn thuốc');
      }
    });
  };

  const handleGoBack = () => {
    navigate('/prescription-templates');
  };

  if (isLoadingTemplate) {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-600">Không tìm thấy mẫu đơn thuốc</p>
            <Button variant="outline" onClick={handleGoBack} className="mt-2">
              Quay lại
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleGoBack} className='border border-gray-300'>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Chỉnh Sửa Mẫu Đơn Thuốc
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Cập nhật thông tin mẫu đơn thuốc
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Thông Tin Cơ Bản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Tên Mẫu Đơn Thuốc <span className='text-red-400'>*</span>
              </label>
              <Input
                placeholder="VD: Điều trị viêm lợi cấp tính"
                {...form.register('PreTemplateName')}
              />
              {form.formState.errors.PreTemplateName && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.PreTemplateName.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Template Content */}
        <Card>
          <CardHeader>
            <CardTitle>Nội Dung Mẫu Đơn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Nội Dung Chi Tiết <span className='text-red-400'>*</span>
              </label>
              <Textarea
                rows={12}
                placeholder={`Ví dụ:

1. Amoxicillin 500mg
   - Liều dùng: 1 viên x 3 lần/ngày
   - Thời gian: 7 ngày
   - Cách dùng: Uống sau ăn

2. Ibuprofen 400mg
   - Liều dùng: 1 viên khi đau
   - Tối đa: 3 viên/ngày
   - Cách dùng: Uống sau ăn

Lưu ý: Tái khám sau 1 tuần`}
                {...form.register('PreTemplateContext')}
              />
              {form.formState.errors.PreTemplateContext && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.PreTemplateContext.message}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Hãy mô tả chi tiết tên thuốc, liều dùng, cách dùng và các lưu ý cần thiết
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={handleGoBack} className="w-full sm:w-auto">
            <X className="h-4 w-4 mr-2" />
            Hủy
          </Button>
          <Button type="submit" disabled={isUpdating} className="w-full sm:w-auto">
            <Save className="h-4 w-4 mr-2" />
            {isUpdating ? 'Đang cập nhật...' : 'Cập Nhật'}
          </Button>
        </div>
      </form>
    </div>
  );
};