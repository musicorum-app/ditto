import { CollageData } from '../../types.js'
import asymmetricCollage from './asymmetricCollage.js'
import { COLLAGE_TILE_SIZE } from '../constants.js'
import { create } from '../utils/toolbox.js'
import { extractIDFromURL, getImage } from '../../imaging.js'
import { Image, SKRSContext2D } from '@napi-rs/canvas'
import { getTopAlbums, getTopArtists, getTopTracks } from '../../fm/index.js'
import { Entity } from '../../fm/types.js'

const determineSize = ({ rows, columns }: CollageData): [number, number] => {
  return [rows * COLLAGE_TILE_SIZE, columns * COLLAGE_TILE_SIZE]
}

const determineTilePosition = (index: number, { columns }: CollageData): [number, number] => {
  const row = Math.floor(index / columns)
  const column = index % columns
  return [row * COLLAGE_TILE_SIZE, column * COLLAGE_TILE_SIZE]
}

const drawTile = async (tile: Entity, index: number, ctx: SKRSContext2D, data: CollageData) => {
  const [x, y] = determineTilePosition(index, data)
  const buffer = await getImage(extractIDFromURL(tile.imageURL)!, COLLAGE_TILE_SIZE)
  const image = new Image()
  image.src = buffer
  ctx.drawImage(image, x, y, COLLAGE_TILE_SIZE, COLLAGE_TILE_SIZE)
}

const CollageEntityTypes = {
  artist: getTopArtists,
  album: getTopAlbums,
  track: getTopTracks
}

const sanityCheck = (data: CollageData) => {
  if (data.rows > 12 || data.columns > 12) {
    throw new Error('Too many rows or columns')
  }
  if (!data.username || !data.entity) {
    throw new Error('Missing username or entity')
  }
}

export default async (id: string, data: CollageData): Promise<void> => {
  sanityCheck(data)
  if (data.asymmetric) return asymmetricCollage(id, data)
  const { ctx, finish } = create(...determineSize(data))
  const entities = await CollageEntityTypes[data.entity](data.username, data.rows * data.columns)
  await Promise.allSettled(entities.map((tile, index) => drawTile(tile, index, ctx, data)))
  return finish(id)
}