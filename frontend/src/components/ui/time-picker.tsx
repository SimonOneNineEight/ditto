"use client"

import * as React from "react"
import { Clock3 } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
const MINUTES = [0, 15, 30, 45]

function parse24h(value: string): { hour: number; minute: number; period: "AM" | "PM" } {
  const [h, m] = value.split(":").map(Number)
  const period: "AM" | "PM" = h >= 12 ? "PM" : "AM"
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h
  return { hour, minute: m, period }
}

function to24h(hour: number, minute: number, period: "AM" | "PM"): string {
  let h = hour
  if (period === "AM" && hour === 12) h = 0
  else if (period === "PM" && hour !== 12) h = hour + 12
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

function formatDisplay(hour: number, minute: number, period: "AM" | "PM"): string {
  return `${hour}:${String(minute).padStart(2, "0")} ${period}`
}

interface TimePickerProps {
  id?: string
  value?: string
  onChange?: (time: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  "aria-invalid"?: boolean
  "aria-describedby"?: string
}

function TimePicker({ id, value, onChange, placeholder = "Select time...", className, disabled, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedby }: TimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const clickedRef = React.useRef({ hour: false, minute: false, period: false })

  const parsed = value ? parse24h(value) : null
  const selectedHour = parsed?.hour ?? null
  const selectedMinute = parsed?.minute ?? null
  const selectedPeriod = parsed?.period ?? "AM"

  const handleSelect = (hour: number, minute: number, period: "AM" | "PM") => {
    onChange?.(to24h(hour, minute, period))
  }

  React.useEffect(() => {
    if (!open) {
      clickedRef.current = { hour: false, minute: false, period: false }
    }
  }, [open])

  const maybeClose = () => {
    const { hour, minute, period } = clickedRef.current
    if (hour && minute && period) {
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            disabled={disabled}
            aria-label={parsed ? `Time: ${formatDisplay(parsed.hour, parsed.minute, parsed.period)}. Change time` : placeholder}
            aria-invalid={ariaInvalid}
            aria-describedby={ariaDescribedby}
            className={cn(
              "flex items-center justify-between w-full border-b border-border px-0 py-1 font-normal text-sm bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm",
              !value && "text-muted-foreground",
              disabled && "opacity-50 cursor-not-allowed",
              className
            )}
          >
            <span>
              {parsed ? formatDisplay(parsed.hour, parsed.minute, parsed.period) : placeholder}
            </span>
            <Clock3 className="h-4 w-4 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start" onWheel={(e) => e.stopPropagation()}>
          <div className="grid grid-cols-[1fr_1px_1fr_1px_1fr] h-[200px]">
            {/* Hours column */}
            <div className="overflow-y-auto py-2 overscroll-contain" onWheel={(e) => e.stopPropagation()}>
              {HOURS.map((h) => (
                <button
                  key={h}
                  type="button"
                  className={cn(
                    "h-8 w-full flex items-center justify-center text-sm",
                    selectedHour === h
                      ? "bg-primary text-primary-foreground font-medium rounded mx-1"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => {
                    clickedRef.current.hour = true
                    handleSelect(h, selectedMinute ?? 0, selectedPeriod)
                    maybeClose()
                  }}
                >
                  {h}
                </button>
              ))}
            </div>
            <div className="bg-border" />
            {/* Minutes column */}
            <div className="overflow-y-auto py-2 overscroll-contain" onWheel={(e) => e.stopPropagation()}>
              {MINUTES.map((m) => (
                <button
                  key={m}
                  type="button"
                  className={cn(
                    "h-8 w-full flex items-center justify-center text-sm",
                    selectedMinute === m
                      ? "bg-primary text-primary-foreground font-medium rounded mx-1"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => {
                    clickedRef.current.minute = true
                    handleSelect(selectedHour ?? 12, m, selectedPeriod)
                    maybeClose()
                  }}
                >
                  {String(m).padStart(2, "0")}
                </button>
              ))}
            </div>
            <div className="bg-border" />
            {/* AM/PM column */}
            <div className="py-2">
              {(["AM", "PM"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={cn(
                    "h-8 w-full flex items-center justify-center text-sm",
                    selectedPeriod === p
                      ? "bg-primary text-primary-foreground font-medium rounded mx-1"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => {
                    clickedRef.current.period = true
                    handleSelect(selectedHour ?? 12, selectedMinute ?? 0, p)
                    maybeClose()
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export { TimePicker }
