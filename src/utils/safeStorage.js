import AsyncStorage from '@react-native-async-storage/async-storage';

// Reliable in-memory fallback cache that handles cases where native storage bridge fails
const memoryStore = new Map();

export const safeStorage = {
  getItem: async (key) => {
    try {
      const val = await AsyncStorage.getItem(key);
      if (val !== null && val !== undefined) {
        memoryStore.set(key, val);
        return val;
      }
    } catch (_) {
      // Fallback to memory store silently if native module is null/unlinked
    }
    return memoryStore.get(key) || null;
  },

  setItem: async (key, value) => {
    memoryStore.set(key, String(value));
    try {
      await AsyncStorage.setItem(key, String(value));
    } catch (_) {
      // Silently persist in memory store
    }
  },

  removeItem: async (key) => {
    memoryStore.delete(key);
    try {
      await AsyncStorage.removeItem(key);
    } catch (_) {}
  },

  clear: async () => {
    memoryStore.clear();
    try {
      await AsyncStorage.clear();
    } catch (_) {}
  },
};

export default safeStorage;
