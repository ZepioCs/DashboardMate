import * as React from 'react'
import { Clock } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '../../lib/utils'
import { Button } from './button'
import { Input } from './input'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { ScrollArea } from './scroll-area'

interface TimePickerProps {
  date?: Date
  onSelect?: (date?: Date) => void
}

export function TimePicker({ date, onSelect }: TimePickerProps): JSX.Element {
  const [selectedTime, setSelectedTime] = React.useState<string>(date ? format(date, 'HH:mm') : '')

  // Generate time slots every 30 minutes
  const timeSlots = React.useMemo(() => {
    const slots: string[] = []
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`)
      }
    }
    return slots
  }, [])

  const handleTimeClick = (time: string): void => {
    setSelectedTime(time)
    if (onSelect && date) {
      const [hours, minutes] = time.split(':')
      const newDate = new Date(date)
      newDate.setHours(parseInt(hours), parseInt(minutes))
      onSelect(newDate)
    }
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const time = e.target.value
    setSelectedTime(time)
    if (onSelect && date && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
      const [hours, minutes] = time.split(':')
      const newDate = new Date(date)
      newDate.setHours(parseInt(hours), parseInt(minutes))
      onSelect(newDate)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground'
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {selectedTime ? selectedTime : <span>Pick a time</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0">
        <div className="p-3">
          <Input type="time" value={selectedTime} onChange={handleTimeChange} className="mb-3" />
          <ScrollArea className="h-[300px]">
            <div className="grid grid-cols-3 gap-2 pr-4">
              {timeSlots.map((time) => (
                <Button
                  key={time}
                  variant={time === selectedTime ? 'default' : 'outline'}
                  className="text-xs"
                  onClick={() => handleTimeClick(time)}
                >
                  {time}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  )
}
