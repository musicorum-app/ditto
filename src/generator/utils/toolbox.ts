import { Canvas, SKRSContext2D } from '@napi-rs/canvas'
import { GENERATION_CACHE_DIR } from '../../imaging.js'
import { writeFile } from 'node:fs/promises'
import { createCanvas } from '@napi-rs/canvas'

const finish = async (canvas: Canvas, id: string): Promise<any> => {
  const buffer = await canvas.encode('jpeg', 95)
  return writeFile(`${GENERATION_CACHE_DIR}/${id}.jpg`, buffer)
}

interface CreatedCanvas {
  ctx: SKRSContext2D
  finish: (id: string) => Promise<void>
}
export const create = (width: number, height: number): CreatedCanvas => {
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  return { ctx, finish: (id: string) => finish(canvas, id) }
}