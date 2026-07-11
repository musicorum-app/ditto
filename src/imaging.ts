import { mkdir, readFile, writeFile, stat } from 'node:fs/promises'
import { error, info } from './logging.js'
import { createHash } from 'crypto'

export const CACHE_DIR = process.env.CACHE_DIR ?? '.cache/ditto'
export const GENERATION_CACHE_DIR = process.env.EXPORT_DIR ?? `${CACHE_DIR}/generated`
export const BLUEPRINT_CACHE_DIR = process.env.OUTPUT_BLUEPRINT_DIR ?? `${CACHE_DIR}/blueprints`

export const DEFAULT_IMAGE_IDS = ['c6f59c1e5e7240a4c0d427abd71f3dbb', '4128a6eb29f94943c9d206c08e625904']
export const DEFAULT_IMAGE_ID = DEFAULT_IMAGE_IDS[1]

export const isDefaultImageID = (id: string): boolean => {
    return DEFAULT_IMAGE_IDS.includes(id)
}

export const createDirectory = async () => {
    await mkdir(CACHE_DIR, { recursive: true })
    await mkdir(GENERATION_CACHE_DIR, { recursive: true })
    await mkdir(BLUEPRINT_CACHE_DIR, { recursive: true })
}

export const isImageCached = async (id: string, dimensions: number = 300): Promise<boolean> => {
    try {
        const file = await stat(`${CACHE_DIR}/${hashedImageURL(id, dimensions)}.jpg`)
        return !!file
    } catch (_) {
        return false
    }
}

const pendingDownloads = new Map<string, Promise<Buffer>>()

export const getImageURL = (id: string, dimensions: number = 300) => {
    if (id === DEFAULT_IMAGE_ID || dimensions === 600) {
        dimensions = 1000
    }
    return `https://lastfm.freetls.fastly.net/i/u/${dimensions}x${dimensions}/${id}.jpg`
}

export const defaultImageURL = getImageURL(DEFAULT_IMAGE_ID)

const hashedImageURL = (id: string, dimensions: number = 300) => 
    createHash('sha1').update(getImageURL(id, dimensions)).digest('hex')

export const extractIDFromURL = (url: string): string => {
    if (!url) return DEFAULT_IMAGE_ID;
    return url.split('/').pop()?.split('.')[0] ?? DEFAULT_IMAGE_ID;
}

export const getImageFromDisk = async (hash: string): Promise<Buffer | undefined> => {
    return readFile(`${CACHE_DIR}/${hash}.jpg`).catch(() => undefined)
}

export const saveImage = async (hash: string, image: Buffer) => {
    writeFile(`${CACHE_DIR}/${hash}.jpg`, image).catch(err => 
        error('imaging.saveImage', `Failed to save image ${hash}: ${err}`)
    )
}

export const getImage = async (id: string, dimensions: number = 300): Promise<Buffer> => {
    const hash = hashedImageURL(id, dimensions)

    const cachedImage = await getImageFromDisk(hash)
    if (cachedImage) return cachedImage

    if (pendingDownloads.has(hash)) {
        return pendingDownloads.get(hash)!
    }

    const downloadPromise = downloadImage(id, dimensions, hash).finally(() => {
        pendingDownloads.delete(hash)
    })

    pendingDownloads.set(hash, downloadPromise)
    return downloadPromise
}

export const downloadImage = async (id: string, dimensions: number, hash: string): Promise<Buffer> => {
    info('imaging.downloadImage', `downloading image ${id} with dimensions ${dimensions}`)
    const url = getImageURL(id, dimensions)
    
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.2 Safari/605.1.15'
        }
    })

    if (!response.ok) {
        if (response.status === 404) {
            return downloadImage(id, 500, hash) // save with the current hash to avoid re-downloading
        }

        error('imaging.downloadImage', `failed to download image for entity ${url} (status code ${response.status})`)
        return getImage(DEFAULT_IMAGE_ID, dimensions)
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    
    saveImage(hash, buffer) 
    
    return buffer
}