import { test, describe } from 'node:test'
import assert from 'node:assert'

// Simple test using Node.js built-in test runner
describe('Test Environment Verification', () => {
  test('basic arithmetic works', () => {
    assert.strictEqual(2 + 2, 4)
  })

  test('string operations work', () => {
    const message = 'Hello World'
    assert.strictEqual(message.toLowerCase(), 'hello world')
  })

  test('arrays work correctly', () => {
    const numbers = [1, 2, 3]
    assert.strictEqual(numbers.length, 3)
    assert.strictEqual(numbers.includes(2), true)
  })

  test('objects work correctly', () => {
    const user = { name: 'Test', age: 25 }
    assert.strictEqual(user.name, 'Test')
    assert.strictEqual(user.age, 25)
  })

  test('promises work correctly', async () => {
    const result = await Promise.resolve('success')
    assert.strictEqual(result, 'success')
  })
})

console.log('✅ Test environment verification complete!')
