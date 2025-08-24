import React from 'react';
import { Award } from 'lucide-react';
import { DentistCard } from './DentistCard';
import type { Dentist } from '../../types/appointment';

interface DentistSelectorProps {
  dentists: Dentist[];
  selectedDentist: Dentist | null;
  onSelect: (dentist: Dentist) => void;
}

export const DentistSelector: React.FC<DentistSelectorProps> = ({ 
  dentists, 
  selectedDentist, 
  onSelect 
}) => {
  return (
    <div className="mb-10">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <Award className="h-6 w-6 mr-2 text-blue-600" />
        Chọn Nha sĩ
      </h3>
      {dentists.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Không có Nha sĩ nào khả dụng</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dentists.map((dentist) => (
            <DentistCard
              key={dentist.id}
              dentist={dentist}
              isSelected={selectedDentist?.id === dentist.id}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};