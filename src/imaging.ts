import { writeFile, mkdir, readFile } from 'node:fs/promises'
import { error, info } from './logging.js'
import { statSync } from 'node:fs'
import { createHash } from 'crypto'

const CACHE_DIR = process.env.CACHE_DIR ?? '.cache/ditto'
export const GENERATION_CACHE_DIR = process.env.EXPORT_DIR ?? `${CACHE_DIR}/generated`

const DEFAULT_IMAGE_ID = '4128a6eb29f94943c9d206c08e625904'

export const createDirectory = async () => {
    await mkdir(CACHE_DIR, { recursive: true })
    await mkdir(GENERATION_CACHE_DIR, { recursive: true })
}

const getImageURL = (id: string, dimensions: number = 300) => `https://lastfm.freetls.fastly.net/i/u/${dimensions}x${dimensions}/${id}.jpg`
const hashedImageURL = (id: string, dimensions: number = 300) => createHash('sha1').update(getImageURL(id, dimensions)).digest('hex')

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
    info('imaging.downloadImage', `downloading image ${id} with dimensions ${dimensions}`)
    const url = getImageURL(id, dimensions)
    const response = await fetch(url)
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
