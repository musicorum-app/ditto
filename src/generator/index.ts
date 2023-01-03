import asymmetricCollage from './templates/asymmetricCollage.js'
import classicCollage from './templates/classicCollage.js'
import { GenerateData, TemplateData, GeneratorResponse } from '../types.js'
import { debug, warn } from '../logging.js'

type TemplateFactory = (id: string, data: TemplateData) => Promise<void>
export const templates = {
  'asymmetricCollage': asymmetricCollage as TemplateFactory,
  'classicCollage': classicCollage as TemplateFactory
}

export const generate = async ({ theme, data, id }: GenerateData): Promise<GeneratorResponse> => {
  if (!data) return { error: true, message: 'No data provided', id: undefined }
  id = id || Math.random().toString(36).substring(2)
  theme = theme === 'grid' ? 'classicCollage' : theme

  const factory: TemplateFactory = templates[theme]
  if (!factory) return { error: true, message: 'Invalid theme', id: undefined }

  debug('generator.generate', `generating ${theme} for ${id}`)
  const a = Date.now()
  try {
    await factory(id, data)
  } catch (e) {
    warn('generator.generate', `error generating ${theme} for ${id}: ${e.message}`)
    return { error: true, message: e.message, id: undefined }
  }
  const b = Date.now()
  debug('generator.generate', `generated ${theme} for ${id} in ${b - a}ms`)

  return { error: false, message: undefined, id, time: b - a }
}
