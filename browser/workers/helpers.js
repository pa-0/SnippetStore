import { RpcProvider } from 'worker-rpc'

/**
 * Return a Worker by workerFile relative to the workers folder
 * @param {*} workerFile
 * @returns Worker
 */
export function getWorker (workerFile) {
  const workerUrl = new URL(`./workers/${workerFile}`, import.meta.url)
  return new Worker(workerUrl.toString())
}

/**
 * A method that setup the rpc provider in the main thread
 * To be used in the main thread to create and worker and setup the rpcProvider
 */
export function getWorkerWithRpc () {
  const worker = getWorker()

  const rpcProvider = new RpcProvider(
    (message, transfer) => worker.postMessage(message, transfer)
  )

  worker.onmessage = e => rpcProvider.dispatch(e.data)

  return {
    worker,
    rpcProvider
  }
}

/**
 * Should only be used in a worker script
 * It setup the rpc provider in the
 */
export function setupAndGetWorkerScriptRpcProvider () {
  const rpcProvider = new RpcProvider(
    (message, transfer) => postMessage(message, transfer)
  )

  onmessage = e => rpcProvider.dispatch(e.data)
  return rpcProvider
}
