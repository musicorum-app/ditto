import { CachingBackend } from './backend.js'

export default class InMemoryBackend extends CachingBackend {
    private cache: Map<string, string> = new Map()

    async get(key: string): Promise<string | undefined> {
        return this.cache.get(key)
    }

    async set(key: string, value: string): Promise<void> {
        this.cache.set(key, value)
    }

    async setTTL(key: string, value: string, ttl: number): Promise<void> {
        this.cache.set(key, value)
        setTimeout(() => {
            this.cache.delete(key)
        }, ttl)
    }

    async delete(key: string): Promise<void> {
        this.cache.delete(key)
    }

    async clear(): Promise<void> {
        this.cache.clear()
    }
}
