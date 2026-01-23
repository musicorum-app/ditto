import { getVersion } from '../utils.js'
import { info } from '../logging.js'
import { generate, templates } from '../generator/index.js'
import { GenerateData } from '../types.js'
import { GENERATION_CACHE_DIR } from '../imaging.js'
import { getDevelopmentRoutes } from './developmentRoutes.js'
import { join } from 'node:path'

const PORT = process.env.PORT || 3000
export const SERVER_URL = process.env.SERVER_URL || 'http://localhost:' + PORT

const serveStatic = async (req: Request, baseDir: string) => {
    const url = new URL(req.url)
    const filePath = join(baseDir, url.pathname.replace(/^\/results\/?/, ''))
    const file = Bun.file(filePath)

    if (await file.exists()) {
        return new Response(file)
    }
    return null
}

export const start = async () => {
    const version = await getVersion().then(x => parseFloat(x))

    const routes: Record<string, any> = {
        "/metadata": {
            GET: () => Response.json({
                name: process.env.INSTANCE_NAME || 'Kepler',
                engine: 'ditto',
                scheme: 1.0,
                themes: Object.keys(templates),
                version
            })
        },

        "/generate": {
            POST: async (req: Request) => {
                const data = await req.json() as GenerateData
                const { error, message, id, time } = await generate(data)
                if (error) {
                    return Response.json({ error: true, message }, { status: 400 })
                } else {
                    return Response.json({
                        error: false,
                        file: `${id}.jpg`,
                        url: `${SERVER_URL}/results/${id}.jpg`,
                        time
                    })
                }
            }
        }
    }

    if (process.env.NODE_ENV !== 'production') {
        Object.assign(routes, getDevelopmentRoutes())
    }

    const server = Bun.serve({
        port: PORT,
        routes,

        async fetch(req) {
            const url = new URL(req.url)

            if (url.pathname.startsWith('/results/')) {
                const staticResponse = await serveStatic(req, GENERATION_CACHE_DIR)
                if (staticResponse) return staticResponse
            }

            // Handle static file serving for /testing/* (CSS, JS, etc.)
            if (process.env.NODE_ENV !== 'production') {
                const cleanPath = url.pathname.replace(/^\/\/?/, '')
                if (cleanPath) {
                    // This looks like a static file (has extension or special chars)
                    const filePath = join('./assets/testingPage/serve', cleanPath)
                    const file = Bun.file(filePath)
                    const txt = await file.text()

                    return new Response(txt, {
                        headers: {
                            'Content-Type': file.type
                        }
                    })
                }
            }

            return new Response("Not Found", { status: 404 })
        },
    })


    info('server.start', `listening on port ${server.port}`)
}
