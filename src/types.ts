export interface GenerateData {
  id: string
  theme: string
  user?: GenerateUserData
  story: boolean
  hide_username: boolean
  return_image: boolean
  data: TemplateData
}

export interface GenerateUserData {
  name: string
  username: string
  image?: string
  scrobbles: number
}

export interface TemplateData {
}

export interface DuotoneData extends TemplateData {
  items: DuotoneItemData[]
  title: string
  subtitle: string
  palette: [string, string]
}

export interface DuotoneItemData {
  image: string
  name: string
  secondary?: string
}

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
