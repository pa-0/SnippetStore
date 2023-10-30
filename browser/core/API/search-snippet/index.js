import { getWorkerWithRpc } from 'workers/helpers'
import { scheduleAsMacroTask } from 'lib/taskScheduling'
import searchByLanguage from './search-by-language'
import searchByName from './search-by-name'
import searchByTag from './search-by-tag'

export function searchSnippet (snippets, keyword) {
  const searchParts = keyword.split(' ').filter(word => word !== '')
  let result = snippets
  const langRegex = /lang:(.*)/
  const tagRegex = /#(.*)/

  searchParts.forEach(search => {
    const language = langRegex.exec(search)
    const tag = tagRegex.exec(search)
    if (language) {
      result = searchByLanguage(result, language[1])
    } else if (tag) {
      result = searchByTag(result, tag)
    } else {
      result = searchByName(result, search)
    }
  })

  return result
}

export class SearchEngine {
  _searchWorker
  _snippetsInMainThreadLimit
  _searchChunkSize

  constructor ({
    snippetsInMainThreadLimit,
    searchChunkSize
  }) {
    this._snippetsInMainThreadLimit = snippetsInMainThreadLimit || 50000
    this._searchChunkSize = searchChunkSize || 5000
  }

  getWorker () {
    if (this._searchWorker) {
      return this._searchWorker
    }
    this._searchWorker = getWorkerWithRpc('search.js')
    return this._searchWorker
  }

  async searchSnippet (snippets, searchQuery, runInBackground) {
    if (!runInBackground && snippets.length <= this._snippetsInMainThreadLimit) {
      return searchSnippet(snippets, searchQuery)
    }

    console.log('using the worker =================================================================')

    /**
     * Over limit
     * Make search using worker
     */
    const workerRpc = this.getWorker().rpcProvider
    return workerRpc.rpc('searchSnippet', [snippets, searchQuery])
  }

  /**
   * A generator that allow searching by chunk
   * And implements automatic freeing the process for the event loop to process other.
   * Making the renderer thread more responsive
   */
  async * getSearchSnippetsGenerator (snippets, searchQuery, runInBackground) {
    if (snippets.length > this._searchChunkSize) {
      let selectStart = 0
      let selectEnd
      while (selectStart < snippets.length) {
        selectEnd = Math.min(selectStart + this._searchChunkSize - 1, snippets.length - 1)

        yield await scheduleAsMacroTask(() => {
          return this.searchSnippet(snippets.slice(selectStart, selectEnd + 1), searchQuery, runInBackground)
        })

        selectStart = selectEnd + 1
      }
      return
    }

    yield await searchSnippet(snippets, searchQuery)
  }

  async * getSearchByMultipleWordsAsTagsGenerator (snippets, searchQuery, runInBackground) {
    for (const word of searchQuery.split(' ').filter((word) => word !== '')) {
      const searchSnippetsGen = this.getSearchSnippetsGenerator(snippets, `#${word}`, runInBackground)
      let result
      while (!(result = await searchSnippetsGen.next()).done) {
        yield result.value
      }
    }
  }
}

export const searchEngine = new SearchEngine({
  searchChunkSize: 5000,
  snippetsInMainThreadLimit: 50000
})
