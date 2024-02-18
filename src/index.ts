import { debug, info, welcome } from './logging.js'
import { getVersion } from './utils.js'
import { createDirectory } from './imaging.js'
import { start as startServer } from './server/index.js'
import { loadFonts } from './generator/fonts.js'
import './pool/pool.js'

welcome()
info('index.main', `starting ditto@${await getVersion()}`)
debug('index.main', 'debugging messages are enabled')

debug('index.main', 'creating cache directory')
await createDirectory()

debug('index.main', 'registering fonts')
loadFonts()

debug('index.main', 'starting server')
await startServer()
