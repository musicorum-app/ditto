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
  username: string
  entity: string
  asymmetric?: boolean
  rows: number
  columns: number
}

export interface GeneratorResponse {
  error: boolean
  message: string | undefined
  id: string | undefined
  time?: number
}