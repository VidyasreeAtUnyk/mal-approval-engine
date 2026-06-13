import { FLOW_REGISTRY, getFlow } from '@/lib/flow-registry'
import { FieldType } from '@/types/flow.types'

const VALID_FIELD_TYPES: FieldType[] = ['text', 'textarea', 'number', 'select', 'date', 'daterange', 'email']

describe('FLOW_REGISTRY', () => {
  test('contains budget-request config', () => {
    const ids = FLOW_REGISTRY.map((f) => f.id)
    expect(ids).toContain('budget-request')
  })

  test('contains leave-request config', () => {
    const ids = FLOW_REGISTRY.map((f) => f.id)
    expect(ids).toContain('leave-request')
  })

  test('all configs have required fields', () => {
    for (const config of FLOW_REGISTRY) {
      expect(config.id).toBeTruthy()
      expect(config.label).toBeTruthy()
      expect(config.description).toBeTruthy()
      expect(config.icon).toBeTruthy()
      expect(Array.isArray(config.fields)).toBe(true)
      expect(config.fields.length).toBeGreaterThan(0)
      expect(config.aiPromptContext).toBeTruthy()
    }
  })

  test('all field types are valid', () => {
    for (const config of FLOW_REGISTRY) {
      for (const field of config.fields) {
        expect(VALID_FIELD_TYPES).toContain(field.type)
      }
    }
  })

  test('all field ids are unique within each flow', () => {
    for (const config of FLOW_REGISTRY) {
      const ids = config.fields.map((f) => f.id)
      const unique = new Set(ids)
      expect(unique.size).toBe(ids.length)
    }
  })
})

describe('getFlow', () => {
  test('returns correct config by id', () => {
    const config = getFlow('budget-request')
    expect(config).toBeDefined()
    expect(config?.id).toBe('budget-request')
    expect(config?.label).toBe('Budget Request')
  })

  test('returns undefined for unknown id', () => {
    expect(getFlow('does-not-exist')).toBeUndefined()
  })

  test('is case sensitive', () => {
    expect(getFlow('Budget-Request')).toBeUndefined()
    expect(getFlow('BUDGET-REQUEST')).toBeUndefined()
  })
})
