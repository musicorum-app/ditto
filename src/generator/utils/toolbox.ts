import { Canvas, createCanvas, Image, SKRSContext2D } from '@napi-rs/canvas'
import { extractIDFromURL, GENERATION_CACHE_DIR, getImage, getImageFromDisk } from '../../imaging.js'
import { writeFile } from 'node:fs/promises'
import { Quadro } from '@musicorum/quadro'

const finish = async (canvas: Canvas, id: string): Promise<any> => {
  const buffer = await canvas.encode('jpeg', 95)
  return writeFile(`${GENERATION_CACHE_DIR}/${id}.jpg`, buffer)
}

interface CreatedCanvas {
  ctx: SKRSContext2D
  finish: (id: string) => Promise<void>
}

interface CreatedQuadroCanvas {
  ctx: Quadro
  finish: (id: string) => Promise<void>
}

export const create = (width: number, height: number, fillWithBlack: boolean = false): CreatedCanvas => {
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  if (fillWithBlack) {
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, width, height)
  }

  return { ctx, finish: (id: string) => finish(canvas, id) }
}

export const createQuadro = (width: number, height: number, fillWithBlack: boolean = false): CreatedQuadroCanvas => {
  const canvas = createCanvas(width, height)
  const ctx = new Quadro(canvas.getContext('2d'))

  if (fillWithBlack) {
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, width, height)
  }

  return { ctx, finish: (id: string) => finish(canvas, id) }
}

export const loadImage = async (image: string, size: number): Promise<Image> => {
  const buffer = await getImage(extractIDFromURL(image) || image, size)
  const img = new Image()
  img.src = buffer
  return img
}

export const loadImageFromDisk = async (id: string, size: number): Promise<Image> => {
  const d = await getImageFromDisk(id, size)
  const img = new Image()
  img.src = d!
  return img
}

export const createShadowGradient = (ctx: SKRSContext2D, x: number, y: number, width: number, height: number): void => {
  const gradient = ctx.createLinearGradient(0, y, 0, y + height)
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.62)')
  gradient.addColorStop(0.9, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(x, y, width, height)
}

export const drawStrokedText = (ctx: SKRSContext2D, text: string, x: number, y: number): void => {
  ctx.strokeText(text, x, y)
  ctx.fillText(text, x, y)
}

export const font = (name: string, size: number): string => `${size}px ${name}, Noto Current, Apple Color Emoji`
