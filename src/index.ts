import { debug, info } from './logging.js'
import { getVersion } from './utils.js'
import { createDirectory } from './imaging.js'
import { start as startServer } from './server.js'
import { start as startCaching } from './caching/index.js'
import './pool/pool.js'

info('index.main', `starting ditto@${await getVersion()}`)
debug('index.main', 'debugging messages are enabled')

debug('index.main', 'creating cache directory')
await createDirectory()
await startCaching()

debug('index.main', 'starting server')
await startServer()