import { Button } from './button'
import { DatePicker } from './date-picker'
import { TimePicker } from './time-picker'
import { Clock } from 'lucide-react'

interface DateTimePickerProps {
  date?: Date
  onSelect?: (date?: Date) => void
}

export function DateTimePicker({ date, onSelect }: DateTimePickerProps): JSX.Element {
  const handleDateSelect = (newDate?: Date): void => {
    if (newDate && date) {
      // Preserve the time when changing date
      newDate.setHours(date.getHours(), date.getMinutes())
    }
    onSelect?.(newDate)
  }

  const handleTimeSelect = (newDate?: Date): void => {
    onSelect?.(newDate)
  }

  const handleSetNow = (e: React.MouseEvent): void => {
    e.preventDefault()
    const now = new Date()
    // Create a new date object to avoid modifying the original
    const newDate = date ? new Date(date) : new Date()
    // Set both date and time components
    newDate.setFullYear(now.getFullYear(), now.getMonth(), now.getDate())
    newDate.setHours(now.getHours(), now.getMinutes(), 0, 0)
    onSelect?.(newDate)
  }

  return (
    <div className="grid gap-2">
      <div className="flex gap-2">
        <DatePicker date={date} onSelect={handleDateSelect} />
        <TimePicker date={date} onSelect={handleTimeSelect} />
        <Button
          type="button"
          variant="outline"
          className="shrink-0"
          onClick={handleSetNow}
          title="Set to current date and time"
        >
          <Clock className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
