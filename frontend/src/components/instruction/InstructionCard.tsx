import React, { useEffect, useState } from 'react';
import { FileText, Plus, Edit as EditIcon, Eye } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../hooks/useAuth';
import { getPatientInstructions } from '../../services/instructionService';
import { formatDateVN } from '../../utils/dateUtils';
import { InstructionModal } from './InstructionModal.tsx';
import type { InstructionDTO } from '../../services/instructionService';

interface InstructionCardProps {
  appointmentId: number;
  appointmentStatus: 'confirmed' | 'canceled' | 'attended' | 'absented';
}

export const InstructionCard: React.FC<InstructionCardProps> = ({
  appointmentId,
  appointmentStatus
}) => {
  const [instruction, setInstruction] = useState<InstructionDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showInstructionModal, setShowInstructionModal] = useState(false);
  const { role } = useAuth();
  
  const isDentist = role === 'Dentist';

  const fetchInstruction = async () => {
    setIsLoading(true);
    try {
      const instructions = await getPatientInstructions(appointmentId);
      setInstruction(instructions.length > 0 ? instructions[0] : null);
    } catch (error) {
      console.error('Error fetching instruction:', error);
      setInstruction(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInstruction();
  }, [appointmentId]);

  const refreshInstructionData = () => {
    fetchInstruction();
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-fit">
        <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-lg text-gray-900">Chỉ dẫn bệnh nhân</h3>
          {isDentist && appointmentStatus !== "canceled" && (
            <Button
              variant={instruction ? "outline" : "default"}
              size="sm"
              onClick={() => setShowInstructionModal(true)}
              className="flex items-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  <span>Đang tải...</span>
                </>
              ) : instruction ? (
                <>
                  <EditIcon className="h-4 w-4" />
                  <span>Chỉnh sửa</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Thêm chỉ dẫn</span>
                </>
              )}
            </Button>
          )}
          {!isDentist && instruction && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInstructionModal(true)}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              <span>Xem chi tiết</span>
            </Button>
          )}
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600 text-sm">Đang tải chỉ dẫn...</p>
              </div>
            </div>
          ) : instruction ? (
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto">
                <p className="text-gray-900 whitespace-pre-wrap text-sm leading-relaxed">
                  {instruction.content}
                </p>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Tạo bởi: {instruction.dentistName}</span>
                <span>Ngày tạo: {formatDateVN(instruction.createdAt)}</span>
              </div>
              {instruction.instruc_TemplateName && (
                <div className="text-xs text-gray-500">
                  Mẫu: {instruction.instruc_TemplateName}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48">
              <div className="text-center text-gray-500">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-base font-medium">Chưa có chỉ dẫn</p>
                <p className="text-sm">Chưa có chỉ dẫn cho lịch hẹn này</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showInstructionModal && (
        <InstructionModal
          appointmentId={appointmentId}
          existingInstruction={instruction}
          isOpen={showInstructionModal}
          onClose={() => setShowInstructionModal(false)}
          onSuccess={() => {
            setShowInstructionModal(false);
            refreshInstructionData();
          }}
        />
      )}
    </>
  );
};