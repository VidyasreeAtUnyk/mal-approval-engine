import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { openai } from '@/lib/openai'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const supabase = createServerClient()

  // 1. Auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Please log in' } },
      { status: 401 }
    )
  }

  // 2. Rate limit — 20 AI calls per user per minute
  const { allowed, resetAt } = rateLimit(`assist:${user.id}`, { limit: 20, windowMs: 60_000 })
  if (!allowed) {
    return NextResponse.json(
      { error: { code: 'RATE_LIMITED', message: 'Too many requests. Please wait a moment.' } },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(resetAt),
          'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)),
        },
      }
    )
  }

  const body = await req.json().catch(() => ({}))
  const { fieldId, formData, flowContext, flowLabel } = body

  if (!fieldId || !flowContext) {
    return NextResponse.json(
      { error: { code: 'VALIDATION', message: 'fieldId and flowContext are required' } },
      { status: 422 }
    )
  }

  // 2. Build context from filled fields
  const filledFields = Object.entries(formData ?? {})
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join('\n')

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-5.4-mini',
      max_completion_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `You are helping an employee at Mal, an AI-native Islamic digital bank, write a "${fieldId}" field for a ${flowLabel ?? 'request'}.

Context: ${flowContext}

Other fields already filled in:
${filledFields || '(none yet)'}

Write a clear, professional, and concise value for the "${fieldId}" field.
Write only the field content — no labels, no explanation, no preamble.
Do not include any personally identifiable information.`,
        },
      ],
    })

    const text = response.choices[0]?.message?.content?.trim() ?? null
    if (!text) {
      return NextResponse.json({ text: null })
    }

    return NextResponse.json({ text })
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string }
    console.error('[ai/assist] OpenAI error:', e?.status, e?.message, err)
    return NextResponse.json({ error: e?.message, text: null })
  }
}
