import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { error, info } from './logging.js'
import { statSync } from 'node:fs'
import { createHash } from 'crypto'

const CACHE_DIR = process.env.CACHE_DIR ?? '.cache/ditto'
export const GENERATION_CACHE_DIR = process.env.EXPORT_DIR ?? `${CACHE_DIR}/generated`

export const DEFAULT_IMAGE_IDS = ['c6f59c1e5e7240a4c0d427abd71f3dbb', '4128a6eb29f94943c9d206c08e625904']
export const DEFAULT_IMAGE_ID = DEFAULT_IMAGE_IDS[1]

export const isDefaultImageID = (id: string): boolean => {
    return DEFAULT_IMAGE_IDS.includes(id)
}

export const createDirectory = async () => {
    await mkdir(CACHE_DIR, { recursive: true })
    await mkdir(GENERATION_CACHE_DIR, { recursive: true })
}

const getImageURL = (id: string, dimensions: number = 300) => {
    // if the id matches the default image id, set dim to 1000
    if (id === DEFAULT_IMAGE_ID || dimensions === 600) {
        dimensions = 1000
    }

    return `https://lastfm.freetls.fastly.net/i/u/${dimensions}x${dimensions}/${id}.jpg`
}
const hashedImageURL = (id: string, dimensions: number = 300) => createHash('sha1').update(getImageURL(id, dimensions)).digest('hex')
const hashedRawImageURL = (url: string, width: number = 300, height: number = 300) => createHash('sha1').update(`${url}-${width}-${height}`).digest('hex')

export const defaultImageURL = getImageURL(DEFAULT_IMAGE_ID)

export const isImageCached = (id: string, dimensions: number = 300): boolean => {
    try {
        const file = statSync(`${CACHE_DIR}/${hashedImageURL(id, dimensions)}.jpg`)
        return !!file
    } catch (_) {
        return false
    }
}

export const extractIDFromURL = (url: string): string => {
    return url.split('/').pop?.()?.split?.('.')?.shift?.() ?? DEFAULT_IMAGE_ID
}

export const getImage = async (id: string, dimensions: number = 300): Promise<Buffer> => {
    const image = await getImageFromDisk(id, dimensions)
    return image || downloadImage(id, dimensions)
}

export const downloadImage = async (id: string, dimensions: number = 300): Promise<Buffer> => {
    // check if cached again
    if (isImageCached(id, dimensions)) {
        const cachedImage = await getImageFromDisk(id, dimensions)
        if (cachedImage) {
            return cachedImage
        }
    }

    info('imaging.downloadImage', `downloading image ${id} with dimensions ${dimensions}`)
    const url = getImageURL(id, dimensions)
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.2 Safari/605.1.15'
        }
    })
    if (!response.ok) {
        error('imaging.downloadImage', `failed to download image for entity ${id} (status code ${response.status})`)
        return getImage(DEFAULT_IMAGE_ID, dimensions)
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    await saveImage(id, dimensions, buffer)
    return buffer
}

const getImageFromDisk = async (id: string, dimensions: number): Promise<Buffer | undefined> => {
    return readFile(`${CACHE_DIR}/${hashedImageURL(id, dimensions)}.jpg`).catch(() => undefined)
}

const saveImage = async (id: string, dimensions: number, image: Buffer) => {
    await writeFile(`${CACHE_DIR}/${hashedImageURL(id, dimensions)}.jpg`, image)
}

const getRawImageFromDisk = async (url: string, width: number = 300, height: number = 300): Promise<Buffer | undefined> => {
    return readFile(`${CACHE_DIR}/${hashedRawImageURL(url, width, height)}.jpg`).catch(() => undefined)
}

const saveRawImage = async (url: string, width: number, height: number, image: Buffer) => {
    await writeFile(`${CACHE_DIR}/${hashedRawImageURL(url, width, height)}.jpg`, image)
}

const downloadRawImage = async (url: string, width: number = 300, height: number = 300): Promise<Buffer> => {
    info('imaging.downloadRawImage', `downloading raw image from ${url}`)
    const response = await fetch(url)
    if (!response.ok) {
        error('imaging.downloadRawImage', `failed to download raw image from ${url} (status code ${response.status})`)
        return Buffer.from([])
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    await saveRawImage(url, width, height, buffer)
    return buffer
}

export const getImageFromUrl = async (url: string, width: number = 300, height: number = 300): Promise<Buffer> => {
    const image = await getRawImageFromDisk(url, width, height)
    return image || downloadRawImage(url, width, height)
}
