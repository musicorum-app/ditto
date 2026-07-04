import { readFileSync } from 'node:fs'
import { GenerateData } from '../types.js'
import { generate } from '../generator/index.js'
import { deleteGeneratedImage } from '../generator/utils/toolbox.js'

interface TestData {
    name: string
    path: string
    data: GenerateData
}

const loadJSON = (): TestData[] => JSON.parse(readFileSync('./assets/testingData.json', 'utf8'))
let json: TestData[] = loadJSON()
const jsonTestsToHtml = (json: TestData[]) => json.map((d) => `<li><a href="/testing/${d.path}">${d.name}</a></li>`).join('')

const renderHTML = (file: string, data: Record<string, any>) => {
    let html = readFileSync(`./assets/testingPage/${file}`, 'utf8')
    for (const key in data) {
        html = html.replaceAll(`{{${key}}}`, data[key])
    }
    return html
}

export const getDevelopmentRoutes = () => {
    return {
        "/testing": {
            GET: async () => {
                json = loadJSON()
                const html = renderHTML('index.html', { tests: jsonTestsToHtml(json) })
                return new Response(html, {
                    headers: { 'Content-Type': 'text/html' }
                })
            }
        },

        "/testing/:path": {
            GET: async (req: Request & { params: { path: string } }) => {
                const test = json.find((d) => d.path === req.params.path)
                if (!test) {
                    return new Response('Not found', { status: 404 })
                }
                const { error, message, id, time } = await generate(test.data)
                if (error) {
                    return new Response(`Error: ${message}`, { status: 400 })
                }
                setTimeout(() => deleteGeneratedImage(id!), 500)
                const html = renderHTML('testViewer.html', { testName: test.name, time, id })
                return new Response(html, {
                    headers: { 'Content-Type': 'text/html' }
                })
            }
        }
    }
}

export default getDevelopmentRoutes
