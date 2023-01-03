import { debug, error, info, warn } from '../logging.js'
import InMemoryBackend from './inMemory.js'
import { CachingBackend } from './backend.js'

let internalBackend: CachingBackend | undefined

export const start = async (): Promise<void> => {
  debug('caching.start', 'starting caching engine')
  if (process.env.REDIS_URL) {
    info('caching.start', 'redis was found, using redis')
    return
  } else {
    warn('caching.start', 'redis was not found, using simple in-memory')
    internalBackend = new InMemoryBackend()
  }
}

export const backend = (): CachingBackend => {
  if (!internalBackend) {
    error('caching.backend', 'backend was not initialized! stop!')
    throw new Error('backend was not initialized')
  }
  return internalBackend
}