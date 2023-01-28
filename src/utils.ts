import { readFile } from 'node:fs/promises'
export const getVersion = async (): Promise<string> => {
    const file = JSON.parse(await readFile('./package.json').then((x) => x.toString()))
    return file.version
}

// convert camel case to spaces. e.g. "AppleColorEmoji" -> "Apple Color Emoji"
export const getFontNameFromPath = (str: string): string => {
    return str.split('/').pop()!.replaceAll(/([A-Z])/g, ' $1').trim().replaceAll('-', '').replace('.ttf', '')
}