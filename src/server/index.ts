import polka from 'polka'
import { getVersion } from '../utils.js'
import { info } from '../logging.js'
// @ts-ignore
import send from '@polka/send-type'
// @ts-ignore
import { json } from '@polka/parse'
import serve from 'serve-static'
import { generate, templates } from '../generator/index.js'
import { GenerateData } from '../types.js'
import { GENERATION_CACHE_DIR } from '../imaging.js'
import developmentRoutes from './developmentRoutes.js'

const PORT = process.env.PORT || 3000
export const SERVER_URL = process.env.SERVER_URL || 'http://localhost:' + PORT

const server = polka()
server.use(json())

server.use('/results', serve(GENERATION_CACHE_DIR))
server.get('/metadata', async (_req, res) => {
  send(res, 200, {
    name: process.env.INSTANCE_NAME || 'Kepler',
    engine: 'ditto',
    scheme: 1.0,
    themes: Object.keys(templates),
    version: await getVersion().then(x => parseFloat(x))
  })
})

server.post('/generate', async (req, res) => {
  const data = req.body as GenerateData
  const { error, message, id, time } = await generate(data)
  if (error) {
    send(res, 400, { error: true, message })
  } else {
    send(res, 200, { error: false, file: `${id}.jpg`, url: `${SERVER_URL}/results/${id}.jpg`, time })
  }
})

if (process.env.NODE_ENV !== 'production') developmentRoutes(server)

export const start = async () => {
  server.listen(PORT, () => {
    info('server.start', `listening on port ${PORT}`)
  })
}