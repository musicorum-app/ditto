import { createCanvas } from '@napi-rs/canvas'
import { Quadro } from '@musicorum/quadro'
import chroma from 'chroma-js'
import { isImageCached, saveImage } from '../../imaging.js'
import { loadImage } from './toolbox.js'

export const duotonify = async (id: string, dimensions: number, palette: [string, string]) => {
  if (isImageCached(id + 'duotone', dimensions)) return

  const img = await loadImage(id, dimensions)
  const scale = chroma.scale(palette)
  const canvas = createCanvas(dimensions, dimensions)
  const qdr = new Quadro(canvas.getContext('2d'))

  qdr.drawImage(img, 0, 0, qdr.width, qdr.height)
  // @ts-ignore
  qdr.changePixeldata(({ rgba }) => {
    const avg = (rgba[0] + rgba[1] + rgba[2]) / 3
    const newColor = scale(avg / 255).rgb(true)
    return [...newColor, 255]
  })

  await saveImage(id + 'duotone', dimensions, canvas.toBuffer('image/jpeg'))
}
