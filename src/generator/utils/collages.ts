import { Entity } from '../../fm/types.js'
import { extractIDFromURL } from '../../imaging.js'
import { downloadImages } from '../../pool/pool.js'

export interface CollageTile {
  image: string
  name: string
  sub: string | undefined
}

export const getImagesBeforehand = async (entities: Entity[], dimensions: number = 300): Promise<void> => {
  await downloadImages(entities.map(z => extractIDFromURL(z.imageURL)!), dimensions)
}