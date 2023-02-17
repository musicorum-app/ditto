import Client from '@musicorum/lastfm'
import { backend } from '../caching/index.js'
import { debug } from '../logging.js'
import { Entity } from './types.js'
import { createHash } from 'crypto'

const client = new Client(process.env.FM_API_KEY!)

const md5 = (text: string) => {
  return createHash('md5').update(text).digest('hex')
}

const cachedRequest = async (method: string, params: Record<string, string>, ttl: number) => {
  debug('fm.cachedRequest', `requesting ${method} with params ${JSON.stringify(params)}`)
  const hash = md5(method + Object.values(params).join('+'))
  const c = await backend!.get(hash)
  if (c) {
    debug('fm.cachedRequest', `cache hit for ${method} (hash = ${hash})`)
    return JSON.parse(c)
  }
  debug('fm.cachedRequest', `cache miss for ${method} (hash = ${hash})`)

  const r = await client.request(method, params).catch(() => undefined)
  if (!r) return

  await backend!.setTTL(hash, JSON.stringify(r), ttl)
  debug('fm.cachedRequest', `cached ${method} (hash = ${hash})`)
  return r
}

export const getTopArtists = async (user: string, amount: number = 50, period: string = 'overall'): Promise<Entity[]> => {
  const response = await cachedRequest('user.getTopArtists', { user, limit: amount.toString(), period }, 30 * 60 * 1000)
  const added = await Promise.all(response.topartists.artist.map(addArtistCovers(user)))
  return added.map(sanitizeEntity).sort((a, b) => b.playcount - a.playcount)
}

export const getTopTracks = async (user: string, amount: number = 50, period: string = 'overall'): Promise<Entity[]> => {
  const response = await cachedRequest('user.getTopTracks', { user, limit: amount.toString(), period }, 30 * 60 * 1000)
  return response.toptracks.track.map(sanitizeEntity).sort((a, b) => b.playcount - a.playcount)
}

export const getTopAlbums = async (user: string, amount: number = 50, period: string = 'overall'): Promise<Entity[]> => {
  const response = await cachedRequest('user.getTopAlbums', { user, limit: amount.toString(), period }, 30 * 60 * 1000)
  return response.topalbums.album.map(sanitizeEntity).sort((a, b) => b.playcount - a.playcount)
}

function sanitizeEntity (entity: Record<string, any>): Entity {
  return {
    mbid: entity.mbid || undefined,
    name: entity.name as string,
    imageURL: (entity.image[3]['#text']) as string,
    playcount: parseInt(entity.playcount) || 0
  }
}

function addArtistCovers (username: string) {
  return async (artist: Record<string, any>) => {
    const info = await cachedRequest('artist.getInfo', { artist: artist.name, username, track: '' }, 60 * 60 * 1000)
    artist.image = info.artist.image
    return artist
  }
}
