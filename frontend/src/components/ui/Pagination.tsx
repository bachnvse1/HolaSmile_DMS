import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from './button';
import { ItemsPerPageSelector } from './ItemsPerPageSelector';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
  onItemsPerPageChange?: (value: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  onItemsPerPageChange,
  className = ''
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show smart pagination
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      // Add ellipsis at the beginning if needed
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) {
          pages.push('...');
        }
      }
      
      // Add visible pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis at the end if needed
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push('...');
        }
        pages.push(totalPages);
      }
    }
    
    return pages;
  };
  if (totalItems === 0) {
    return null;
  }
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${className}`}>
      {/* Left side: Items info and items per page selector */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="text-sm text-gray-700">
          Hiển thị <span className="font-medium">{startItem}</span> đến{' '}
          <span className="font-medium">{endItem}</span> trong tổng số{' '}
          <span className="font-medium">{totalItems}</span> kết quả
        </div>
        
        {/* Items per page selector */}
        {onItemsPerPageChange && (
          <ItemsPerPageSelector
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={onItemsPerPageChange}
          />
        )}
      </div>
      <div className="flex items-center space-x-2">
        {totalPages > 1 && (
          <>
            {/* First page */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
              title="Trang đầu"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>

            {/* Previous page */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
              title="Trang trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Page numbers */}
            <div className="flex items-center space-x-1">
              {generatePageNumbers().map((page, index) => (
                <React.Fragment key={index}>
                  {page === '...' ? (
                    <span className="px-2 py-1 text-gray-500">...</span>
                  ) : (
                    <Button
                      variant={page === currentPage ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onPageChange(page as number)}
                      className="h-8 min-w-[32px] px-2"
                    >
                      {page}
                    </Button>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Next page */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
              title="Trang sau"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Last page */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
              title="Trang cuối"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </>
        )}        {/* Show single page indicator when only 1 page */}
        {totalPages === 1 && (
          <div className="flex items-center text-sm text-gray-600">
            <span>Trang 1 / 1</span>
          </div>
        )}
      </div>
    </div>
  );
};