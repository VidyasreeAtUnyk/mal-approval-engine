'use client'

import { DayPicker, DateRange } from 'react-day-picker'
import 'react-day-picker/style.css'
import { Label } from '@/components/ui/label'
import { FlowField } from '@/types/flow.types'
import { cn } from '@/lib/utils'

interface CalendarFieldProps {
  field: FlowField
  value?: DateRange
  onChange: (range: DateRange | undefined) => void
  error?: string
}

export function CalendarField({ field, value, onChange, error }: CalendarFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-[var(--mal-text-strong-950)]">
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>

      <div
        className={cn(
          'rounded-mal-10 border bg-[var(--mal-bg-white-0)] p-2 inline-block',
          error
            ? 'border-destructive'
            : 'border-[var(--mal-stroke-soft-200)]'
        )}
      >
        <DayPicker
          mode="range"
          selected={value}
          onSelect={onChange}
          disabled={{ before: new Date() }}
          classNames={{
            today: 'font-bold text-[var(--mal-purple-500)]',
            selected: 'bg-[var(--mal-alpha-purple-10)] text-[var(--mal-purple-600)]',
            range_start: 'bg-[var(--mal-purple-500)] text-white rounded-l-full',
            range_end: 'bg-[var(--mal-purple-500)] text-white rounded-r-full',
            range_middle: 'bg-[var(--mal-alpha-purple-8)]',
          }}
        />
      </div>

      {field.hint && !error && (
        <p className="text-xs text-[var(--mal-text-soft-400)]">{field.hint}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
