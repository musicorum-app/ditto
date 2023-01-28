import { readdirSync } from 'node:fs'
import { debug, error } from '../logging.js'
import { getFontNameFromPath } from '../utils.js'
import { GlobalFonts } from '@napi-rs/canvas'

// returns the path to all ttf files in the fonts directory recursively
export const getFontPaths = (path: string): string[] => {
  const files = readdirSync(path, { withFileTypes: true })
  const paths = files
    .filter((x) => x.isFile())
    .filter((x) => x.name.endsWith('.ttf'))
    .map((x) => `${path}/${x.name}`)

  const folders = files.filter((x) => x.isDirectory()).map((x) => `${path}/${x.name}`)

  return [...paths, ...folders.flatMap((x) => getFontPaths(x))]
}

export const loadFonts = (): void => {
  const paths = getFontPaths('./assets/fonts')
  for (const path of paths) {
    const name = getFontNameFromPath(path)
    debug('generator.fonts', `registering font ${name}...`)
    const result = GlobalFonts.registerFromPath(path, name)
    if (!result) {
      error('generator.fonts', `failed to register font ${name}!`)
    }
  }
}