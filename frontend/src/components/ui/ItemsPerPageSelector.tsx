import React from "react"

interface ItemsPerPageSelectorProps {
  itemsPerPage: number
  onItemsPerPageChange: (value: number) => void
}

export const ItemsPerPageSelector: React.FC<ItemsPerPageSelectorProps> = ({
  itemsPerPage,
  onItemsPerPageChange,
}) => {
  return (
    <div className="flex items-center text-sm text-gray-700 gap-1">
      <span>Hiển thị:</span>
      <select
        value={itemsPerPage}
        onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
        className="border rounded px-2 py-1 text-sm bg-white"
      >
        <option value={3}>3</option>
        <option value={5}>5</option>
        <option value={10}>10</option>
        <option value={20}>20</option>
      </select>
      <span>/ trang</span>
    </div>
  )
}
