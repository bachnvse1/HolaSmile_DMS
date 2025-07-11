import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, FileText, Calendar, User, Save } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Combobox } from '../ui/simple-combobox';
import { useAuth } from '../../hooks/useAuth';
import { usePrescriptionByAppointment, useCreatePrescription, useUpdatePrescription } from '../../hooks/usePrescription';
import { usePrescriptionTemplates } from '../../hooks/usePrescriptionTemplates';
import { useAppointmentDetail } from '../../hooks/useAppointments';
import { formatDateVN } from '../../utils/dateUtils';
import type { AppointmentDTO } from '../../types/appointment';
import type { CreatePrescriptionRequest, UpdatePrescriptionRequest } from '../../types/prescription';

// Extended interface for appointment with prescription
interface AppointmentWithPrescription extends AppointmentDTO {
  prescriptionId?: number;
}

interface PrescriptionModalProps {
  appointmentId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface PrescriptionFormData {
  content: string;
  templateId?: string;
}

export const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  appointmentId,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { role } = useAuth();
  const isDentist = role === 'Dentist';
  
  // Queries
  const { data: appointment } = useAppointmentDetail(appointmentId);
  const { data: existingPrescription, isLoading: isLoadingPrescription } = usePrescriptionByAppointment(appointmentId);
  const { data: templates = [] } = usePrescriptionTemplates();
  
  console.log('PrescriptionModal:', {
    appointmentId,
    existingPrescription,
    isLoadingPrescription
  });
  
  // Mutations
  const createMutation = useCreatePrescription();
  const updateMutation = useUpdatePrescription();
  
  // Form
  const { register, handleSubmit, setValue, watch, reset } = useForm<PrescriptionFormData>({
    defaultValues: {
      content: '',
      templateId: '',
    }
  });

  const selectedTemplateId = watch('templateId');
  const isEditing = !!existingPrescription;

  // Set initial values when prescription data loads
  useEffect(() => {
    if (existingPrescription) {
      reset({
        content: existingPrescription.content,
        templateId: '',
      });
    }
  }, [existingPrescription, reset]);

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    setValue('templateId', templateId);
    const selectedTemplate = templates.find(t => t.PreTemplateID.toString() === templateId);
    if (selectedTemplate) {
      setValue('content', selectedTemplate.PreTemplateContext);
    }
  };

  // Handle form submission
  const onSubmit = async (data: PrescriptionFormData) => {
    try {
      if (isEditing && existingPrescription) {
        const updateData: UpdatePrescriptionRequest = {
          prescriptionId: existingPrescription.appointmentId, // Assuming this maps to prescription ID
          contents: data.content,
        };
        await updateMutation.mutateAsync(updateData);
        toast.success('Cập nhật đơn thuốc thành công!');
      } else {
        const createData: CreatePrescriptionRequest = {
          appointmentId: appointmentId,
          contents: data.content,
        };
        await createMutation.mutateAsync(createData);
        toast.success('Tạo đơn thuốc thành công!');
      }
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving prescription:', error);
      toast.error('Có lỗi xảy ra khi lưu đơn thuốc. Vui lòng thử lại!');
    }
  };

  if (!isOpen) return null;

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-500 bg-opacity-75 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                {isEditing ? (isDentist ? 'Chỉnh sửa đơn thuốc' : 'Xem đơn thuốc') : 'Tạo đơn thuốc'}
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

          {/* Content */}
          <div className="p-6">
            {/* Appointment Info */}
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

            {isLoadingPrescription ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Content */}
                <div className="space-y-2">
                  <Label htmlFor="content" className="text-sm font-medium text-gray-700">
                    Nội dung đơn thuốc *
                  </Label>
                  <Textarea
                    id="content"
                    placeholder="Nhập nội dung đơn thuốc..."
                    rows={8}
                    {...register('content', { required: true })}
                    readOnly={!isDentist}
                    className={!isDentist ? 'bg-gray-50' : ''}
                  />
                </div>

                {/* Template Selection - Only for Dentist */}
                {isDentist && (
                  <div className="space-y-2">
                    <Label htmlFor="template" className="text-sm font-medium text-gray-700">
                      Mẫu đơn thuốc
                    </Label>
                    <Combobox
                      options={templates.map(template => ({
                        value: template.PreTemplateID.toString(),
                        label: template.PreTemplateName
                      }))}
                      value={selectedTemplateId || ''}
                      onValueChange={handleTemplateSelect}
                      placeholder="Chọn mẫu đơn thuốc..."
                      searchPlaceholder="Tìm kiếm mẫu đơn thuốc..."
                      emptyText="Không tìm thấy mẫu đơn thuốc"
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">
                      Chọn mẫu để tự động điền nội dung
                    </p>
                  </div>
                )}

                {/* Prescription Metadata */}
                {existingPrescription && (
                  <div className="border-t border-gray-200 pt-4 space-y-3">
                    <h4 className="font-medium text-gray-900">Thông tin đơn thuốc</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Tạo bởi:</span>
                        <span className="ml-2 text-gray-900">{existingPrescription.createdBy}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Ngày tạo:</span>
                        <span className="ml-2 text-gray-900">{formatDateVN(existingPrescription.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <Button type="button" variant="outline" onClick={onClose}>
                    {isDentist ? 'Hủy' : 'Đóng'}
                  </Button>
                  {isDentist && (
                    <Button type="submit" disabled={isLoading}>
                      <Save className="h-4 w-4 mr-2" />
                      {isLoading 
                        ? 'Đang lưu...' 
                        : isEditing 
                          ? 'Cập nhật' 
                          : 'Tạo đơn thuốc'
                      }
                    </Button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};