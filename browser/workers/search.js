import searchSnippet from 'core/API/search-snippet'
import { setupAndGetWorkerScriptRpcProvider } from './helpers'

const rpcProvider = setupAndGetWorkerScriptRpcProvider()

rpcProvider.registerRpcHandler('searchSnippet', (args) => {
  return searchSnippet(...args)
})
