const mockCreate = jest.fn()

jest.mock('@/lib/anthropic', () => ({
  anthropic: {
    messages: { create: mockCreate },
  },
}))

import { anthropic } from '@/lib/anthropic'

// Mirrors the core logic from /api/ai/summarize — tested without HTTP layer
async function generateSummary(
  flowContext: string,
  flowLabel: string,
  formData: Record<string, unknown>
): Promise<{ summary: string | null; flags: string[] }> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6' as const,
      max_tokens: 512,
      messages: [
        {
          role: 'user' as const,
          content: `Context: ${flowContext}\nFlow: ${flowLabel}\nForm: ${JSON.stringify(formData)}\nRespond ONLY with JSON: { "summary": string, "flags": string[] }`,
        },
      ],
    })

    const block = response.content[0]
    const text = block?.type === 'text' ? block.text : null
    if (!text) return { summary: null, flags: [] }

    const parsed = JSON.parse(text.trim())
    return {
      summary: parsed.summary ?? null,
      flags: Array.isArray(parsed.flags) ? parsed.flags : [],
    }
  } catch {
    return { summary: null, flags: [] }
  }
}

describe('generateRequestSummary', () => {
  beforeEach(() => mockCreate.mockReset())

  test('returns summary and flags on success', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify({ summary: 'Test summary', flags: ['Flag 1'] }) }],
    })
    const result = await generateSummary('context', 'Budget Request', { amount: 500 })
    expect(result.summary).toBe('Test summary')
    expect(result.flags).toEqual(['Flag 1'])
  })

  test('returns fallback when API throws', async () => {
    mockCreate.mockRejectedValue(new Error('API down'))
    const result = await generateSummary('context', 'Budget Request', {})
    expect(result.summary).toBeNull()
    expect(result.flags).toEqual([])
  })

  test('returns fallback when JSON is malformed', async () => {
    mockCreate.mockResolvedValue({ content: [{ type: 'text', text: 'not valid json {{' }] })
    const result = await generateSummary('context', 'Budget Request', {})
    expect(result.summary).toBeNull()
    expect(result.flags).toEqual([])
  })

  test('returns fallback when content is empty', async () => {
    mockCreate.mockResolvedValue({ content: [] })
    const result = await generateSummary('context', 'Budget Request', {})
    expect(result.summary).toBeNull()
    expect(result.flags).toEqual([])
  })

  test('includes flow context in the prompt', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify({ summary: 'ok', flags: [] }) }],
    })
    await generateSummary('Islamic finance compliance check', 'Budget Request', {})
    const callArg = mockCreate.mock.calls[0][0]
    expect(callArg.messages[0].content).toContain('Islamic finance compliance check')
  })
})
