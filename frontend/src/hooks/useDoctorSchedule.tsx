import { useMemo } from 'react';
import { DOCTORS_BASE } from '../constants/appointment';
import { generateDoctorSchedule } from '../utils/schedule';
import type { Doctor } from '../types/appointment';

export const useDoctorSchedule = () => {
  const doctorsWithSchedule = useMemo((): Doctor[] => {
    return DOCTORS_BASE.map(doctor => ({
      ...doctor,
      schedule: generateDoctorSchedule()
    }));
  }, []);

  return {
    doctors: doctorsWithSchedule
  };
};