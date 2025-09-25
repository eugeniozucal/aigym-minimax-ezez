import '@testing-library/jest-dom'

// Simple test environment setup
global.fetch = global.fetch || (() => Promise.resolve({
  json: () => Promise.resolve({}),
  text: () => Promise.resolve(''),
  ok: true,
  status: 200
}))
