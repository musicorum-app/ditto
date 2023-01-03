import Client from '@musicorum/lastfm'
import { backend } from '../caching/index.js'
import { debug } from '../logging.js'
import { Entity } from './types.js'

// This is the API key for the last.fm mobile app.
// We are using it here because it returns artist's images properly.
const FM_API_KEY = '308ad08f8211e5cbcd7cb886eb95a2db'
const client = new Client(FM_API_KEY)

const cachedRequest = async (method: string, params: Record<string, string>) => {
  const c = await backend().get(`${method}${JSON.stringify(params)}`)
  if (c) {
    debug('fm.cachedRequest', `cache hit for ${method} (user = ${params.user})`)
    return c
  }

  const r = await client.request(method, params)
  await backend().set(`${method}${JSON.stringify(params)}`, r)
  return r
}

export const getTopArtists = async (user: string, amount: number = 50): Promise<Entity[]> => {
  const response = await cachedRequest('user.getTopArtists', { user, limit: amount.toString() })
  return response.topartists.artist.map(sanitizeEntity)
}

export const getTopTracks = async (user: string, amount: number = 50): Promise<Entity[]> => {
  const response = await cachedRequest('user.getTopTracks', { user, limit: amount.toString() })
  return response.topartists.artist.map(sanitizeEntity)
}

export const getTopAlbums = async (user: string, amount: number = 50): Promise<Entity[]> => {
  const response = await cachedRequest('user.getTopAlbums', { user, limit: amount.toString() })
  return response.topartists.artist.map(sanitizeEntity)
}

function sanitizeEntity (entity: Record<string, any>): Entity {
  return {
    mbid: entity.mbid || undefined,
    name: entity.name as string,
    imageURL: (entity.image[3]['#text']) as string,
    playcount: entity.playcount || '0'
  }
}