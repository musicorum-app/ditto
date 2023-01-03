import polka from 'polka'
import { getVersion } from './utils.js'
import { info } from './logging.js'
// @ts-ignore
import send from '@polka/send-type'
// @ts-ignore
import { json } from '@polka/parse'

import { generate, templates } from './generator/index.js'
import { GenerateData } from './types.js'

const server = polka()
server.use(json())

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
    send(res, 200, { error: false, file: `${id}.jpg`, time })
  }
})

export const start = async () => {
  server.listen(process.env.PORT || 3000, () => {
    info('server.start', `listening on port ${process.env.PORT || 3000}`)
  })
}