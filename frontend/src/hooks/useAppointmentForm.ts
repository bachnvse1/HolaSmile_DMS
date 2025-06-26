import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { AppointmentFormData } from '../types/appointment'
import { appointmentFormSchema } from '../lib/validations/appointment'
import type { Dentist } from '../types/appointment'

export const useAppointmentForm = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const [step1Data, setStep1Data] = useState<AppointmentFormData | null>(null)
  const [selectedDentist, setSelectedDentist] = useState<Dentist | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('')
  const [currentWeek, setCurrentWeek] = useState(0)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentFormSchema),
    mode: 'onChange'
  })

  const onStep1Submit = (data: AppointmentFormData) => {
    setStep1Data(data)
    setCurrentStep(2)
  }

  const resetForm = () => {
    setCurrentStep(1)
    setStep1Data(null)
    setSelectedDentist(null)
    setSelectedDate('')
    setSelectedTimeSlot('')
    setCurrentWeek(0)
    setIsSubmitted(false)
    form.reset()
  }

  const selectDentist = (dentist: Dentist) => {
    setSelectedDentist(dentist)
    setSelectedDate('')
    setSelectedTimeSlot('')
  }

  const goToPreviousWeek = () => {
    if (currentWeek > 0) setCurrentWeek(0)
  }

  const goToNextWeek = () => {
    if (currentWeek < 1) setCurrentWeek(1)
  }

  return {
    currentStep,
    step1Data,
    selectedDentist,
    selectedDate,
    selectedTimeSlot,
    currentWeek,
    isSubmitted,
    form,
    setCurrentStep,
    setSelectedDate,
    setSelectedTimeSlot,
    onStep1Submit,
    resetForm,
    selectDentist,
    goToPreviousWeek,
    goToNextWeek,
    setIsSubmitted,
  }
}