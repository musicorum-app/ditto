import { Canvas, Image, SKRSContext2D } from '@napi-rs/canvas'
import { GENERATION_CACHE_DIR } from '../../imaging.js'
import { writeFile } from 'node:fs/promises'
import { createCanvas } from '@napi-rs/canvas'
import { unlinkSync } from 'node:fs'

const finish = async (canvas: Canvas, id: string): Promise<any> => {
  const buffer = await canvas.encode('jpeg', 95)
  return writeFile(`${GENERATION_CACHE_DIR}/${id}.jpg`, buffer)
}

export const deleteGeneratedImage = async (id: string): Promise<void> => {
  try {
    unlinkSync(`${GENERATION_CACHE_DIR}/${id}.jpg`)
  } catch {
    // ignore
  }
}
interface CreatedCanvas {
  ctx: SKRSContext2D
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

// given a determined hex color, returns a lighter or darker version of it
export const colorVariation = (color: string, variation: number): string => {
  // if val is positive, we'll make the color lighter. else, darker. 0-100
  const hex = color.replace('#', '')
  let r = parseInt(hex.substr(0, 2), 16)
  let g = parseInt(hex.substr(2, 2), 16)
  let b = parseInt(hex.substr(4, 2), 16)
  r = Math.min(255, Math.max(0, r + Math.round(r * (variation / 100))))
  g = Math.min(255, Math.max(0, g + Math.round(g * (variation / 100))))
  b = Math.min(255, Math.max(0, b + Math.round(b * (variation / 100))))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

// given a determined hex color, returns black or white, depending on the contrast
export const contrastColor = (hex: string): string => {
  const r = parseInt(hex.substr(1, 2), 16)
  const g = parseInt(hex.substr(3, 2), 16)
  const b = parseInt(hex.substr(5, 2), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness >= 128 ? '#000000' : '#ffffff'
}

// given a canvas context, clips an image to a circle and draws it on the canvas
export const drawCircleImage = (ctx: SKRSContext2D, image: Image, x: number, y: number, radius: number): void => {
  ctx.save()
  ctx.beginPath()
  ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2, true)
  ctx.closePath()
  ctx.clip()
  ctx.drawImage(image, x, y, radius * 2, radius * 2)
  ctx.restore()
}

// draws a rectangle with a subtle gradient using a color and its darker version
export const drawGradientRectangle = (ctx: SKRSContext2D, x: number, y: number, width: number, height: number, color: string, rounded: number = 0): void => {
  const gradient = ctx.createLinearGradient(0, y, 0, y + height)
  gradient.addColorStop(0, color)
  gradient.addColorStop(1, colorVariation(color, -35))
  ctx.fillStyle = gradient
  if (rounded > 0) {
    drawRoundedRectangle(ctx, x, y, width, height, rounded)
    ctx.fill()
  } else {
    ctx.fillRect(x, y, width, height)
  }
}

export const drawRoundedRectangle = (ctx: SKRSContext2D, x: number, y: number, width: number, height: number, radius: number): void => {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + width, y, x + width, y + height, radius)
  ctx.arcTo(x + width, y + height, x, y + height, radius)
  ctx.arcTo(x, y + height, x, y, radius)
  ctx.arcTo(x, y, x + width, y, radius)
  ctx.closePath()
}

export const indexOrZero = (arr: any[], index: number): any => arr[index] || arr[0]

export const writeTextConsideringWidth = (ctx: SKRSContext2D, text: string, x: number, y: number, maxWidth: number): void => {
  // if the text is too long, we'll reduce the size
  let ogSize = parseInt(indexOrZero(ctx.font.split('px')[0].split(' '), 1))

  const textSize = ctx.measureText(text)
  while (ctx.measureText(text).width > maxWidth) {
    ctx.font = ctx.font.replace(`${ogSize}px`, `${--ogSize}px`)
  }
  ctx.fillText(text, x, y)
}

export const writeTextCentralizedConsidering = (ctx: SKRSContext2D, text: string, leftBoundary: number, y: number, maxWidth: number): void => {
  const textSize = ctx.measureText(text)
  writeTextConsideringWidth(ctx, text, Math.abs(leftBoundary + (maxWidth - textSize.width) / 2), y, maxWidth)
}

export const drawTextShadow = (ctx: SKRSContext2D, text: string, x: number, y: number): void => {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
  ctx.fillText(text, x + 1, y + 2)
}

export const readableNumber = (number: number): string => {
  // adds suffixes to numbers, like 1k, 1m, 1b, etc. also adds commas to separate thousands
  if (number < 1000) return number.toString()
  if (number < 1000000) return (number / 1000).toFixed(1) + 'k'
  if (number < 1000000000) return (number / 1000000).toFixed(1) + 'm'
  return (number / 1000000000).toFixed(1) + 'b'
}

export const drawTextWrapped = (ctx: SKRSContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): void => {
  const words = text.split(' ')
  let line = ''
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' '
    const metrics = ctx.measureText(testLine)
    const testWidth = metrics.width
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, y)
      line = words[n] + ' '
      y += lineHeight
    } else {
      line = testLine
    }
  }
  ctx.fillText(line, x, y)
}