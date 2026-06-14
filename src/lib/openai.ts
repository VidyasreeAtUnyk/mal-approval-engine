import OpenAI from 'openai'

// Server-only — never import in client components
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})
