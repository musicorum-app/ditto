import { Piscina } from 'piscina'

const pool = new Piscina({
  filename: new URL('./pool/worker.js', import.meta.url).pathname,
  minThreads: process.env.MIN_THREAD_POOL_SIZE || 10
})

const exec = async (key: string, data: unknown[]): Promise<unknown> => {
  return pool.run({ key, data })
}

export const downloadImages = async (ids: string[], dimensions: number): Promise<void> => {
  await Promise.allSettled(ids.map((id) => exec('downloadImage', [id, dimensions])))
}