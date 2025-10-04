// Mock IndexedDB for testing
import 'fake-indexeddb/auto'

// Mock localStorage for Node.js environment
Object.defineProperty(global, 'localStorage', {
  value: {
    store: {} as Record<string, string>,
    getItem: function(key: string) {
      return this.store[key] || null
    },
    setItem: function(key: string, value: string) {
      this.store[key] = value
    },
    removeItem: function(key: string) {
      delete this.store[key]
    },
    clear: function() {
      this.store = {}
    }
  },
  configurable: true
})
