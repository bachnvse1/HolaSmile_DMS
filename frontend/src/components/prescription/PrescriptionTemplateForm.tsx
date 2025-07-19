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
  useCreatePrescriptionTemplate, 
  useUpdatePrescriptionTemplate 
} from '@/hooks/usePrescriptionTemplates';

const prescriptionTemplateSchema = z.object({
  PreTemplateName: z.string().min(1, 'Tên mẫu đơn là bắt buộc'),
  PreTemplateContext: z.string().min(1, 'Nội dung mẫu đơn là bắt buộc'),
});

type PrescriptionTemplateFormData = z.infer<typeof prescriptionTemplateSchema>;

interface PrescriptionTemplateFormProps {
  mode: 'create' | 'edit';
}

export const PrescriptionTemplateForm: React.FC<PrescriptionTemplateFormProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const templateId = id ? parseInt(id) : 0;
  const { data: template, isLoading: isLoadingTemplate } = usePrescriptionTemplate(
    mode === 'edit' ? templateId : 0
  );
  
  const { mutate: createTemplate, isLoading: isCreating } = useCreatePrescriptionTemplate();
  const { mutate: updateTemplate, isLoading: isUpdating } = useUpdatePrescriptionTemplate();
  
  const isLoading = isCreating || isUpdating;

  const form = useForm<PrescriptionTemplateFormData>({
    resolver: zodResolver(prescriptionTemplateSchema),
    defaultValues: {
      PreTemplateName: '',
      PreTemplateContext: '',
    },
  });

  // Load template data for edit mode
  useEffect(() => {
    if (mode === 'edit' && template) {
      form.reset({
        PreTemplateName: template.PreTemplateName,
        PreTemplateContext: template.PreTemplateContext,
      });
    }
  }, [template, mode, form]);

  const onSubmit = async (data: PrescriptionTemplateFormData) => {
    try {
      if (mode === 'create') {
        await createTemplate(data);
        toast.success('Tạo mẫu đơn thuốc thành công');
      } else {
        await updateTemplate({
          PreTemplateID: templateId,
          ...data,
        });
        toast.success('Cập nhật mẫu đơn thuốc thành công');
      }
      navigate('/prescription-templates');
    } catch (error) {
      toast.error(`Có lỗi xảy ra khi ${mode === 'create' ? 'tạo' : 'cập nhật'} mẫu đơn thuốc`);
    }
  };

  const handleGoBack = () => {
    navigate('/prescription-templates');
  };

  if (mode === 'edit' && isLoadingTemplate) {
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

  if (mode === 'edit' && !template) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleGoBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {mode === 'create' ? 'Tạo Mẫu Đơn Thuốc Mới' : 'Chỉnh Sửa Mẫu Đơn Thuốc'}
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              {mode === 'create' 
                ? 'Tạo mẫu đơn thuốc để sử dụng trong các ca điều trị'
                : 'Cập nhật thông tin mẫu đơn thuốc'
              }
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Thông Tin Cơ Bản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Tên Mẫu Đơn Thuốc *
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
            <CardTitle className="text-lg sm:text-xl">Nội Dung Mẫu Đơn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Nội Dung Chi Tiết *
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
          <Button type="button" variant="outline" onClick={handleGoBack} className="order-2 sm:order-1">
            <X className="h-4 w-4 mr-2" />
            Hủy
          </Button>
          <Button type="submit" disabled={isLoading} className="order-1 sm:order-2">
            <Save className="h-4 w-4 mr-2" />
            {isLoading 
              ? (mode === 'create' ? 'Đang tạo...' : 'Đang cập nhật...') 
              : (mode === 'create' ? 'Tạo Mẫu Đơn' : 'Cập Nhật')
            }
          </Button>
        </div>
      </form>
    </div>
  );
};