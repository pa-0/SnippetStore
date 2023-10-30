import { fetchSnippets } from './API/snippet'
import SnippetStore from 'store/SnippetStore'

function init () {
  console.log('Fetch snippets =================================================')
  const start = Date.now()
  const snippets = fetchSnippets()
  console.log((Date.now() - start) / 1000)

  SnippetStore.loadSnippets(snippets)
}

export default init
