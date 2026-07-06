import { Canvas, createCanvas, Image, SKRSContext2D, loadImage as napiLoadImage } from '@napi-rs/canvas'
import { extractIDFromURL, GENERATION_CACHE_DIR, getImage, getImageFromDisk } from '../../imaging.js'
import { writeFile, unlink } from 'fs/promises'

const finish = async (canvas: Canvas, id: string): Promise<any> => {
    const buffer = await canvas.encode('jpeg', 95)
    return writeFile(`${GENERATION_CACHE_DIR}/${id}.jpg`, buffer)
}

export const deleteGeneratedImage = async (id: string): Promise<void> => {
    try {
        await unlink(`${GENERATION_CACHE_DIR}/${id}.jpg`)
    } catch {
        // ignore
    }
}

export const finishBuffer = async (buffer: Buffer, id: string): Promise<any> => {
  return writeFile(`${GENERATION_CACHE_DIR}/${id}.jpg`, buffer)
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

export const createQuadro = (width: number, height: number, fillWithBlack: boolean = false): CreatedQuadroCanvas => {
  const canvas = createCanvas(width, height)
  const ctx = new Quadro(canvas.getContext('2d'))

  if (fillWithBlack) {
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, width, height)
  }

  return { ctx, finish: (id: string) => finish(canvas, id) }
}

export const loadImage = async (image: string, size: number) => {
  const buffer = await getImage(extractIDFromURL(image) || image, size);
  // This decodes the image asynchronously in Rust, freeing the Node event loop
  return await napiLoadImage(buffer); 
}

export const loadImageFromDisk = async (id: string, size: number) => {
  const d = await getImageFromDisk(id, size);
  if (!d) throw new Error("Image not found on disk");
  return await napiLoadImage(d);
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
    const hex = color.replace('#', '');
    let r = parseInt(hex.slice(0, 2), 16);
    let g = parseInt(hex.slice(2, 4), 16);
    let b = parseInt(hex.slice(4, 6), 16);
    
    const factor = variation / 100;
    r = Math.min(255, Math.max(0, r + Math.round(r * factor)));
    g = Math.min(255, Math.max(0, g + Math.round(g * factor)));
    b = Math.min(255, Math.max(0, b + Math.round(b * factor)));
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// given a determined hex color, returns black or white, depending on the contrast
export const contrastColor = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness >= 128 ? '#000000' : '#ffffff';
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

export const writeTextConsideringWidth = (
    ctx: SKRSContext2D, 
    text: string, 
    x: number, 
    y: number, 
    maxWidth: number, 
    alignCenter: boolean = false
): void => {
    const fontMatch = ctx.font.match(/^(\d+)px\s+(.+)$/);
    if (!fontMatch) {
        ctx.fillText(text, x, y);
        return;
    }

    let size = parseInt(fontMatch[1], 10);
    const fontFamily = fontMatch[2];

    while (size > 10 && ctx.measureText(text).width > maxWidth) {
        size -= 1;
        ctx.font = `${size}px ${fontFamily}`;
    }

    if (alignCenter) {
        const finalWidth = ctx.measureText(text).width;
        x = Math.abs(x + (maxWidth - finalWidth) / 2);
    }

    ctx.fillText(text, x, y);
}

export const writeTextCentralizedConsidering = (ctx: SKRSContext2D, text: string, leftBoundary: number, y: number, maxWidth: number): void => {
    writeTextConsideringWidth(ctx, text, leftBoundary, y, maxWidth, true);
}

export const drawTextShadow = (ctx: SKRSContext2D, text: string, x: number, y: number): void => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    ctx.fillText(text, x + 1, y + 2)
}
const numberFormatter = new Intl.NumberFormat('en-US', { 
    notation: "compact", 
    maximumFractionDigits: 1 
});

export const readableNumber = (number: number): string => {
    return numberFormatter.format(number).toLowerCase()
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
