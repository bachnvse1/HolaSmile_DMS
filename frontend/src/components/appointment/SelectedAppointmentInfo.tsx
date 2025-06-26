import React from 'react';
import { CheckCircle } from 'lucide-react';
import type { Dentist, TimeSlot } from '../../types/appointment';

interface SelectedAppointmentInfoProps {
  selectedDentist: Dentist;
  selectedDate: string;
  selectedTimeSlot: string;
  timeSlotsWithIcons: TimeSlot[];
}

export const SelectedAppointmentInfo: React.FC<SelectedAppointmentInfoProps> = ({
  selectedDentist,
  selectedDate,
  selectedTimeSlot,
  timeSlotsWithIcons,
}) => {
  return (
    <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
      <h4 className="font-bold text-blue-900 mb-4 flex items-center">
        <CheckCircle className="h-5 w-5 mr-2" />
        Thông tin đã chọn:
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-blue-100">
          <span className="text-sm font-medium text-gray-600">Bác sĩ:</span>
          <p className="font-semibold text-gray-900">{selectedDentist.name}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-blue-100">
          <span className="text-sm font-medium text-gray-600">Ngày:</span>
          <p className="font-semibold text-gray-900">{new Date(selectedDate).toLocaleDateString('vi-VN')}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-blue-100">
          <span className="text-sm font-medium text-gray-600">Ca làm việc:</span>
          <p className="font-semibold text-gray-900">
            {timeSlotsWithIcons.find(slot => slot.period === selectedTimeSlot)?.label}
            ({timeSlotsWithIcons.find(slot => slot.period === selectedTimeSlot)?.timeRange})
          </p>
        </div>
      </div>
    </div>
  );
};