import React from 'react';
import { useForm } from 'react-hook-form';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface CreateKnowledgeFormData {
  question: string;
  answer: string;
}

interface ChatbotCreateModalProps {
  isCreating: boolean;
  onSave: (data: { question: string; answer: string }) => Promise<void>;
  onCancel: () => void;
}

export const ChatbotCreateModal: React.FC<ChatbotCreateModalProps> = ({
  isCreating,
  onSave,
  onCancel
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    reset
  } = useForm<CreateKnowledgeFormData>({
    defaultValues: {
      question: '',
      answer: ''
    },
    mode: 'onChange'
  });

  const questionValue = watch('question');
  const answerValue = watch('answer');

  const onSubmit = async (data: CreateKnowledgeFormData) => {
    try {
      await onSave({
        question: data.question.trim(),
        answer: data.answer.trim()
      });
      reset();
      onCancel();
    } catch (error) {
      console.log(error)
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
                  Thêm Kiến Thức Mới
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onCancel}
                  disabled={isCreating}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Câu hỏi: <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  {...register('question', {
                    required: 'Câu hỏi không được để trống',
                    minLength: {
                      value: 5,
                      message: 'Câu hỏi phải có ít nhất 5 ký tự'
                    },
                    validate: (value) => {
                      const trimmed = value.trim();
                      if (!trimmed) return 'Câu hỏi không được để trống';
                      return true;
                    }
                  })}
                  rows={4}
                  className={`resize-none ${
                    errors.question 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  placeholder="Nhập câu hỏi người dùng có thể hỏi..."
                  disabled={isCreating}
                />
                {errors.question && (
                  <p className="text-sm text-red-600">
                    {errors.question.message}
                  </p>
                )}
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Nhập câu hỏi rõ ràng và cụ thể</span>
                  <span>{questionValue?.length || 0} ký tự</span>
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
                  placeholder="Nhập câu trả lời chi tiết và hữu ích..."
                  disabled={isCreating}
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

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isCreating}
                  className="w-full sm:w-auto order-2 sm:order-1"
                >
                  Hủy
                </Button>
                <Button 
                  type="submit" 
                  disabled={isCreating || !isValid}
                  className="w-full sm:w-auto order-1 sm:order-2"
                >
                  {isCreating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Tạo mới
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