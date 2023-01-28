import { CollageData } from '../../types.js'
import asymmetricCollage from './asymmetricCollage.js'
import { COLLAGE_TILE_SIZE, PAD_SIZE } from '../constants.js'
import { create } from '../utils/toolbox.js'
import { CollageEntityTypes, drawTile, getImagesBeforehand } from '../utils/collages.js'

const determineSize = ({ rows, columns, padded }: CollageData): [number, number] => {
  const horizontalPadding = padded ? (rows + 1) * PAD_SIZE : 0
  const verticalPadding = padded ? (columns + 1) * PAD_SIZE : 0
  return [rows * COLLAGE_TILE_SIZE + horizontalPadding, columns * COLLAGE_TILE_SIZE + verticalPadding]
}

const sanityCheck = (data: CollageData) => {
  if (data.rows > 15 || data.columns > 15) {
    throw new Error('Too many rows or columns')
  }
  if (!data.username || !data.entity) {
    throw new Error('Missing username or entity')
  }
}

export default async (id: string, data: CollageData): Promise<void> => {
  sanityCheck(data)
  if (data.asymmetric) return asymmetricCollage(id, data)
  const { ctx, finish } = create(...determineSize(data), data.padded)
  const entities = await CollageEntityTypes[data.entity](data.username, data.rows * data.columns, data.period)
  await getImagesBeforehand(entities, COLLAGE_TILE_SIZE)

  await Promise.allSettled(entities.map((tile, index) => drawTile(tile, index, ctx, data)))

  return finish(id)
}