// Placeholder content API
export class APIError extends Error {
  constructor(message: string, public status?: number) {
    super(message)
    this.name = 'APIError'
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TimeoutError'
  }
}

// Cache utilities
export const clearCache = () => {
  // Placeholder cache clearing
}

export const getCacheSize = () => {
  // Placeholder cache size
  return 0
}

export const __testing__ = {
  APIError,
  ValidationError,
  TimeoutError,
  clearCache,
  getCacheSize,
}

export const contentApi = {
  // Placeholder functions
  getContent: () => Promise.resolve([]),
  createContent: () => Promise.resolve(null),
  updateContent: () => Promise.resolve(null),
  deleteContent: () => Promise.resolve(null),
  getById: (id: string) => Promise.resolve(null),
  create: (data: any) => Promise.resolve(null),
  update: (id: string, data: any) => Promise.resolve(null),
  delete: (id: string) => Promise.resolve(null),
  list: () => Promise.resolve([]),
  autoSave: (data: any) => Promise.resolve(null),
  getAutoSaveSnapshots: () => Promise.resolve([]),
  batchUpdate: (updates: any[]) => Promise.resolve([]),
}
