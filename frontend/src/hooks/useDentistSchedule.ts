import { useMemo } from 'react';
import { useDentistSchedules } from './useDentistSchedules';
import { mapBackendScheduleToFrontend } from '../utils/schedule';
import type { Dentist } from '../types/appointment';


export const useDentistSchedule = (): {
  dentists: Dentist[];
  isLoading: boolean;
  error: unknown;
} => {
  const { data: backendData, isLoading, error } = useDentistSchedules();
  
  const dentists = useMemo(() => {
    try {  
      if (!backendData) {
        return [];
      }
      return mapBackendScheduleToFrontend(backendData);
    } catch (err) {
      console.error('Error converting dentist schedules:', err);
      return [];
    }
  }, [backendData]);
  
  return { dentists, isLoading, error };
};