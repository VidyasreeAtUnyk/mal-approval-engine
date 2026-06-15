'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useForm, Controller } from 'react-hook-form'
import { DateRange } from 'react-day-picker'
import { FlowConfig } from '@/types/flow.types'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const CalendarField = dynamic(() => import('./CalendarField').then(m => m.CalendarField), {
  loading: () => <div className="h-10 rounded-mal-8 bg-[var(--mal-bg-weak-50)] animate-pulse" />,
  ssr: false,
})
import { Sparkles, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ApprovalFormProps {
  config: FlowConfig
  initialData?: Record<string, unknown>
  draftId?: string
  onSubmit: (data: Record<string, unknown>) => Promise<void>
  onDraftSave?: (data: Record<string, unknown>) => Promise<void>
  submitting?: boolean
}

type DraftStatus = 'idle' | 'saving' | 'saved'

export function ApprovalForm({
  config,
  initialData,
  onSubmit,
  onDraftSave,
  submitting,
}: ApprovalFormProps) {
  const idempotencyKey = useRef(crypto.randomUUID())
  const [aiAssistLoading, setAiAssistLoading] = useState<string | null>(null)
  const [draftStatus, setDraftStatus] = useState<DraftStatus>('idle')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { control, handleSubmit, getValues, setValue, watch, formState: { errors } } =
    useForm<Record<string, unknown>>({
      defaultValues: initialData ?? {},
    })

  const scheduleDraftSave = useCallback((data: Record<string, unknown>) => {
    if (!onDraftSave) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setDraftStatus('idle')
    saveTimer.current = setTimeout(async () => {
      setDraftStatus('saving')
      await onDraftSave({ ...data, _idempotencyKey: idempotencyKey.current })
      setDraftStatus('saved')
      savedTimer.current = setTimeout(() => setDraftStatus('idle'), 2000)
    }, 1500)
  }, [onDraftSave])

  useEffect(() => {
    const sub = watch((data) => {
      scheduleDraftSave(data as Record<string, unknown>)
    })
    return () => {
      sub.unsubscribe()
      if (saveTimer.current) clearTimeout(saveTimer.current)
      if (savedTimer.current) clearTimeout(savedTimer.current)
    }
  }, [watch, scheduleDraftSave])

  async function handleAiAssist(fieldId: string) {
    setAiAssistLoading(fieldId)
    try {
      const currentData = getValues()
      const res = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldId,
          formData: currentData,
          flowContext: config.aiPromptContext,
          flowLabel: config.label,
        }),
      })
      const json = await res.json()
      if (json.text) setValue(fieldId, json.text)
    } catch {
      // Silently fail — user can try again
    } finally {
      setAiAssistLoading(null)
    }
  }

  async function onFormSubmit(data: Record<string, unknown>) {
    await onSubmit({ ...data, _idempotencyKey: idempotencyKey.current })
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
      {config.fields.map((field) => {
        const errorMsg = errors[field.id]?.message as string | undefined

        if (field.type === 'daterange') {
          return (
            <Controller
              key={field.id}
              name={field.id}
              control={control}
              rules={field.required ? {
                validate: (v) => {
                  const r = v as DateRange | undefined
                  if (!r?.from) return 'Start date is required'
                  if (!r?.to) return 'Please select an end date'
                  return true
                }
              } : {}}
              render={({ field: { value, onChange } }) => (
                <CalendarField
                  field={field}
                  value={value as DateRange | undefined}
                  onChange={onChange}
                  error={errorMsg}
                />
              )}
            />
          )
        }

        if (field.type === 'select') {
          return (
            <Controller
              key={field.id}
              name={field.id}
              control={control}
              rules={field.required ? { required: 'This field is required' } : {}}
              render={({ field: { value, onChange } }) => (
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-[var(--mal-text-strong-950)]">
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  <Select value={value as string} onValueChange={onChange}>
                    <SelectTrigger
                      className={cn(
                        'border-[var(--mal-stroke-soft-200)]',
                        errorMsg && 'border-destructive'
                      )}
                    >
                      <SelectValue placeholder={field.placeholder ?? `Select ${field.label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {field.hint && !errorMsg && (
                    <p className="text-xs text-[var(--mal-text-soft-400)]">{field.hint}</p>
                  )}
                  {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
                </div>
              )}
            />
          )
        }

        if (field.type === 'textarea') {
          return (
            <Controller
              key={field.id}
              name={field.id}
              control={control}
              rules={field.required ? { required: 'This field is required' } : {}}
              render={({ field: { value, onChange, onBlur } }) => (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-[var(--mal-text-strong-950)]">
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {field.aiAssist && config.aiAssistEnabled && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAiAssist(field.id)}
                        disabled={aiAssistLoading === field.id}
                        className="text-xs text-[var(--mal-purple-500)] hover:text-[var(--mal-purple-600)] hover:bg-[var(--mal-alpha-purple-8)] h-7 px-2"
                      >
                        {aiAssistLoading === field.id ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <Sparkles className="h-3 w-3 mr-1" />
                        )}
                        Help me write
                      </Button>
                    )}
                  </div>
                  <Textarea
                    value={value as string ?? ''}
                    onChange={onChange}
                    onBlur={onBlur}
                    placeholder={field.placeholder}
                    rows={4}
                    className={cn(
                      'border-[var(--mal-stroke-soft-200)] resize-none focus-visible:ring-[var(--mal-alpha-purple-24)]',
                      errorMsg && 'border-destructive'
                    )}
                  />
                  {field.aiAssist && (
                    <p className="text-xs text-[var(--mal-text-soft-400)]">
                      AI-generated content. Do not include personal or sensitive information.
                    </p>
                  )}
                  {field.hint && !field.aiAssist && !errorMsg && (
                    <p className="text-xs text-[var(--mal-text-soft-400)]">{field.hint}</p>
                  )}
                  {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
                </div>
              )}
            />
          )
        }

        // text, number, email, date
        return (
          <Controller
            key={field.id}
            name={field.id}
            control={control}
            rules={field.required ? { required: 'This field is required' } : {}}
            render={({ field: { value, onChange, onBlur } }) => (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[var(--mal-text-strong-950)]">
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                <Input
                  type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : field.type === 'date' ? 'date' : 'text'}
                  value={value as string ?? ''}
                  onChange={(e) =>
                    onChange(field.type === 'number' ? Number(e.target.value) : e.target.value)
                  }
                  onBlur={onBlur}
                  placeholder={field.placeholder}
                  className={cn(
                    'border-[var(--mal-stroke-soft-200)] focus-visible:ring-[var(--mal-alpha-purple-24)]',
                    errorMsg && 'border-destructive'
                  )}
                />
                {field.hint && !errorMsg && (
                  <p className="text-xs text-[var(--mal-text-soft-400)]">{field.hint}</p>
                )}
                {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
              </div>
            )}
          />
        )
      })}

      <div className="pt-2 flex items-center gap-4">
        <Button
          type="submit"
          disabled={submitting}
          className="bg-[var(--mal-purple-500)] hover:bg-[var(--mal-purple-600)] text-white px-6"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Submitting…
            </>
          ) : (
            'Submit Request'
          )}
        </Button>
        {draftStatus === 'saving' && (
          <span className="text-xs text-[var(--mal-text-soft-400)] flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving draft…
          </span>
        )}
        {draftStatus === 'saved' && (
          <span className="text-xs text-[var(--mal-text-soft-400)]">Draft saved</span>
        )}
      </div>
    </form>
  )
}
