/** @jest-environment node */

/**
 * GAP THESE TESTS CLOSE:
 * - AI used wrong model name ("gpt-4o-mini" was reverted back by linter), and
 *   the previous test used a LOCAL copy of the prompt logic — so changes to the
 *   real route's prompt were invisible to tests.
 * - AI used "$" instead of "AED" — no test asserted what currency instruction
 *   was in the actual prompt sent to OpenAI.
 *
 * These tests call the real route handlers with mocked dependencies, so any
 * change to the actual prompt or model will be caught immediately.
 */

const mockCreate = jest.fn()

jest.mock('@/lib/openai', () => ({
  openai: {
    chat: { completions: { create: mockCreate } },
  },
}))

// Mock supabase-server so route handlers don't need next/headers or cookies
const mockUserClient = {
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    }),
  },
  from: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: {
        id: 'req-1',
        flow_type: 'budget-request',
        form_data: { title: 'Laptop', amount: 5000 },
        requester_id: 'user-1',
      },
      error: null,
    }),
  }),
}

const mockServiceClient = {
  from: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
  }),
}

jest.mock('@/lib/supabase-server', () => ({
  createServerClient: jest.fn(() => mockUserClient),
  createServiceClient: jest.fn(() => mockServiceClient),
}))

// Minimal NextRequest factory
function makeRequest(body: unknown) {
  return new Request('http://localhost/api/ai/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// Dynamically import after mocks are set up
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { POST: summarizePOST } = require('@/app/api/ai/summarize/route')

describe('AI summarize route', () => {
  beforeEach(() => {
    mockCreate.mockReset()
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ summary: 'Test summary', flags: [] }) } }],
    })
  })

  test('uses gpt-5.4-mini — not gpt-4o-mini or any other model', async () => {
    await summarizePOST(makeRequest({ request_id: 'req-1' }))
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'gpt-5.4-mini' })
    )
  })

  test('prompt instructs to use AED — not $', async () => {
    await summarizePOST(makeRequest({ request_id: 'req-1' }))
    const prompt: string = mockCreate.mock.calls[0][0].messages[0].content
    expect(prompt).toContain('AED')
    expect(prompt.toLowerCase()).not.toMatch(/always use \$/)
  })

  test('returns summary and flags on success', async () => {
    const res = await summarizePOST(makeRequest({ request_id: 'req-1' }))
    const json = await res.json()
    expect(json.summary).toBe('Test summary')
    expect(json.flags).toEqual([])
  })

  test('returns fallback when OpenAI throws', async () => {
    mockCreate.mockRejectedValue(new Error('quota exceeded'))
    const res = await summarizePOST(makeRequest({ request_id: 'req-1' }))
    const json = await res.json()
    expect(json.summary).toBeNull()
    expect(json.flags).toEqual([])
  })

  test('returns 401 when not authenticated', async () => {
    mockUserClient.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null })
    const res = await summarizePOST(makeRequest({ request_id: 'req-1' }))
    expect(res.status).toBe(401)
  })

  test('returns 422 when request_id is missing', async () => {
    const res = await summarizePOST(makeRequest({}))
    expect(res.status).toBe(422)
  })
})
