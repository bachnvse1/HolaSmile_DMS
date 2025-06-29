import React, { useState } from "react";
import { X } from "lucide-react";
import { DentistSelector } from "../appointment/DentistSelector"; 
import { ScheduleCalendar } from "../appointment"; 
import type { Dentist } from "@/types/appointment";

interface SelectDentistModalProps {
  isOpen: boolean;
  onClose: () => void;
  dentists: Dentist[];
  selectedDentist: Dentist | null;
  onConfirm: (dentist: Dentist, date: string, slot: string) => void;
}

export const SelectDentistModal: React.FC<SelectDentistModalProps> = ({
  isOpen,
  onClose,
  dentists,
  selectedDentist,
  onConfirm,
}) => {
  const [dentist, setDentist] = useState<Dentist | null>(selectedDentist);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [week, setWeek] = useState(0);

  const handleDateSelect = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
  };

  const handleSubmit = () => {
    if (dentist && selectedDate && selectedTime) {
      onConfirm(dentist, selectedDate, selectedTime);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Chọn Bác Sĩ & Lịch Làm Việc</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <DentistSelector
          dentists={dentists}
          selectedDentist={dentist}
          onSelect={setDentist}
        />

        {dentist && (
          <ScheduleCalendar
            dentist={dentist}
            currentWeek={week}
            selectedDate={selectedDate}
            selectedTimeSlot={selectedTime}
            onDateSelect={handleDateSelect}
            onPreviousWeek={() => setWeek((w) => Math.max(0, w - 1))}
            onNextWeek={() => setWeek((w) => Math.min(1, w + 1))}
            mode="book"
            canBookAppointment
          />
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 border rounded-md text-gray-700">Huỷ</button>
          <button
            onClick={handleSubmit}
            disabled={!dentist || !selectedDate || !selectedTime}
            className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
};
