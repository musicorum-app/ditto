import { Entity } from '../../fm/types.js'
import { extractIDFromURL, getImage } from '../../imaging.js'
import { downloadImages, downloadImagesWithObjects } from '../../pool/pool.js'
import { getTopAlbums, getTopArtists, getTopTracks } from '../../fm/index.js'
import { CollageData } from '../../types.js'
import { COLLAGE_TILE_SIZE, PAD_SIZE } from '../constants.js'
import { Image, SKRSContext2D } from '@napi-rs/canvas'
import { debug } from '../../logging.js'
import { createShadowGradient, font } from './toolbox.js'

export interface CollageTile {
  image: string
  name: string
  sub: string | undefined
}

export const getImagesBeforehand = async (entities: Entity[], dimensions: number = 300): Promise<void> => {
  await downloadImages(entities.map(z => extractIDFromURL(z.imageURL)!), dimensions)
}

export const getImagesBeforehandVariation = async (entities: Entity[], position: [unknown, number][]): Promise<void> => {
  await downloadImagesWithObjects(entities.map((z, i) => {
    return {
      id: extractIDFromURL(z.imageURL)!,
      size: position[i][1]
    }
  }))
}

export const CollageEntityTypes = {
  artist: getTopArtists,
  album: getTopAlbums,
  track: getTopTracks
}

const determineTilePosition = (index: number, { columns, padded }: CollageData): [number, number] => {
  const row = Math.floor(index / columns)
  const column = index % columns
  const horizontalPadding = padded ? (row + 1) * PAD_SIZE : 0
  const verticalPadding = padded ? (column + 1) * PAD_SIZE : 0
  return [column * COLLAGE_TILE_SIZE + verticalPadding, row * COLLAGE_TILE_SIZE + horizontalPadding]
}

export const drawTile = async (tile: Entity, index: number, ctx: SKRSContext2D, data: CollageData, size: number = COLLAGE_TILE_SIZE, position?: [number, number]) => {
  const [x, y] = !position ? determineTilePosition(index, data) : position
  debug('classicCollage.drawTile', `drawing tile for ${tile.name} at (${x}, ${y})`)
  const buffer = await getImage(extractIDFromURL(tile.imageURL)!, size)
  const image = new Image()
  image.src = buffer
  ctx.drawImage(image, x, y, size, size)

  if (data.show_labels) {
    createShadowGradient(ctx, x, y, size, size * 0.3)
    ctx.fillStyle = 'white'

    let fontSize = 20
    ctx.font = font('Inter Semi Bold', fontSize)

    let text = tile.name
    do {
      fontSize -= 1
      ctx.font = font('Inter Semi Bold', fontSize)
      if (fontSize === 16) {
        while (ctx.measureText(text).width > size - 7) {
          text = text.slice(0, -1)
        }
        text = text.slice(0, -3) + '...'
      }
    } while (ctx.measureText(text).width > size - 7)

    ctx.fillText(text, x + 5, y + fontSize + 5)

    if (data.show_play_count !== false) {
      ctx.font = font('Plex Sans Regular', 18)
      ctx.fillText(`${tile.playcount} scrobble${tile.playcount === 1 ? '' : 's'}`, x + 5, y + fontSize + 5 + 24)
    }
  }
}