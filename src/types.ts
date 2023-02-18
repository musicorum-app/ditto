export interface GenerateData {
  id: string
  theme: string
  story: boolean
  hide_username: boolean
  return_image: boolean
  data: TemplateData
}

export interface TemplateData {}

export interface CollageData extends TemplateData {
  tiles: CollageTileData[]
  rows: number
  columns: number
  padded?: boolean
  show_names?: boolean
  show_playcount?: boolean
}

export interface CollageTileData {
  image: string
  name: string
  sub: string | undefined
}

export interface GeneratorResponse {
  error: boolean
  message: string | undefined
  id: string | undefined
  time?: number
}
