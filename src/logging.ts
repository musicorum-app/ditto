import { isWorkerThread } from 'piscina'
import { threadId } from 'node:worker_threads'

const reset = '\x1b[0m'
const grey = '\x1b[90m'
const italics = '\x1b[3m'
const green = '\x1b[32m'
const royalBlue = '\x1b[38;5;21m'

const log = (level: string, asciiColor: string, scope: string, message: string) => {
    const date = new Date()
    // hh:mm:ss format
    const time = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    const thread = !isWorkerThread ? `${green}main` : `${royalBlue}worker ${threadId}`
    console.log(`${grey}${time}${reset} ${thread}${reset} ${asciiColor}[${level}]${reset} (${italics}${scope}${reset}): ${message}`)
}

const pad = (str: number, length: number = 2): string => {
    return '0'.repeat(length - str.toString().length) + str
}
export const info = (scope: string, message: string) => log('INFO', '\x1b[32m', scope, message)
export const warn = (scope: string, message: string) => log('WARN', '\x1b[33m', scope, message)
export const error = (scope: string, message: string) => log('ERROR', '\x1b[31m', scope, message)
export const debug = (scope: string, message: string) => process.env.NODE_ENV !== 'production' && log('DEBUG', '\x1b[36m', scope, message)