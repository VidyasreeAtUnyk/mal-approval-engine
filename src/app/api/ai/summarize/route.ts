import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceClient } from '@/lib/supabase-server'
import { openai } from '@/lib/openai'
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
    .select('id, flow_type, form_data, requester_id')
    .eq('id', request_id)
    .single()

  if (fetchError || !request) {
    return NextResponse.json(FALLBACK)
  }

  const flow = getFlow(request.flow_type)
  if (!flow) return NextResponse.json(FALLBACK)

  // 3. Build extra context (team leave overlap for leave-request)
  let extraContext = ''
  if (request.flow_type === 'leave-request') {
    const fd = request.form_data as { date_range?: { from?: string; to?: string } }
    const from = fd.date_range?.from
    const to = fd.date_range?.to

    if (from && to) {
      // Use service client to bypass RLS for cross-profile queries
      const svc = createServiceClient()

      // Get requester's department
      const { data: requesterProfile } = await svc
        .from('profiles')
        .select('department_id')
        .eq('id', request.requester_id)
        .single()

      if (requesterProfile?.department_id) {
        // Find teammates on leave during the same period
        const { data: teammates } = await svc
          .from('profiles')
          .select('id, name')
          .eq('department_id', requesterProfile.department_id)
          .neq('id', request.requester_id)

        if (teammates && teammates.length > 0) {
          const teammateIds = teammates.map(t => t.id)
          const { data: overlapping } = await svc
            .from('requests')
            .select('requester_id, form_data')
            .eq('flow_type', 'leave-request')
            .in('status', ['pending', 'approved'])
            .in('requester_id', teammateIds)

          const nameMap = Object.fromEntries(teammates.map(t => [t.id, t.name]))
          const overlaps = (overlapping ?? []).filter(r => {
            const rfd = r.form_data as { date_range?: { from?: string; to?: string } }
            const rf = rfd.date_range?.from
            const rt = rfd.date_range?.to
            if (!rf || !rt) return false
            return new Date(rf) <= new Date(to) && new Date(rt) >= new Date(from)
          })

          if (overlaps.length > 0) {
            const seen = new Set<string>()
            const names = overlaps
              .map(r => nameMap[r.requester_id] ?? 'A teammate')
              .filter(n => { if (seen.has(n)) return false; seen.add(n); return true })
            extraContext = `\n\nTeam coverage note: The following teammate(s) from the same department also have leave overlapping this period: ${names.join(', ')}. Consider flagging coverage risk.`
          }
        }
      }
    }
  }

  // 4. Call OpenAI
  try {
    const formDataStr = JSON.stringify(request.form_data, null, 2)

    const response = await openai.chat.completions.create({
      model: 'gpt-5.4-mini',
      max_completion_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `You are a senior approvals assistant at Mal, an AI-native Islamic digital bank. Always use AED (UAE Dirhams) as the currency — never use $ or other currencies.

Context: ${flow.aiPromptContext}${extraContext}

A ${flow.label} has been submitted. Review the following form data and respond with a JSON object containing:
- "summary": A 1-2 sentence plain-English summary of the request (what, how much, why).
- "flags": An array of short strings (each under 15 words) for any concerns. Empty array if none.

Form data:
${formDataStr}

Respond ONLY with valid JSON. No markdown, no explanation.`,
        },
      ],
    })

    const text = response.choices[0]?.message?.content?.trim() ?? null
    if (!text) return NextResponse.json(FALLBACK)

    const parsed = JSON.parse(text)
    const summary: string | null = parsed.summary ?? null
    const flags: string[] = Array.isArray(parsed.flags) ? parsed.flags : []

    // 4. Store on the request row — use service client to bypass RLS
    const svcWrite = createServiceClient()
    await svcWrite
      .from('requests')
      .update({ ai_summary: summary, ai_flags: flags })
      .eq('id', request_id)

    return NextResponse.json({ summary, flags })
  } catch (err) {
    console.error('[ai/summarize] OpenAI error:', err)
    return NextResponse.json(FALLBACK)
  }
}
