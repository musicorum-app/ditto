import { blueprintManager, generate } from '../generator/index.js'
// @ts-ignore
import send from '@polka/send-type'
import serve from 'serve-static'
import { readFileSync } from 'node:fs'
import { GenerateData } from '../types.js'

interface TestData {
  name: string
  path: string
  data: GenerateData
}

const loadJSON = (): TestData[] => JSON.parse(readFileSync('./assets/testingData.json', 'utf8'))
let json: TestData[] = loadJSON()
const jsonTestsToHtml = (json) => json.map((d) => `<li><a href="/testing/${d.path}">${d.name}</a></li>`).join('')

const renderHTML = (file, data) => {
  let html = readFileSync(`./assets/testingPage/${file}`, 'utf8')
  for (const key in data) {
    html = html.replaceAll(`{{${key}}}`, data[key])
  }
  return html
}

const sendHTML = (res, file, data) => send(res, 200, renderHTML(file, data), { 'Content-Type': 'text/html' })

export default (server) => {
  server.use('/testing', serve('./assets/testingPage/serve'))

  server.get('/testing', async (_req, res) => {
    json = loadJSON()
    sendHTML(res, 'index.html', { tests: jsonTestsToHtml(json) })
  })

  server.get('/testing/:path', async (req, res) => {
    const test = json.find((d) => d.path === req.params.path)
    if (!test) {
      return send(res, 404, 'Not found')
    }
    const { error, message, id, time } = await generate(test.data)
    if (error) {
      return send(res, 400, `Error: ${message}`)
    }
    return send(res, 200, renderHTML('testViewer.html', { testName: test.name, time, id }), { 'Content-Type': 'text/html' })
  })

  server.get('/testing/:path/reload', async (req, res) => {
    await blueprintManager.transformBlueprints().then(async () => {
      await blueprintManager.loadBlueprints()
    })

    return send(res, 200, 'Reloaded')
  })
}