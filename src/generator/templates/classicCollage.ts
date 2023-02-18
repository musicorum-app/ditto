import { CollageData } from '../../types.js'
import { COLLAGE_TILE_SIZE, PAD_SIZE } from '../constants.js'
import { create } from '../utils/toolbox.js'
import { drawTile, getImagesBeforehand } from '../utils/collages.js'

const determineSize = ({ rows, columns, padded }: CollageData): [number, number] => {
  const horizontalPadding = padded ? (rows + 1) * PAD_SIZE : 0
  const verticalPadding = padded ? (columns + 1) * PAD_SIZE : 0
  return [rows * COLLAGE_TILE_SIZE + horizontalPadding, columns * COLLAGE_TILE_SIZE + verticalPadding]
}

export default async (id: string, data: CollageData): Promise<void> => {
  const { ctx, finish } = create(...determineSize(data), data.padded)
  await getImagesBeforehand(data.tiles, COLLAGE_TILE_SIZE)

  await Promise.allSettled(data.tiles.map((tile, index) => drawTile(tile, index, ctx, data)))

  return finish(id)
}
