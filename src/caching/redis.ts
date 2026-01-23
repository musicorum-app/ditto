import { CachingBackend } from './backend.js'
import { RedisClient } from 'bun'

export default class RedisBackend extends CachingBackend {
    public client?: RedisClient

    constructor() {
        super()

        if (!process.env.REDIS_URL) {
            throw new Error('REDIS_URL environment variable is not set')
        }

        this.client = new RedisClient(process.env.REDIS_URL || 'redis://localhost:6379')
    }

    async start() {
        try {
            // ioredis connects automatically, but we can test the connection
            await this.client!.ping()
            return true
        } catch (e) {
            return false
        }
    }

    async get(key: string): Promise<any | undefined> {
        return this.client!.get(this.#buildKey(key))
    }

    async setTTL(key: string, value: any, ttl: number) {
        await this.client!.set(this.#buildKey(key), value, 'EX', Math.floor(ttl / 1000))
    }

    async set(key: string, value: any) {
        await this.client!.set(this.#buildKey(key), value)
    }

    async delete(key: string) {
        await this.client!.del(this.#buildKey(key))
    }

    async clear() {
        // UNIMPLEMENTED
    }

    #buildKey(key: string) {
        return `ditto:${key}`
    }
}

