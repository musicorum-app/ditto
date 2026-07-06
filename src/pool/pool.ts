import { isImageCached } from '../imaging.js'

const MIN_THREADS = isNaN(parseInt(process.env.MIN_THREAD_POOL_SIZE!)) ? 4 : parseInt(process.env.MIN_THREAD_POOL_SIZE!)

class WorkerPool {
    private workers: Worker[] = []
    private pendingTasks = new Map<number, { resolve: (value: unknown) => void; reject: (reason: unknown) => void }>()
    private taskIdCounter = 0
    private currentWorkerIndex = 0

    constructor(private size: number, private workerPath: string) {
        this.initialize()
    }

    async run(key: string, data: unknown[]): Promise<unknown> {
        return new Promise((resolve, reject) => {
            const taskId = this.taskIdCounter++
            this.pendingTasks.set(taskId, { resolve, reject })

            const worker = this.workers[this.currentWorkerIndex]
            this.currentWorkerIndex = (this.currentWorkerIndex + 1) % this.workers.length

            worker.postMessage({ taskId, key, data })
        })
    }

    terminate() {
        for (const worker of this.workers) {
            worker.terminate()
        }
        this.workers = []
        this.pendingTasks.clear()
    }

    private initialize() {
        for (let i = 0; i < this.size; i++) {
            this.createWorker()
        }
    }

    private createWorker() {
        const worker = new Worker(this.workerPath)

        worker.onmessage = (event: MessageEvent) => {
            const { taskId, result, error } = event.data

            const pending = this.pendingTasks.get(taskId)
            if (pending) {
                this.pendingTasks.delete(taskId)

                if (error) {
                    pending.reject(new Error(error))
                } else {
                    pending.resolve(result)
                }
            }
        }

        worker.onerror = (error) => {
            console.error('Worker error:', error)
        }

        this.workers.push(worker)
    }
}

const pool = new WorkerPool(MIN_THREADS, new URL('./worker.ts', import.meta.url).href)

const exec = async (key: string, data: unknown[]): Promise<unknown> => {
    return pool.run(key, data)
}

export const downloadImages = async (ids: string[], dimensions: number): Promise<void> => {
    await Promise.allSettled(ids.filter((id) => !isImageCached(id, dimensions)).map((id) => exec('downloadImage', [id, dimensions])))
}

export const downloadImagesWithObjects = async (ids: { id: string, size: number }[]): Promise<void> => {
    await Promise.allSettled(ids.filter(({ id, size }) => !isImageCached(id, size)).map(({
                                                                                             id,
                                                                                             size
                                                                                         }) => exec('downloadImage', [id, size])))
}
