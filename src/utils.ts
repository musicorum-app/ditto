import { readFile } from 'node:fs/promises'
export const getVersion = async (): Promise<string> => {
    const file = JSON.parse(await readFile('./package.json').then((x) => x.toString()))
    return file.version
}
