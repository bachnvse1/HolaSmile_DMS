import React from 'react';

interface CheckboxProps {
  id?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  'aria-label'?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ 
  id, 
  checked = false, 
  onCheckedChange, 
  className = '',
  'aria-label': ariaLabel
}) => {
  return (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${className}`}
      aria-label={ariaLabel}
    />
  );
};