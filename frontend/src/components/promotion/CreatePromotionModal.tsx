import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Combobox } from '@/components/ui/simple-combobox';
import { useCreatePromotionProgram } from '@/hooks/usePromotions';
import { useProcedures } from '@/hooks/useProcedures';
import type { Procedure } from '@/services/procedureApi';
import { getErrorMessage } from '@/utils/formatUtils';

interface CreatePromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  programName: string;
  createDate: string;
  endDate: string;
  procedures: {
    procedureId: number;
    discountAmount: string;
  }[];
}

export const CreatePromotionModal: React.FC<CreatePromotionModalProps> = ({
  isOpen,
  onClose
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: procedures = [] } = useProcedures();
  const { mutate: createPromotion } = useCreatePromotionProgram();

  const form = useForm<FormData>({
    defaultValues: {
      programName: '',
      createDate: new Date().toISOString().split('T')[0],
      endDate: '',
      procedures: [{ procedureId: 0, discountAmount: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'procedures'
  });

  const handleDiscountPercentageChange = (index: number, value: string) => {
    // Only allow numbers and ensure it's between 0-100
    const numericValue = value.replace(/[^\d]/g, '');
    const percentage = Math.min(100, Math.max(0, parseInt(numericValue) || 0));
    form.setValue(`procedures.${index}.discountAmount`, percentage.toString());
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);

      // Validate procedures
      const validProcedures = data.procedures.filter(p => p.procedureId > 0 && p.discountAmount);
      if (validProcedures.length === 0) {
        toast.error('Vui lòng thêm ít nhất một thủ thuật với phần trăm giảm giá');
        return;
      }

      // Validate dates
      const startDate = new Date(data.createDate);
      const endDate = new Date(data.endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (startDate < today) {
        toast.error('Ngày bắt đầu không được nhỏ hơn ngày hiện tại');
        return;
      }

      if (endDate <= startDate) {
        toast.error('Ngày kết thúc phải lớn hơn ngày bắt đầu');
        return;
      }

      const requestData = {
        programName: data.programName.trim(),
        createDate: data.createDate,
        endDate: data.endDate,
        listProcedure: validProcedures.map(p => ({
          procedureId: p.procedureId,
          discountAmount: parseInt(p.discountAmount) || 0
        }))
      };

      createPromotion(requestData, {
        onSuccess: () => {
          toast.success('Tạo chương trình khuyến mãi thành công');
          form.reset();
          onClose();
        },
        onError: (error) => {
          toast.error(getErrorMessage(error) || 'Có lỗi xảy ra khi tạo chương trình khuyến mãi');
        }
      });
    } catch {
      toast.error('Có lỗi xảy ra khi tạo chương trình khuyến mãi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addProcedure = () => {
    append({ procedureId: 0, discountAmount: '' });
  };

  const removeProcedure = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  // Get already selected procedure IDs to filter them out
  const getSelectedProcedureIds = () => {
    return form.watch('procedures')
      .map(p => p.procedureId)
      .filter(id => id > 0);
  };

  // Get available procedures for a specific index
  const getAvailableProcedures = (currentIndex: number) => {
    const selectedIds = getSelectedProcedureIds();
    const currentProcedureId = form.watch(`procedures.${currentIndex}.procedureId`);
    
    return procedures.filter((procedure: Procedure) => {
      // Include current selection or unselected procedures
      return procedure.procedureId === currentProcedureId || 
             !selectedIds.includes(procedure.procedureId);
    });
  };

  // Check if all procedures are selected
  const areAllProceduresSelected = () => {
    const selectedIds = getSelectedProcedureIds();
    return selectedIds.length >= procedures.length;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 bg-opacity-50" onClick={onClose} />
      
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-300">
          <h2 className="text-xl font-semibold text-gray-900">Tạo Chương Trình Khuyến Mãi</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Program Name */}
          <div className="space-y-2">
            <Label htmlFor="programName">Tên chương trình *</Label>
            <Input
              id="programName"
              placeholder="Nhập tên chương trình khuyến mãi..."
              {...form.register('programName', { 
                required: 'Vui lòng nhập tên chương trình',
                minLength: { value: 3, message: 'Tên chương trình phải có ít nhất 3 ký tự' }
              })}
            />
            {form.formState.errors.programName && (
              <p className="text-sm text-red-600">{form.formState.errors.programName.message}</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="createDate">Ngày bắt đầu *</Label>
              <div className="relative">
                <Input
                  id="createDate"
                  type="date"
                  {...form.register('createDate', { required: 'Vui lòng chọn ngày bắt đầu' })}
                  className="pr-10"
                />
                {/* <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" /> */}
              </div>
              {form.formState.errors.createDate && (
                <p className="text-sm text-red-600">{form.formState.errors.createDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Ngày kết thúc *</Label>
              <div className="relative">
                <Input
                  id="endDate"
                  type="date"
                  {...form.register('endDate', { required: 'Vui lòng chọn ngày kết thúc' })}
                  className="pr-10"
                />
                {/* <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" /> */}
              </div>
              {form.formState.errors.endDate && (
                <p className="text-sm text-red-600">{form.formState.errors.endDate.message}</p>
              )}
            </div>
          </div>

          {/* Procedures */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Thủ thuật áp dụng *</Label>
              <Button
                type="button"
                onClick={addProcedure}
                size="sm"
                variant="outline"
                disabled={areAllProceduresSelected()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm thủ thuật
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <Card key={field.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                      {/* Procedure Selection */}
                      <div className="space-y-2">
                        <Label>Thủ thuật</Label>
                        <Combobox
                          options={getAvailableProcedures(index).map((procedure: Procedure) => ({
                            value: procedure.procedureId.toString(),
                            label: procedure.procedureName
                          }))}
                          value={form.watch(`procedures.${index}.procedureId`)?.toString() || ''}
                          onValueChange={(value) => 
                            form.setValue(`procedures.${index}.procedureId`, parseInt(value) || 0)
                          }
                          placeholder="Chọn thủ thuật"
                          searchPlaceholder="Tìm kiếm thủ thuật..."
                          emptyText={getAvailableProcedures(index).length === 0 ? "Tất cả thủ thuật đã được chọn" : "Không tìm thấy thủ thuật"}
                        />
                      </div>

                      {/* Discount Percentage */}
                      <div className="space-y-2">
                        <Label>Phần trăm giảm giá (%)</Label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              placeholder="0"
                              type="number"
                              min="0"
                              max="100"
                              value={form.watch(`procedures.${index}.discountAmount`)}
                              onChange={(e) => handleDiscountPercentageChange(index, e.target.value)}
                              className="pr-8"
                            />
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">%</span>
                          </div>
                          
                          {/* Remove Button */}
                          <Button
                            type="button"
                            onClick={() => removeProcedure(index)}
                            disabled={fields.length === 1}
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Preview */}
          {form.watch('procedures').some(p => p.procedureId > 0 && p.discountAmount) && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h4 className="font-medium text-blue-900 mb-3">Xem trước chương trình</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Tên chương trình:</span>
                    <span className="font-medium">{form.watch('programName') || 'Chưa nhập'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Thời gian:</span>
                    <span className="font-medium">
                      {form.watch('createDate')} đến {form.watch('endDate')}
                    </span>
                  </div>
                  <div>
                    <span>Thủ thuật áp dụng:</span>
                    <div className="mt-1 space-y-1">
                      {form.watch('procedures')
                        .filter(p => p.procedureId > 0 && p.discountAmount)
                        .map((proc, index) => {
                          const procedure = procedures.find((p: Procedure) => p.procedureId === proc.procedureId);
                          return (
                            <div key={index} className="flex justify-between bg-white p-2 rounded">
                              <span>{procedure?.procedureName}</span>
                              <span className="font-medium text-blue-600">
                                Giảm {proc.discountAmount}%
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang tạo...' : 'Tạo Chương Trình'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};