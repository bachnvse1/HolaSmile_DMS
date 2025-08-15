import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  usePrescriptionTemplate,
  useCreatePrescriptionTemplate,
  useUpdatePrescriptionTemplate
} from '@/hooks/usePrescriptionTemplates';
import { useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/utils/formatUtils';

const prescriptionTemplateSchema = z.object({
  PreTemplateName: z.string().min(1, 'Tên mẫu đơn là bắt buộc'),
  PreTemplateContext: z.string().min(1, 'Nội dung mẫu đơn là bắt buộc'),
});

type PrescriptionTemplateFormData = z.infer<typeof prescriptionTemplateSchema>;

interface PrescriptionTemplateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateId?: number;
  mode: 'create' | 'edit';
}

export const PrescriptionTemplateFormModal: React.FC<PrescriptionTemplateFormModalProps> = ({
  isOpen,
  onClose,
  templateId,
  mode
}) => {
  const { data: template, isLoading: isLoadingTemplate } = usePrescriptionTemplate(
    mode === 'edit' ? Number(templateId) || 0 : 0
  );

  const { mutate: createTemplate, isPending: isCreating } = useCreatePrescriptionTemplate();
  const { mutate: updateTemplate, isPending: isUpdating } = useUpdatePrescriptionTemplate();

  const isLoading = isCreating || isUpdating;
  const queryClient = useQueryClient();

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
    } else if (mode === 'create') {
      form.reset({
        PreTemplateName: '',
        PreTemplateContext: '',
      });
    }
  }, [template, mode, form, isOpen]);

  const onSubmit = async (data: PrescriptionTemplateFormData) => {
    if (mode === 'create') {
      createTemplate(data, {
        onSuccess: (response) => {
          toast.success(response?.message || 'Tạo mẫu đơn thuốc thành công');
          queryClient.invalidateQueries({ queryKey: ['prescriptionTemplates'] });
          onClose();
        },
        onError: (error) => {
          toast.error(getErrorMessage(error) || 'Có lỗi xảy ra khi tạo mẫu đơn thuốc');
        }
      });
    } else {
      updateTemplate({
        PreTemplateID: Number(templateId) || 0,
        ...data,
      }, {
        onSuccess: (response) => {
          toast.success(response?.message || 'Cập nhật mẫu đơn thuốc thành công');
          queryClient.invalidateQueries({ queryKey: ['prescriptionTemplates'] });
          queryClient.invalidateQueries({ queryKey: ['prescriptionTemplate', templateId] });
          onClose();
        },
        onError: (error) => {
          toast.error(getErrorMessage(error) || 'Có lỗi xảy ra khi cập nhật mẫu đơn thuốc');
        }
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-black/20 bg-opacity-75" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block w-full max-w-3xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-xl relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {mode === 'create' ? 'Tạo Mẫu Đơn Thuốc Mới' : 'Chỉnh Sửa Mẫu Đơn Thuốc'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Loading state for edit mode */}
          {mode === 'edit' && isLoadingTemplate ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Template Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên Mẫu Đơn Thuốc <span className='text-red-400'>*</span>
                </label>
                <Input
                  placeholder="VD: Điều trị viêm lợi cấp tính"
                  {...form.register('PreTemplateName')}
                />
                {form.formState.errors.PreTemplateName && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.PreTemplateName.message}
                  </p>
                )}
              </div>

              {/* Template Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.PreTemplateContext.message}
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  Hãy mô tả chi tiết tên thuốc, liều dùng, cách dùng và các lưu ý cần thiết
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-300">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="min-w-[140px]"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading
                    ? (mode === 'create' ? 'Đang tạo...' : 'Đang cập nhật...')
                    : (mode === 'create' ? 'Tạo Mẫu Đơn' : 'Cập Nhật')
                  }
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};