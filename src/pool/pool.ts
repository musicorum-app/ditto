import { Piscina } from 'piscina'
import { isImageCached } from '../imaging.js'

const pool = new Piscina({
  filename: new URL('./pool/worker.js', import.meta.url).pathname,
  minThreads: process.env.MIN_THREAD_POOL_SIZE || 5
})

const exec = async (key: string, data: unknown[]): Promise<unknown> => {
  return pool.run({ key, data })
}

export const downloadImages = async (ids: string[], dimensions: number): Promise<void> => {
  await Promise.allSettled(ids.filter((id) => !isImageCached(id, dimensions)).map((id) => exec('downloadImage', [id, dimensions])))
}

export const downloadImagesWithObjects = async (ids: {id: string, size: number}[]): Promise<void> => {
  await Promise.allSettled(ids.filter(({ id, size }) => !isImageCached(id, size)).map(({ id, size }) => exec('downloadImage', [id, size])))
}
