import React, { useState } from "react";
import { DentistScheduleViewer } from "./DentistScheduleViewer";
import { toast } from "react-toastify";
import axiosInstance from "@/lib/axios";
import type { Dentist } from "@/types/appointment";
import { ArrowLeft, Calendar } from "lucide-react";
import { useNavigate } from "react-router";
import { getErrorMessage } from "@/utils/formatUtils";
interface FUAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: number;
}

export const FUAppointmentModal: React.FC<FUAppointmentModalProps> = ({
  isOpen,
  onClose,
  patientId,
}) => {
  const [selectedDentist, setSelectedDentist] = useState<Dentist | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [reason, setReason] = useState("");
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleBookFUAppointment = async () => {
    try {
      let timeString = "08:00:00";
      if (selectedTimeSlot === "afternoon") timeString = "14:00:00";
      if (selectedTimeSlot === "evening") timeString = "17:00:00";

      await axiosInstance.post("/appointment/FUappointment", {
        patientId,
        dentistId: selectedDentist?.dentistID,
        appointmentDate: selectedDate,
        appointmentTime: timeString,
        reasonForFollowUp: reason,
      });
      toast.success("Tạo lịch tái khám thành công!");
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error)|| "Có lỗi xảy ra!");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-3xl min-h-[80vh]">
      <div className="flex">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center border border-gray-300 px-2 py-2 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all"
          title="Quay lại"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-1 ml-1"><Calendar className='w-5 h-5'></Calendar>Tạo lịch tái khám</h2>
      </div>

      <DentistScheduleViewer
        mode="book"
        prefilledData={{}}
        patientId={patientId}
        onChange={({ dentist, date, slot }) => {
          setSelectedDentist(dentist);
          setSelectedDate(date);
          setSelectedTimeSlot(slot);
        }}
        onSubmit={handleBookFUAppointment}
      />
    </div>
  );
};
