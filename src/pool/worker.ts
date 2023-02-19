import { downloadImage, isImageCached } from '../imaging.js'
import { debug } from '../logging.js'
import { duotonify } from '../generator/utils/duotone.js'

debug('pool.worker', `worker started`)

const internalDownload = async (id: string, dimensions: number = 300): Promise<boolean> => {
  if (isImageCached(id, dimensions)) {
    return true
  } else {
    await downloadImage(id, dimensions).then(() => undefined)
    return true
  }
}

export default async ({ key, data }: { key: string, data: any[] }) => {
  switch (key) {
    case 'downloadImage':
      // @ts-ignore
      return internalDownload(...data)
    case 'duotonify':
      // @ts-ignore
      return duotonify(...data)
    default:
      throw new Error(`unknown key ${key}`)
  }
}
