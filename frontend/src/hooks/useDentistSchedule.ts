import { useMemo } from 'react';
import { useDentistSchedules } from './useDentistSchedules';
import { convertDentistSchedule } from '../utils/convertDentistSchedule';
import type { Dentist } from '../types/appointment';
import doc1 from '../assets/doc1.jpg';

export const useDentistSchedule = () => {
  const { data: dentistSchedules, isLoading: loading, error } = useDentistSchedules();

  const dentists = useMemo((): Dentist[] => {
    if (!dentistSchedules || dentistSchedules.length === 0) {
      return [];
    }

    return dentistSchedules.map((dentist,) => {

      return {
        id: String(dentist.dentistID),
        dentistID: dentist.dentistID,
        name: dentist.dentistName,
        avatar: dentist.avatar || doc1,
        schedule: convertDentistSchedule(dentist.schedules),
        backendSchedules: dentist.schedules, // Lưu lại để lấy scheduleId
      };
    });
  }, [dentistSchedules]);

  return {
    dentists,
    loading,
    error
  };
};