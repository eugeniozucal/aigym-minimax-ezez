import { describe, it, expect } from 'vitest'

// Basic test to verify test environment is working
describe('Test Environment Verification', () => {
  it('should perform basic arithmetic', () => {
    expect(2 + 2).toBe(4)
  })

  it('should handle string operations', () => {
    const message = 'Hello World'
    expect(message.toLowerCase()).toBe('hello world')
  })

  it('should handle arrays', () => {
    const numbers = [1, 2, 3]
    expect(numbers.length).toBe(3)
    expect(numbers.includes(2)).toBe(true)
  })

  it('should handle objects', () => {
    const user = { name: 'Test', age: 25 }
    expect(user.name).toBe('Test')
    expect(user.age).toBe(25)
  })

  it('should handle promises', async () => {
    const result = await Promise.resolve('success')
    expect(result).toBe('success')
  })
})
