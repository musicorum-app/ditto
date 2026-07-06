import asymmetricCollage from './templates/asymmetricCollage.js'
import classicCollage from './templates/classicCollage.js'
import { GenerateData, GeneratorResponse, TemplateData } from '../types.js'
import { debug, warn } from '../logging.js'
import charts from './templates/charts.js'

type TemplateFactory = (id: string, data: TemplateData, genData: GenerateData) => Promise<void>
export const templates = {
    'classic_collage': classicCollage as unknown as TemplateFactory,
    'asymmetric_collage': asymmetricCollage as unknown as TemplateFactory,
    'charts': charts as unknown as TemplateFactory
}

export const generate = async ({ theme, data, id }: GenerateData): Promise<GeneratorResponse> => {
    if (!data) return { error: true, message: 'No data provided', id: undefined }
    id = id || Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)

    const factory: TemplateFactory = templates[theme as keyof typeof templates]
    if (!factory) return { error: true, message: 'Invalid theme', id: undefined }

    debug('generator.generate', `generating ${theme} for ${id}`)
    const a = Date.now()
    try {
        // @ts-ignore
        await factory(id, data)
    } catch (e) {
        warn('generator.generate', `error generating ${theme} for ${id}: ${(e as Error).stack}`)
        return { error: true, message: (e as Error).message, id: undefined }
    }
    const b = Date.now()
    debug('generator.generate', `generated ${theme} for ${id} in ${b - a}ms`)

    return { error: false, message: undefined, id, time: b - a }
}
