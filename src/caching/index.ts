import { debug, error, info, warn } from '../logging.js'
import { CachingBackend } from './backend.js'
import RedisBackend from './redis.js'
import InMemoryBackend from './in-memory.js'

export let backend: CachingBackend | undefined

export const start = async () => {
  debug('cachingEngine.start', 'starting cachingEngine engine')
  let redisBackend: RedisBackend | undefined = new RedisBackend()
  if (await redisBackend!.start()) {
    info('cachingEngine.start', 'using redis as cache backend')
    backend = redisBackend
  } else {
    error('cachingEngine.start', 'preposterous caching configuration! redis was not found')
    warn('cachingEngine.start', 'using in-memory cache backend')
    backend = new InMemoryBackend()
  }
}
