import asymmetricCollage from './templates/asymmetricCollage.js'
import classicCollage from './templates/classicCollage.js'
import duotone from './templates/duotune.js'

import { GenerateData, GeneratorResponse, TemplateData } from '../types.js'
import { debug, warn } from '../logging.js'

type TemplateFactory = (id: string, data: TemplateData, genData: GenerateData) => Promise<void>
export const templates = {
  'classic_collage': classicCollage as TemplateFactory,
  'asymmetric_collage': asymmetricCollage as TemplateFactory,
  'duotone': duotone as TemplateFactory
}

export const generate = async (data: GenerateData): Promise<GeneratorResponse> => {
  if (!data) return { error: true, message: 'No data provided', id: undefined }
  data.id = data.id || Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)

  const factory: TemplateFactory = templates[data.theme]
  if (!factory) return { error: true, message: 'Invalid theme', id: undefined }

  debug('generator.generate', `generating ${data.theme} for ${data.id}`)
  const a = Date.now()
  try {
    await factory(data.id, data.data, data)
  } catch (e) {
    warn('generator.generate', `error generating ${data.theme} for ${data.id}: ${e.stack}`)
    return { error: true, message: e.message, id: undefined }
  }
  const b = Date.now()
  debug('generator.generate', `generated ${data.theme} for ${data.id} in ${b - a}ms`)

  return { error: false, message: undefined, id: data.id, time: b - a }
}
