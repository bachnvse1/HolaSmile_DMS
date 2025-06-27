import * as React from "react"
import { DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"
import "react-day-picker/dist/style.css"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

export function Calendar({ className, ...props }: CalendarProps) {
  return (
    <DayPicker
      className={cn("p-3 bg-white rounded-md", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button:
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-gray-500 rounded-md w-9 font-normal text-[0.8rem] overflow-hidden",
        row: "flex w-full mt-2",
        cell: "text-center text-sm p-1 w-9 relative focus-within:relative focus-within:z-20",
        day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100",
        day_selected:
          "bg-blue-600 text-white hover:bg-blue-600",
        day_today: "bg-gray-100 text-gray-900",
        day_outside: "text-gray-300",
        day_disabled: "text-gray-400 opacity-50",
        day_range_middle: "aria-selected:bg-gray-200 aria-selected:text-black",
        day_hidden: "invisible",
      }}
      {...props}
    />
  )
}
