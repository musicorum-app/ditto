import { CollageData } from '../../types.js'
import { create } from '../utils/toolbox.js'
import { drawTile, getImagesBeforehandVariation } from '../utils/collages.js'
import { PAD_SIZE } from '../constants.js'

const SIZES = [600, 400, 300]

const determineLinePerIndex = (position: number, index: number): number => {
  // the first four elements belong to line 1, the next 6 to line 2, the next 6 to line 3, the next 8 to line 4, the next 8 to line 5, the next 8 to line 5
  if (position === 0 && index < 4) return 0
  // position 1 has indexes from 0 to 11. first half is line 0, second half is line 1
  if (position === 1 && index < 6) return 0
  if (position === 1 && index < 12) return 1
  // position 2 has indexes from 0 to 24. first 8 are line 0, next 8 are line 1, next 8 are line 2
  if (position === 2 && index < 8) return 0
  if (position === 2 && index < 16) return 1
  if (position === 2 && index < 24) return 2
  else return 0
}

const determinePositionAndSize = (position: number): (unknown, number) => [[number, number], number] => {
  return (_, index) => {
    const line = determineLinePerIndex(position, index)


    if (position === 0) return [[PAD_SIZE * (index + 1) + SIZES[0] * index, PAD_SIZE], SIZES[0]]
    if (position === 1) return [
      [(PAD_SIZE - 3) * ((index % 6) + 1) + SIZES[1] * (index % 6), PAD_SIZE * (1 + (line + 1)) + SIZES[0] + (line * SIZES[1])],
      SIZES[1]
    ]
    else return [
      [(PAD_SIZE - 4.5) * ((index % 8) + 1) + SIZES[2] * (index % 8), (PAD_SIZE - 1) * (3 + (line + 1)) + SIZES[0] + (SIZES[1] * 2) + (line * SIZES[2])],
      SIZES[2]
    ]
  }
}

const determineRows = (tiles: Array<unknown> = new Array(40).fill(0)): [[number, number], number][] => {
  return [
    tiles.slice(0, 4),
    tiles.slice(4, 16),
    tiles.slice(-24)
  ].flatMap((part, index) => part.map(determinePositionAndSize(index)))
}

const ORDERING = determineRows()

export default async (id: string, data: CollageData): Promise<void> => {
  const { ctx, finish } = create(2450, 2360, true)

  await getImagesBeforehandVariation(data.tiles, ORDERING)

  await Promise.allSettled(data.tiles.map((tile, index) => drawTile(tile, index, ctx, data, ORDERING[index][1], ORDERING[index][0])))

  return finish(id)
}
