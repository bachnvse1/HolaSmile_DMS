import React from 'react';
import { CheckCircle } from 'lucide-react';
import type { Dentist } from '../../types/appointment';

interface DentistCardProps {
  dentist: Dentist;
  isSelected: boolean;
  onSelect: (dentist: Dentist) => void;
}

export const DentistCard: React.FC<DentistCardProps> = ({ dentist, isSelected, onSelect }) => {
  return (
    <div
      onClick={() => onSelect(dentist)}
      className={`group cursor-pointer bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border-2 transition-all transform hover:scale-105 hover:shadow-lg ${
        isSelected
          ? 'border-blue-500 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50'
          : 'border-gray-200 hover:border-blue-300'
      }`}
    >
      <div className="text-center">
        <div className="relative mb-4">
          <img
            src={dentist.avatar}
            alt={dentist.name}
            className="w-20 h-20 rounded-full mx-auto object-cover border-4 border-white shadow-lg"
          />
          {isSelected && (
            <div className="absolute -top-1 -right-1 bg-blue-600 text-white rounded-full p-1">
              <CheckCircle className="h-4 w-4" />
            </div>
          )}
        </div>
        <h4 className="font-bold text-gray-900 mb-1">{dentist.name}</h4>
      </div>
    </div>
  );
};