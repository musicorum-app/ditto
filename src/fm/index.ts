import { DEFAULT_IMAGE_ID, getImageURL } from "../imaging.js"
import { Entity } from "./types.js"

const EPISTOLARES_ROOT_URL = process.env.EPISTOLARES_ROOT_URL || "https://epistolares.stg.musicorum.cloud"

const request = async (path: string, params: Record<string, string>) => {
    const url = new URL(path, EPISTOLARES_ROOT_URL)
    url.search = new URLSearchParams(params).toString()
    const response = await fetch(url.toString())
    if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`)
    }

    return response.json()
}

export const getTopArtists = async (
    username: string,
    amount: number = 50,
    period: string = "overall",
): Promise<Entity[]> => {
    const response = await request('/user/charts', {
        username,
        type: 'artist',
        period,
        limit: amount.toString(),
    })
    
    return response.items
        .map(sanitizeEntity)
}

export const getTopTracks = async (
    user: string,
    amount: number = 50,
    period: string = "overall",
): Promise<Entity[]> => {
    const response = await request('/user/charts', {
        username: user,
        type: 'track',
        period,
        limit: amount.toString(),
    })

    return response.items
        .map(sanitizeEntity)
}

export const getTopAlbums = async (
    user: string,
    amount: number = 50,
    period: string = "overall",
): Promise<Entity[]> => {
    const response = await request('/user/charts', {
        username: user,
        type: 'album',
        period,
        limit: amount.toString(),
    })

    return response.items
        .map(sanitizeEntity)
}

function sanitizeEntity(entity: Record<string, any>): Entity {
    return {
        id: entity.id as string,
        name: entity.name as string,
        imageURL: entity.cover?.defaultURL as string || getImageURL(DEFAULT_IMAGE_ID),
        playcount: entity.playCount as number
    }
}
