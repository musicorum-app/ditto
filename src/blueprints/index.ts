import swc from '@swc/core'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import satori from 'satori'
import { BLUEPRINT_CACHE_DIR } from '../imaging.js'
import { join } from 'node:path'
import { error, info } from '../logging.js'
import { loadFonts } from '../generator/fonts.js'
import { Resvg } from '@resvg/resvg-js'
import { finishBuffer } from '../generator/utils/toolbox.js'

type BlueprintRootComponent = {
    configuration: {
        width: number
        height: number
        fonts?: string[]
    }

    default: (props: any) => any
}

type FontOptions = {
    name: string
    data: Buffer
}

export class BlueprintManager {
    loadedBlueprints: { [key: string]: BlueprintRootComponent } = {}
    fontBuffers: { [key: string]: Buffer } = {}

    constructor (public path: string) {
        this.fontBuffers = loadFonts(true)!
        this.transformBlueprints().then(() => this.loadBlueprints())
    }

    async transformBlueprints () {
        const files = readdirSync(this.path)
        const config = this.blueprintCompilerConfiguration()
        const now = Date.now()

        let transformed = 0
        for (const file of files) {
            const filePath = join(this.path, file)
            if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
                const code = readFileSync(filePath, 'utf-8')
                const result = await swc.transform(code, {
                    ...config,
                    filename: filePath
                }).catch((e) => {
                    error('blueprints.transformer', `failed to transform ${filePath} with error: ${e.stack}`)
                    return undefined
                })
                if (!result) continue
                transformed++
                writeFileSync(join(BLUEPRINT_CACHE_DIR, file.replace(/\.(tsx|jsx)$/, '.js')), result.code)
                writeFileSync(join(BLUEPRINT_CACHE_DIR, file.replace(/\.(tsx|jsx)$/, '.js.map')), result.map!)
            }
        }

        if (transformed > 0) info('blueprints.transformer', `transformed ${transformed} blueprints in ${Date.now() - now}ms`)
    }

    blueprintCompilerConfiguration () {
        // the default swc config does not import stailwc, which is essential to guarantee tailwind support
        const config = JSON.parse(readFileSync('./.swcrc', 'utf-8'))
        return config
    }

    hasBlueprint (name: string) {
        return !!this.loadedBlueprints[name]
    }

    async loadBlueprints () {
        const files = readdirSync(BLUEPRINT_CACHE_DIR)
        let loaded = 0
        for (const file of files) {
            if (file.endsWith('.js')) {
                const fileWithQuery = file + '?v=' + Date.now()
                const blueprint: BlueprintRootComponent = await import(join('../../..', BLUEPRINT_CACHE_DIR, fileWithQuery)).catch((e) => {
                    error('blueprints.loader', `failed to load ${file} with ${e.stack}`)
                    return undefined
                })
                if (!blueprint) continue
                if (!blueprint.configuration || !blueprint.default || typeof blueprint.default !== 'function' || !blueprint.configuration.width || !blueprint.configuration.height) {
                    error('blueprints.loader', `failed to load ${file} because it does not export a default component and configuration object.`)
                    continue
                }

                const name = file.replace('.js', '')
                this.loadedBlueprints[name] = blueprint
                loaded++
            }
        }

        info('blueprints.loader', `loaded ${loaded} blueprints`)
    }

    getAvailableBlueprints () {
        return Object.keys(this.loadedBlueprints)
    }

    rootDiv (children: any) {
        return {
            type: 'div',
            props: {
                style: {
                    // make apple color emoji and inter the default fonts
                    fontFamily: 'Noto Current',
                    display: 'flex'
                },
                children
            }
        }
    }

    async render (blueprint: string, id: string, props: any): Promise<boolean> {
        const component = this.loadedBlueprints[blueprint]
        if (!component) {
            error('blueprints.render', `failed to render ${blueprint} because it does not exist.`)
            return false
        }

        const data = await satori(
            this.rootDiv(component.default(props)),
            {
                width: component.configuration.width,
                height: component.configuration.height,
                fonts: this.transformConfigurationFonts(component.configuration.fonts ?? [])
            }
        ).catch((e) => {
            error('blueprints.render', `failed to render ${blueprint} with error: ${e.stack}`)
            return undefined
        })

        if (!data) return false

        const resvg = new Resvg(data, {
            background: '#fff'
        })

        const pngData = resvg.render()
        finishBuffer(pngData.asPng(), id)
        return true
    }

    transformConfigurationFonts (fonts: string[] = []): FontOptions[] {
        // always add the default fonts
        fonts = ['Noto Current', ...fonts]

        const fontObjs = fonts.map((font) => {
            const buffer = this.fontBuffers[font]
            if (!buffer) {
                error('blueprints.fonts', `failed to find font buffer for ${font}`)
                return undefined
            }

            return {
                name: font,
                data: buffer,
                weight: 500,
                style: 'normal'
            }
        }).filter((x) => x)

        return fontObjs as FontOptions[]
    }
}