import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, FileText, Calendar, User, Save } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Combobox } from '../ui/simple-combobox';
import { useAuth } from '../../hooks/useAuth';
import { useAppointmentDetail } from '../../hooks/useAppointments';
import { formatDateVN } from '../../utils/dateUtils';
import { 
  createInstruction, 
  editInstruction, 
  instructionTemplateService 
} from '../../services/instructionService';
import type { InstructionDTO } from '../../services/instructionService';
import type { InstructionTemplate } from '../../services/instructionTemplateService';
import { getErrorMessage } from '@/utils/formatUtils';

interface InstructionModalProps {
  appointmentId: number;
  existingInstruction?: InstructionDTO | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface InstructionFormData {
  content: string;
  templateId?: string;
}

export const InstructionModal: React.FC<InstructionModalProps> = ({
  appointmentId,
  existingInstruction,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { role } = useAuth();
  const isDentist = role === 'Dentist';
  const [templates, setTemplates] = useState<InstructionTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const { data: appointment } = useAppointmentDetail(appointmentId);
  
  const { register, handleSubmit, setValue, watch, reset } = useForm<InstructionFormData>({
    defaultValues: {
      content: '',
      templateId: '',
    }
  });

  const selectedTemplateId = watch('templateId');
  const isEditing = !!existingInstruction;

  useEffect(() => {
    const fetchTemplates = async () => {
      if (!isDentist) return;
      
      setIsLoadingTemplates(true);
      try {
        const templateData = await instructionTemplateService.getAll();
        setTemplates(templateData || []);
      } catch (error) {
        console.error('Error fetching instruction templates:', error);
        toast.error('Không thể tải mẫu chỉ dẫn');
        setTemplates([]);
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen, isDentist]);

  useEffect(() => {
    if (existingInstruction) {
      reset({
        content: existingInstruction.content || '',
        templateId: existingInstruction.instruc_TemplateID?.toString() || '',
      });
    } else {
      reset({
        content: '',
        templateId: '',
      });
    }
  }, [existingInstruction, reset]);

  const handleTemplateSelect = (templateId: string) => {
    setValue('templateId', templateId);
    if (templateId && templates.length > 0) {
      const selectedTemplate = templates.find(t => t.instruc_TemplateID.toString() === templateId);
      if (selectedTemplate) {
        setValue('content', selectedTemplate.instruc_TemplateContext || '');
      }
    } else {
      // Reset content nếu không chọn template
      setValue('content', '');
    }
  };

  const onSubmit = async (data: InstructionFormData) => {
    if (!data.content.trim()) {
      toast.error('Nội dung chỉ dẫn không được để trống');
      return;
    }

    setIsSaving(true);
    try {
      let success = false;
      const templateId = data.templateId && data.templateId !== '' ? Number(data.templateId) : null;
      
      if (isEditing && existingInstruction) {
        await editInstruction(
          existingInstruction.instructionId, 
          data.content.trim(), 
          templateId
        );
        toast.success('Cập nhật chỉ dẫn thành công');
        success = true;
      } else {
        await createInstruction(
          appointmentId, 
          data.content.trim(), 
          templateId
        );
        toast.success('Tạo chỉ dẫn thành công');
        success = true;
      }
      
      if (success) {
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 500);
      }
      
    } catch (error) {
      console.error('Error saving instruction:', error);
      toast.error(getErrorMessage(error) || 'Có lỗi xảy ra khi lưu chỉ dẫn. Vui lòng thử lại!');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/20 bg-opacity-75"
        onClick={onClose}
      />

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                {isEditing ? (isDentist ? 'Chỉnh sửa chỉ dẫn' : 'Xem chỉ dẫn') : 'Tạo chỉ dẫn'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Đóng"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6">
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Thông tin lịch hẹn</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center">
                  <User className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="font-medium">Bệnh nhân:</span>
                  <span className="ml-2">{appointment?.patientName || 'Đang tải...'}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-green-600 mr-2" />
                  <span className="font-medium">Ngày hẹn:</span>
                  <span className="ml-2">{appointment ? formatDateVN(appointment.appointmentDate) : 'Đang tải...'}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {isDentist && (
                <div className="space-y-2">
                  <Label htmlFor="template" className="text-sm font-medium text-gray-700">
                    Mẫu chỉ dẫn
                  </Label>
                  {isLoadingTemplates ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <Combobox
                      options={[
                        { value: '', label: 'Không sử dụng mẫu' },
                        ...templates.map(template => ({
                          value: template.instruc_TemplateID.toString(),
                          label: template.instruc_TemplateName
                        }))
                      ]}
                      value={selectedTemplateId || ''}
                      onValueChange={handleTemplateSelect}
                      placeholder="Chọn mẫu chỉ dẫn..."
                      searchPlaceholder="Tìm kiếm mẫu chỉ dẫn..."
                      emptyText="Không tìm thấy mẫu chỉ dẫn"
                      className="w-full"
                    />
                  )}
                  <p className="text-xs text-gray-500">
                    Chọn mẫu để tự động điền nội dung
                  </p>
                </div>
              )}

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content" className="text-sm font-medium text-gray-700">
                  Nội dung chỉ dẫn *
                </Label>
                <Textarea
                  id="content"
                  placeholder="Nhập nội dung chỉ dẫn..."
                  rows={8}
                  {...register('content', { required: true })}
                  readOnly={!isDentist}
                  className={!isDentist ? 'bg-gray-50' : ''}
                />
              </div>

              {existingInstruction && (
                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <h4 className="font-medium text-gray-900">Thông tin chỉ dẫn</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Tạo bởi:</span>
                      <span className="ml-2 text-gray-900">{existingInstruction.dentistName}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Ngày tạo:</span>
                      <span className="ml-2 text-gray-900">{formatDateVN(existingInstruction.createdAt)}</span>
                    </div>
                    {existingInstruction.instruc_TemplateName && (
                      <div className="col-span-2">
                        <span className="font-medium text-gray-600">Mẫu đã sử dụng:</span>
                        <span className="ml-2 text-gray-900">{existingInstruction.instruc_TemplateName}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button type="button" variant="outline" onClick={onClose}>
                  {isDentist ? 'Hủy' : 'Đóng'}
                </Button>
                {isDentist && (
                  <Button type="submit" disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving 
                      ? 'Đang lưu...' 
                      : isEditing 
                        ? 'Cập nhật' 
                        : 'Tạo chỉ dẫn'
                    }
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};