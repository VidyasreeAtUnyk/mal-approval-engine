import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { anthropic } from '@/lib/anthropic'
import { getFlow } from '@/lib/flow-registry'

const FALLBACK = { summary: null, flags: [] }

export async function POST(req: NextRequest) {
  const supabase = createServerClient()

  // 1. Auth — internal calls pass session cookie
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Please log in' } },
      { status: 401 }
    )
  }

  const body = await req.json().catch(() => ({}))
  const { request_id } = body

  if (!request_id) {
    return NextResponse.json(
      { error: { code: 'VALIDATION', message: 'request_id is required' } },
      { status: 422 }
    )
  }

  // 2. Fetch the request
  const { data: request, error: fetchError } = await supabase
    .from('requests')
    .select('id, flow_type, form_data')
    .eq('id', request_id)
    .single()

  if (fetchError || !request) {
    return NextResponse.json(FALLBACK)
  }

  const flow = getFlow(request.flow_type)
  if (!flow) return NextResponse.json(FALLBACK)

  // 3. Call Claude
  try {
    const formDataStr = JSON.stringify(request.form_data, null, 2)

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `You are a senior approvals assistant at Mal, an AI-native Islamic digital bank.

Context: ${flow.aiPromptContext}

A ${flow.label} has been submitted. Review the following form data and respond with a JSON object containing:
- "summary": A 1-2 sentence plain-English summary of the request (what, how much, why).
- "flags": An array of short strings (each under 15 words) for any concerns. Empty array if none.

Form data:
${formDataStr}

Respond ONLY with valid JSON. No markdown, no explanation.`,
        },
      ],
    })

    const text = response.content[0]?.type === 'text' ? response.content[0].text : null
    if (!text) return NextResponse.json(FALLBACK)

    const parsed = JSON.parse(text.trim())
    const summary: string | null = parsed.summary ?? null
    const flags: string[] = Array.isArray(parsed.flags) ? parsed.flags : []

    // 4. Store on the request row
    await supabase
      .from('requests')
      .update({ ai_summary: summary, ai_flags: flags })
      .eq('id', request_id)

    return NextResponse.json({ summary, flags })
  } catch (err) {
    console.error('[ai/summarize] Claude error:', err)
    return NextResponse.json(FALLBACK)
  }
}
