// Placeholder content API
export class APIError extends Error {
    constructor(message, status) {
        super(message);
        Object.defineProperty(this, "status", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: status
        });
        this.name = 'APIError';
    }
}
export class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}
export class TimeoutError extends Error {
    constructor(message) {
        super(message);
        this.name = 'TimeoutError';
    }
}
// Cache utilities
export const clearCache = () => {
    // Placeholder cache clearing
};
export const getCacheSize = () => {
    // Placeholder cache size
    return 0;
};
export const __testing__ = {
    APIError,
    ValidationError,
    TimeoutError,
    clearCache,
    getCacheSize,
};
export const contentApi = {
    // Placeholder functions
    getContent: () => Promise.resolve([]),
    createContent: () => Promise.resolve(null),
    updateContent: () => Promise.resolve(null),
    deleteContent: () => Promise.resolve(null),
    getById: (id) => Promise.resolve(null),
    create: (data) => Promise.resolve(null),
    update: (id, data) => Promise.resolve(null),
    delete: (id) => Promise.resolve(null),
    list: () => Promise.resolve([]),
    autoSave: (data) => Promise.resolve(null),
    getAutoSaveSnapshots: () => Promise.resolve([]),
    batchUpdate: (updates) => Promise.resolve([]),
};
