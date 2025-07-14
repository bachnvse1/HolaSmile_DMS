import React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"

interface ItemsPerPageSelectorProps {
  itemsPerPage: number
  onItemsPerPageChange: (value: number) => void
}

export const ItemsPerPageSelector: React.FC<ItemsPerPageSelectorProps> = ({
  itemsPerPage,
  onItemsPerPageChange,
}) => {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-700 whitespace-nowrap">Hiển thị</span>
      <Select
        value={itemsPerPage.toString()}
        onValueChange={(value) => onItemsPerPageChange(Number(value))}
      >
        <SelectTrigger className="h-8 w-[70px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="5">5</SelectItem>
          <SelectItem value="10">10</SelectItem>
          <SelectItem value="20">20</SelectItem>
          <SelectItem value="50">50</SelectItem>
        </SelectContent>
      </Select>
      <span className="text-sm text-gray-700 whitespace-nowrap">mục</span>
    </div>
  )
}
