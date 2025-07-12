"use client"

import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { vi } from 'date-fns/locale'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/new-calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date
  onChange: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  disabledDates?: (date: Date) => boolean
}

export function DatePicker({
  date,
  onChange,
  placeholder = "Chọn ngày",
  className,
  disabled = false,
  disabledDates
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          disabled={disabled}
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal border border-gray-300 hover:border-gray-400",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "dd/MM/yyyy") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2 rounded-md border border-gray-300 shadow-md" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onChange}
          initialFocus
          locale={vi}
          disabled={disabledDates}
          captionLayout="dropdown"
          fromMonth={new Date(2000, 0)}
          toMonth={new Date(2040, 11)}
          classNames={{
            caption: "flex justify-center pt-1 relative items-center px-4 mb-2",
            caption_label: "text-sm font-medium",
            dropdown_month: "bg-white border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mr-2",
            dropdown_year: "bg-white border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            dropdown_icon: "text-gray-500 ml-auto",
            table: "w-full border-separate border-spacing-1 my-2",
            head_row: "flex",
            head_cell: "text-gray-500 w-9 h-9 font-medium text-[0.8rem]",
            row: "flex w-full mt-1",
            cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-blue-50",
            day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md hover:bg-gray-100",
            day_selected: "bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700 hover:text-white focus:text-white rounded-md",
            day_today: "bg-gray-100 text-gray-900 font-medium",
            day_outside: "text-gray-400 opacity-50",
            day_disabled: "text-gray-400 opacity-50 line-through",
            day_hidden: "invisible",
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

interface DateRangePickerProps {
  dateRange: {
    from: Date | undefined
    to: Date | undefined
  }
  onDateRangeChange: (range: { from: Date | undefined; to: Date | undefined }) => void
  fromPlaceholder?: string
  toPlaceholder?: string
  className?: string
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  fromPlaceholder = "Từ ngày",
  toPlaceholder = "Đến ngày",
  className
}: DateRangePickerProps) {
  return (
    <div className={cn("flex gap-2", className)}>
      <DatePicker
        date={dateRange.from}
        onChange={(date) => onDateRangeChange({ ...dateRange, from: date })}
        placeholder={fromPlaceholder}
        className="flex-1"
      />
      <DatePicker
        date={dateRange.to}
        onChange={(date) => onDateRangeChange({ ...dateRange, to: date })}
        placeholder={toPlaceholder}
        disabledDates={(date) => dateRange.from ? date < dateRange.from : false}
        className="flex-1"
      />
    </div>
  )
}