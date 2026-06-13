import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { anthropic } from '@/lib/anthropic'

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
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
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

    const text = response.content[0]?.type === 'text' ? response.content[0].text.trim() : null
    if (!text) {
      return NextResponse.json({ text: null })
    }

    return NextResponse.json({ text })
  } catch (err) {
    console.error('[ai/assist] Claude error:', err)
    return NextResponse.json({ text: null })
  }
}
