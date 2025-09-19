import { describe, it, expect } from 'vitest'

// Very simple test to verify test environment is working
describe('Test Environment', () => {
  it('should run basic tests', () => {
    expect(1 + 1).toBe(2)
  })

  it('should have access to globals', () => {
    expect(typeof fetch).toBe('function')
  })

  it('should handle basic math operations', () => {
    const sum = (a, b) => a + b
    expect(sum(2, 3)).toBe(5)
  })
})
