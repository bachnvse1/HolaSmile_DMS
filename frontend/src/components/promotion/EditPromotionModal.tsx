import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { X, Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Combobox } from '@/components/ui/simple-combobox';
import { useUpdatePromotionProgram, usePromotionProgramDetail } from '@/hooks/usePromotions';
import { useProcedures } from '@/hooks/useProcedures';
import type { Procedure } from '@/services/procedureApi';
import { getErrorMessage } from '@/utils/formatUtils';

interface EditPromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  programId: number;
}

interface FormData {
  programName: string;
  startDate: string;
  endDate: string;
  procedures: {
    procedureId: number;
    discountAmount: string;
  }[];
}

export const EditPromotionModal: React.FC<EditPromotionModalProps> = ({
  isOpen,
  onClose,
  programId
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: procedures = [] } = useProcedures();
  const { data: programDetail, isLoading } = usePromotionProgramDetail(programId);
  const { mutate: updatePromotion } = useUpdatePromotionProgram();

  const form = useForm<FormData>({
    defaultValues: {
      programName: '',
      startDate: '',
      endDate: '',
      procedures: [{ procedureId: 0, discountAmount: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'procedures'
  });

  useEffect(() => {
    if (programDetail) {
      const parseDate = (dateStr: string) => {
        if (!dateStr) return '';
        if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr.slice(0, 10);
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
          const [d, m, y] = dateStr.split('/');
          return `${y}-${m}-${d}`;
        }
        return '';
      };
      const startDate = parseDate(programDetail.startDate);
      const endDate = parseDate(programDetail.endDate);

      form.reset({
        programName: programDetail.programName,
        startDate: startDate,
        endDate: endDate,
        procedures: programDetail.listProcedure.length > 0
          ? programDetail.listProcedure.map(p => ({
            procedureId: p.procedureId,
            discountAmount: p.discountAmount?.toString() || '0'
          }))
          : [{ procedureId: 0, discountAmount: '' }]
      });
    }
  }, [programDetail, form]);

  const handleDiscountPercentageChange = (index: number, value: string) => {
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
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);

      if (endDate <= startDate) {
        toast.error('Ngày kết thúc phải lớn hơn ngày bắt đầu');
        return;
      }

      const requestData = {
        programId: programId,
        programName: data.programName.trim(),
        startDate: data.startDate,
        endDate: data.endDate,
        discountPercentage: 0, 
        listProcedure: validProcedures.map(p => ({
          procedureId: p.procedureId,
          discountAmount: parseInt(p.discountAmount) || 0
        }))
      };

      updatePromotion(requestData, {
        onSuccess: () => {
          toast.success('Cập nhật chương trình khuyến mãi thành công');
          onClose();
        },
        onError: (error) => {
          toast.error(getErrorMessage(error) || 'Có lỗi xảy ra khi cập nhật chương trình khuyến mãi');
        }
      });
    } catch {
      toast.error('Có lỗi xảy ra khi cập nhật chương trình khuyến mãi');
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

  const getSelectedProcedureId = (index: number) => {
    const procedureId = form.watch(`procedures.${index}.procedureId`);
    return procedureId ? procedureId.toString() : '';
  };

  // Get already selected procedure IDs to filter them out
  const getSelectedProcedureIds = () => {
    return form.watch('procedures')
      .map(p => p.procedureId)
      .filter(id => id > 0);
  };

  const getAvailableProcedures = (currentIndex: number) => {
    const selectedIds = getSelectedProcedureIds();
    const currentProcedureId = form.watch(`procedures.${currentIndex}.procedureId`);

    return procedures.filter((procedure: Procedure) => {
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
      <div className="fixed inset-0 bg-black/20 bg-opacity-50" onClick={onClose} />

      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-300">
          <div className="flex items-center gap-3">
            <Edit className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Chỉnh Sửa Chương Trình Khuyến Mãi</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
            </div>
          </div>
        ) : (
          /* Form */
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Program Info */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold text-lg">Thông tin chương trình</h3>

                {/* Program Name */}
                <div className="space-y-2">
                  <Label htmlFor="programName">Tên chương trình<span className='text-red-400'>*</span></Label>
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
                    <Label htmlFor="startDate">Ngày bắt đầu<span className='text-red-400'>*</span></Label>
                    <div className="relative">
                      <Input
                        id="startDate"
                        type="date"
                        {...form.register('startDate', { required: 'Vui lòng chọn ngày bắt đầu' })}
                        className="pr-10"
                      />
                      {/* <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" /> */}
                    </div>
                    {form.formState.errors.startDate && (
                      <p className="text-sm text-red-600">{form.formState.errors.startDate.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">Ngày kết thúc<span className='text-red-400'>*</span></Label>
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
              </CardContent>
            </Card>

            {/* Procedures */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Thủ thuật áp dụng <span className='text-red-400'>*</span></h3>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Procedure Selection */}
                          <div className="space-y-2">
                            <Label>Thủ thuật</Label>
                            <Combobox
                              options={getAvailableProcedures(index).map((procedure: Procedure) => ({
                                label: procedure.procedureName,
                                value: procedure.procedureId.toString()
                              }))}
                              placeholder="Chọn thủ thuật"
                              value={getSelectedProcedureId(index)}
                              onValueChange={(value: string) =>
                                form.setValue(`procedures.${index}.procedureId`, parseInt(value))
                              }
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
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3"
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
              </CardContent>
            </Card>

            {/* Preview */}
            {form.watch('procedures').some(p => p.procedureId > 0 && p.discountAmount) && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <h4 className="font-medium text-blue-900 mb-3">Xem trước thay đổi</h4>
                  <div className="space-y-3 text-sm">
                    <div className="space-y-1">
                      <span className="text-gray-700">Tên chương trình:</span>
                      <div className="font-medium break-words word-wrap overflow-wrap-anywhere bg-white p-2 rounded-md border border-gray-300">
                        {form.watch('programName') || 'Chưa nhập'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-700">Thời gian:</span>
                      <div className="font-medium break-words word-wrap overflow-wrap-anywhere bg-white p-2 rounded-md border border-gray-300">
                        {form.watch('startDate')} đến {form.watch('endDate')}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-gray-700">Thủ thuật áp dụng:</span>
                      <div className="space-y-2">
                        {form.watch('procedures')
                          .filter(p => p.procedureId > 0 && p.discountAmount)
                          .map((proc, index) => {
                            const procedure = procedures.find((p: Procedure) => p.procedureId === proc.procedureId);
                            return (
                              <div key={index} className="bg-white p-3 rounded-md border border-gray-300">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                  <span className="break-words word-wrap overflow-wrap-anywhere text-gray-900">
                                    {procedure?.procedureName}
                                  </span>
                                  <span className="font-medium text-blue-600 flex-shrink-0 text-right">
                                    Giảm {proc.discountAmount}%
                                  </span>
                                </div>
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
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-300">
              <Button type="button" variant="outline" onClick={onClose}>
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang cập nhật...' : 'Cập Nhật Chương Trình'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};