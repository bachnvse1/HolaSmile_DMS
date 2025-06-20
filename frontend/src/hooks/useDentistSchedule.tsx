import { useMemo } from 'react';
import { useDentistSchedules } from './useDentistSchedules';
import { convertDentistSchedule } from '../utils/convertDentistSchedule';
import type { Dentist } from '../types/appointment';
import doc1 from '../assets/doc1.jpg';

const DENTIST_INFO = {
  1: { specialty: 'Nha khoa thẩm mỹ', experience: '15+ năm', rating: 4.9 },
  2: { specialty: 'Phẫu thuật răng miệng', experience: '12+ năm', rating: 4.8 },
  3: { specialty: 'Nha khoa trẻ em', experience: '10+ năm', rating: 4.9 },
  4: { specialty: 'Chỉnh nha', experience: '8+ năm', rating: 4.7 },
};

const AVATARS = [
  doc1,
  doc1,
  doc1,
  doc1,
];

export const useDentistSchedule = () => {
  const { data: dentistSchedules, isLoading: loading, error } = useDentistSchedules();

  const dentists = useMemo((): Dentist[] => {
    if (!dentistSchedules || dentistSchedules.length === 0) {
      return [];
    }

    return dentistSchedules.map((dentist, idx) => {
      const dentistInfo = DENTIST_INFO[dentist.dentistID as keyof typeof DENTIST_INFO] || {
        specialty: 'Nha khoa tổng quát',
        experience: '10+ năm',
        rating: 4.8
      };

      return {
        id: String(dentist.dentistID),
        dentistID: dentist.dentistID,
        name: dentist.dentistName,
        avatar: AVATARS[idx % AVATARS.length],
        specialty: dentistInfo.specialty,
        experience: dentistInfo.experience,
        rating: dentistInfo.rating,
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