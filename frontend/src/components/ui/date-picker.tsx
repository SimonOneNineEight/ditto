"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  id?: string
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  "aria-invalid"?: boolean
  "aria-describedby"?: string
}

function DatePicker({ id, value, onChange, placeholder = "Select date...", className, disabled, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedby }: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className={cn("relative", className)}>
      <Popover open={disabled ? false : open} onOpenChange={disabled ? undefined : setOpen}>
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            disabled={disabled}
            aria-label={value ? `Date: ${format(value, "MMMM d, yyyy")}. Change date` : placeholder}
            aria-invalid={ariaInvalid}
            aria-describedby={ariaDescribedby}
            className={cn(
              "flex w-full items-center justify-between border-b border-border px-0 py-1 font-normal text-sm bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm",
              !value && "text-muted-foreground",
              disabled && "opacity-50 cursor-not-allowed",
            )}
          >
            <span>
              {value ? format(value, "MMM d, yyyy") : placeholder}
            </span>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(date) => {
              onChange?.(date)
              setOpen(false)
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

export { DatePicker }
