import { downloadImage, isImageCached } from '../imaging.js'
import { debug } from '../logging.js'

declare var self: Worker

debug('pool.worker', `worker started`)

const internalDownload = async (id: string, dimensions: number = 300): Promise<boolean> => {
    if (isImageCached(id, dimensions)) {
        return true
    } else {
        await downloadImage(id, dimensions).then(() => undefined)
        return true
    }
}

self.onmessage = async (event: MessageEvent) => {
    const { taskId, key, data } = event.data

    try {
        let result: unknown

        switch (key) {
            case 'downloadImage':
                // @ts-ignore
                result = await internalDownload(...data)
                break
            default:
                throw new Error(`unknown key ${key}`)
        }

        postMessage({ taskId, result, error: null })
    } catch (error) {
        postMessage({
            taskId,
            result: null,
            error: error instanceof Error ? error.message : String(error)
        })
    }
}
