import { isWorkerThread } from 'piscina'
import { threadId } from 'node:worker_threads'
import { readFileSync } from 'node:fs'

const reset = '\x1b[0m'
const grey = '\x1b[90m'
const italics = '\x1b[3m'
const bold = '\x1b[1m'
const royalBlue = '\x1b[38;5;21m'
const fuchsia = '\x1b[35m'
const rainbowColors = ['\x1b[31m', '\x1b[33m', '\x1b[32m', '\x1b[36m', '\x1b[35m', '\x1b[34m', '\x1b[37m']

const rainbowify = (str: string): string => {
    let result = ''
    for (let i = 0; i < str.length; i++) {
        result += `${rainbowColors[i % rainbowColors.length]}${str[i]}`
    }
    return result
}

const log = (level: string, asciiColor: string, scope: string, message: string) => {
    const date = new Date()
    // hh:mm:ss format
    const time = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    const thread = !isWorkerThread ? `    ${fuchsia}main` : `${royalBlue}worker ${threadId}`
    // pad 
    console.log(`${grey}${time}${reset}  ${thread}${reset}  ${asciiColor}[${level}]${reset} (${italics}${scope}${reset}): ${message}`)
}

const pad = (str: number, length: number = 2): string => {
    return '0'.repeat(length - str.toString().length) + str
}
export const info = (scope: string, message: string) => log('INFOR', '\x1b[32m', scope, message)
export const warn = (scope: string, message: string) => log('ALERT', '\x1b[33m', scope, message)
export const error = (scope: string, message: string) => log('ERROR', '\x1b[31m', scope, message)
export const debug = (scope: string, message: string) => process.env.NODE_ENV !== 'production' && log('DEBUG', '\x1b[36m', scope, message)
export const welcome = () => {
    const logo = readFileSync('./logo.txt', 'utf-8')
    console.log(rainbowify(logo))
    console.log(`welcome to ${rainbowify('ditto')}, the image processing server.${reset} ${bold}${grey}github.com/musicorumapp/ditto`)
}