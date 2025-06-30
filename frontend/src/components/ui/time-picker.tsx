import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface TimePickerProps {
  date?: Date
  setDate: (date: Date | undefined) => void
  disabled?: boolean
  className?: string
}

export function TimePicker({ date, setDate, disabled, className }: TimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const currentHour = date ? date.getHours().toString().padStart(2, "0") : "09"
  const currentMinute = date ? date.getMinutes().toString().padStart(2, "0") : "00"

  const handleTimeChange = (hour: string, minute: string) => {
    try {
      const newDate = date ? new Date(date) : new Date()
      const hourNum = Number.parseInt(hour, 10)
      const minuteNum = Number.parseInt(minute, 10)

      if (hourNum >= 0 && hourNum <= 23 && minuteNum >= 0 && minuteNum <= 59) {
        newDate.setHours(hourNum)
        newDate.setMinutes(minuteNum)
        newDate.setSeconds(0)
        newDate.setMilliseconds(0)
        setDate(newDate)
      }
    } catch (error) {
      console.error("Error setting time:", error)
    }
  }

  const handleInputChange = (value: string, type: "hour" | "minute") => {
    const numValue = Number.parseInt(value, 10)
    if (isNaN(numValue)) return

    if (type === "hour" && numValue >= 0 && numValue <= 23) {
      handleTimeChange(value.padStart(2, "0"), currentMinute)
    } else if (type === "minute" && numValue >= 0 && numValue <= 59) {
      handleTimeChange(currentHour, value.padStart(2, "0"))
    }
  }

  const setCurrentTime = () => {
    const now = new Date()
    handleTimeChange(
      now.getHours().toString().padStart(2, "0"),
      now.getMinutes().toString().padStart(2, "0")
    )
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground", className)}
        >
          <Clock className="mr-2 h-4 w-4" />
          {date ? `${currentHour}:${currentMinute}` : "Chọn giờ"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-start gap-4">
            <div className="flex flex-col items-center">
              <Label htmlFor="hour-input" className="text-sm font-medium mb-1">Giờ</Label>
              <Input
                id="hour-input"
                type="number"
                min="0"
                max="23"
                value={Number.parseInt(currentHour, 10)}
                onChange={(e) => handleInputChange(e.target.value, "hour")}
                className="text-center w-16"
                maxLength={2}
              />
            </div>

            <div className="text-2xl font-bold pt-6">:</div>

            <div className="flex flex-col items-center">
              <Label htmlFor="minute-input" className="text-sm font-medium mb-1">Phút</Label>
              <Input
                id="minute-input"
                type="number"
                min="0"
                max="59"
                step="5"
                value={Number.parseInt(currentMinute, 10)}
                onChange={(e) => handleInputChange(e.target.value, "minute")}
                className="text-center w-16"
                maxLength={2}
              />
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="outline" size="sm" onClick={setCurrentTime}>
              Bây giờ
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
              Xong
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
