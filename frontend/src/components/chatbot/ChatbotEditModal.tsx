import React from 'react';
import { useForm } from 'react-hook-form';
import { Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ChatbotKnowledge } from '@/types/chatbot.types';

interface EditAnswerFormData {
  answer: string;
}

interface ChatbotEditModalProps {
  item: ChatbotKnowledge;
  isUpdating: boolean;
  onSave: (answer: string) => Promise<boolean>;
  onCancel: () => void;
}

export const ChatbotEditModal: React.FC<ChatbotEditModalProps> = ({
  item,
  isUpdating,
  onSave,
  onCancel
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch
  } = useForm<EditAnswerFormData>({
    defaultValues: {
      answer: item.answer
    },
    mode: 'onChange'
  });

  const answerValue = watch('answer');

  const onSubmit = async (data: EditAnswerFormData) => {
    const success = await onSave(data.answer.trim());
    if (success) {
      onCancel(); 
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 text-center">
        <div className="fixed inset-0 bg-black/20 bg-opacity-50" onClick={onCancel}></div>

        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg relative z-10">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Chỉnh Sửa Câu Trả Lời
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onCancel}
                  disabled={isUpdating}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Câu hỏi:
                </Label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-sm text-gray-700 break-words">
                    {item.question}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Câu trả lời: <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  {...register('answer', {
                    required: 'Câu trả lời không được để trống',
                    minLength: {
                      value: 10,
                      message: 'Câu trả lời phải có ít nhất 10 ký tự'
                    },
                    validate: (value) => {
                      const trimmed = value.trim();
                      if (!trimmed) return 'Câu trả lời không được để trống';
                      return true;
                    }
                  })}
                  rows={8}
                  className={`resize-none ${
                    errors.answer 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  placeholder="Nhập câu trả lời chi tiết..."
                  disabled={isUpdating}
                />
                {errors.answer && (
                  <p className="text-sm text-red-600">
                    {errors.answer.message}
                  </p>
                )}
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Gõ câu trả lời chi tiết và hữu ích cho người dùng</span>
                  <span>{answerValue?.length || 0} ký tự</span>
                </div>
              </div>

              {/* {answerValue && answerValue.trim() && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 font-medium mb-2">Xem trước câu trả lời:</p>
                  <div className="bg-white border border-blue-100 rounded p-3">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                      {answerValue.trim()}
                    </p>
                  </div>
                </div>
              )} */}

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isUpdating}
                  className="w-full sm:w-auto order-2 sm:order-1"
                >
                  Hủy
                </Button>
                <Button 
                  type="submit" 
                  disabled={isUpdating || !isValid}
                  className="w-full sm:w-auto order-1 sm:order-2"
                >
                  {isUpdating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Lưu thay đổi
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};