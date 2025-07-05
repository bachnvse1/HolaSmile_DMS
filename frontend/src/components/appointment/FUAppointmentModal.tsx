import React, { useState } from "react";
import { DentistScheduleViewer } from "./DentistScheduleViewer";
import { toast } from "react-toastify";
import axiosInstance from "@/lib/axios";
import type { Dentist } from "@/types/appointment";

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
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Có lỗi xảy ra!");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-3xl min-h-[80vh]">
      <h2 className="text-xl font-bold mb-4">Tạo lịch tái khám</h2>
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
