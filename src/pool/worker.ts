import { downloadImage, isImageCached } from '../imaging.js'
import { debug } from '../logging.js'

debug('pool.worker', `worker started`)

const internalDownload = async (id: string, dimensions: number = 300): Promise<boolean> => {
    if (await isImageCached(id, dimensions)) {
      return true
    } else {
      await downloadImage(id, dimensions).then(() => undefined)
      return true
    }
}

export default ({ key, data }: { key: string, data: unknown[] }) => {
  switch (key) {
    case 'downloadImage':
      // TODO: fix this (too lazy to do it)
      // @ts-ignore
      return internalDownload(...data)
    default:
      throw new Error(`unknown key ${key}`)
  }
}