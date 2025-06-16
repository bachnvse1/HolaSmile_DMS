import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type {AppointmentFormData} from '../lib/validations/appointment';
import { appointmentFormSchema } from '../lib/validations/appointment';

import type { Doctor, AppointmentData } from '@/types/appointment';

export const useAppointmentForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [step1Data, setStep1Data] = useState<AppointmentFormData | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [currentWeek, setCurrentWeek] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentFormSchema),
    mode: 'onChange'
  });

  const onStep1Submit = (data: AppointmentFormData) => {
    setStep1Data(data);
    setCurrentStep(2);
  };

  const onFinalSubmit = () => {
    if (!step1Data || !selectedDoctor) return;

    const appointmentData: AppointmentData = {
      ...step1Data,
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      appointmentDate: selectedDate,
      timeSlot: selectedTimeSlot
    };
    
    console.log('Final Appointment Data:', appointmentData);
    setIsSubmitted(true);
  };

  const resetForm = () => {
    setCurrentStep(1);
    setStep1Data(null);
    setSelectedDoctor(null);
    setSelectedDate('');
    setSelectedTimeSlot('');
    setCurrentWeek(0);
    setIsSubmitted(false);
    form.reset();
  };

  const selectDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setSelectedDate('');
    setSelectedTimeSlot('');
  };

  const goToPreviousWeek = () => {
    if (currentWeek > 0) {
      setCurrentWeek(0);
    }
  };

  const goToNextWeek = () => {
    if (currentWeek < 1) {
      setCurrentWeek(1);
    }
  };

  return {
    // State
    currentStep,
    step1Data,
    selectedDoctor,
    selectedDate,
    selectedTimeSlot,
    currentWeek,
    isSubmitted,
    form,
    
    // Actions
    setCurrentStep,
    setSelectedDate,
    setSelectedTimeSlot,
    onStep1Submit,
    onFinalSubmit,
    resetForm,
    selectDoctor,
    goToPreviousWeek,
    goToNextWeek,
  };
};