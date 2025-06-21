const data = new Map<string, unknown>();

export const imaginaryAsyncDbClient = {
  get: async <T>(key: string) => data.get(key) as T | undefined,
  set: async <T>(key: string, value: T) => data.set(key, value),
};