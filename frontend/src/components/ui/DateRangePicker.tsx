import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

interface DateRangePickerProps {
  selectedMonth: number;
  selectedYear: number;
  onDateChange: (year: number, month: number) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  selectedMonth,
  selectedYear,
  onDateChange
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const months = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  const handleMonthSelect = (monthIndex: number) => {
    onDateChange(selectedYear, monthIndex);
    setIsOpen(false);
  };

  const handleYearSelect = (year: number) => {
    onDateChange(year, selectedMonth);
    setIsOpen(false);
  };

  const formatDisplayText = () => {
    return `${months[selectedMonth]} ${selectedYear}`;
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 min-w-[140px]"
      >
        <Calendar className="h-4 w-4" />
        <span>{formatDisplayText()}</span>
        <ChevronDown className="h-4 w-4" />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <Card className="absolute top-full mt-2 right-0 z-20 w-64 shadow-lg">
            <CardContent className="p-4">
              <div className="space-y-4">
                {/* Year Selection */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Năm</h3>
                  <div className="grid grid-cols-5 gap-1">
                    {years.map((year) => (
                      <button
                        key={year}
                        onClick={() => handleYearSelect(year)}
                        className={`px-2 py-1 text-xs rounded hover:bg-gray-100 transition-colors ${
                          year === selectedYear 
                            ? 'bg-blue-100 text-blue-700 font-medium' 
                            : 'text-gray-600'
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Month Selection */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Tháng</h3>
                  <div className="grid grid-cols-3 gap-1">
                    {months.map((month, index) => (
                      <button
                        key={index}
                        onClick={() => handleMonthSelect(index)}
                        className={`px-2 py-1 text-xs rounded hover:bg-gray-100 transition-colors ${
                          index === selectedMonth 
                            ? 'bg-blue-100 text-blue-700 font-medium' 
                            : 'text-gray-600'
                        }`}
                      >
                        {month}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="border-t pt-3">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Nhanh chóng</h3>
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        const now = new Date();
                        handleMonthSelect(now.getMonth());
                        onDateChange(now.getFullYear(), now.getMonth());
                      }}
                      className="w-full text-left px-2 py-1 text-xs rounded hover:bg-gray-100 text-gray-600"
                    >
                      Tháng này
                    </button>
                    <button
                      onClick={() => {
                        const nextMonth = new Date();
                        nextMonth.setMonth(nextMonth.getMonth() + 1);
                        handleMonthSelect(nextMonth.getMonth());
                        onDateChange(nextMonth.getFullYear(), nextMonth.getMonth());
                      }}
                      className="w-full text-left px-2 py-1 text-xs rounded hover:bg-gray-100 text-gray-600"
                    >
                      Tháng sau
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};