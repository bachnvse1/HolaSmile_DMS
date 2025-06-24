import React from 'react';

interface ItemsPerPageSelectorProps {
  itemsPerPage: number;
  onItemsPerPageChange: (value: number) => void;
  options?: number[];
  className?: string;
}

export const ItemsPerPageSelector: React.FC<ItemsPerPageSelectorProps> = ({
  itemsPerPage,
  onItemsPerPageChange,
  options = [5, 10, 15, 20, 50],
  className = ''
}) => {
  return (
    <div className={`flex items-center space-x-2 text-sm ${className}`}>
      <span className="text-gray-600">Hiển thị:</span>      <select
        value={itemsPerPage}
        onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
        className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        title="Chọn số items trên mỗi trang"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span className="text-gray-600">/ trang</span>
    </div>
  );
};