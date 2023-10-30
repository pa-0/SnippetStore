import { observable, computed, makeAutoObservable, toJS, runInAction, reaction, ObservableSet } from 'mobx'
import * as SnippetAPI from 'core/API/snippet'
import { searchEngine, searchSnippet } from '../core/API/search-snippet'
// import { searchEngine } from 'core/API/search-snippet'
import { sortSnippet, sortBySearchFullMatch } from 'core/API/sort-snippet'
import { scheduleAsCancelableMacroTask, scheduleAsMacroTask } from 'lib/taskScheduling'
import eventEmitter from 'lib/event-emitter'
import { ExecManager } from '../lib/execManager'
// import eventEmitter from 'lib/execManager'
import { toast } from 'react-toastify'
import CodeMirror from 'codemirror'
import 'codemirror/mode/meta'
import { unionBy, uniqBy } from 'lodash'
import { loadSnippetsLanguagesModes } from '../lib/editor'

class SnippetStore {
  rawSnippets = []
  filter = ''
  sort = 'createTimeNewer'
  selectedSnippet = null
  mainSearchSnippets = this.rawSnippets
  tagSearchSnippets = []
  snippets = []
  incrementalTimeoutHandler = undefined
  tagNames
  tagNamesMetaMap = new Map()
  languages

  constructor () {
    makeAutoObservable(this, {
      tagNamesMetaMap: false
      // rawSnippets: observable,
      // mainSearchSnippets: false,
      // tagSearchSnippets: false,
      // snippets: observable
    })
    eventEmitter.on('snippet:import', (event, snippetFile) => {
      this.importSnippet(snippetFile)
    })
    eventEmitter.on('snippet:exportAll', (event, folder) => {
      this.exportAllSnippet(folder)
    })

    reaction(
      () => [this.filter, this.rawSnippets.length],
      (__, prevValues) => {
        console.log(' Reaction effect ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::: ')
        console.log([this.filter, this.rawSnippets.length])
        this._computeSnippets(prevValues)
      })
  }

  async _computeSnippets ([prevFilter, prevRawSnippetsLength]) {
    const execManager = new ExecManager({ processName: 'computeSnippets' }).declareRun()
    await execManager.triggerStopAllOthers()

    console.log('computeSnippets =================================')
    console.log({
      mainSearchSnippets: this.mainSearchSnippets,
      tagSearchSnippets: this.tagSearchSnippets,
      rawSnippets: this.rawSnippets
    })

    /**
     * rawSnippets is what changed
     */
    if (prevRawSnippetsLength === 0 && this.rawSnippets.length > 0) {
      this.computeTagNames()
      this.computeLanguages()
    }

    // let snippetsToMerge
    // if (this.filter !== '') {
    //   await Promise.allSettled([
    //     this._computeAndRenderNormalSearch(this.rawSnippets, this.filter),
    //     this._computeAndRenderTagSearch(true)
    //   ])
    //   snippetsToMerge = [-
    //     ...this.mainSearchSnippets,
    //     ...this.tagSearchSnippets
    //   ]
    // }

    // await this._sortAndMergeSnippets(snippetsToMerge)

    runInAction(() => {
      this.snippets = this.rawSnippets
    })

    execManager.declareFinished()

    // update and render only if there is result. Otherwise wait for the tag search to finish and update all at once (to avoid flickering [Nothing found temporally])

    // Search by tag for by name search as well. And incrementally
  }

  async _computeAndRenderNormalSearch (rawSnippets, filter) {
    const execManager = new ExecManager({ processName: 'computeSnippets' }).declareRun()

    const normalSearchGen = searchEngine.getSearchSnippetsGenerator(rawSnippets, filter)

    console.log(' com normal search')
    console.log({
      rawSnippets,
      filter
    })

    let searchResult
    let allMatchingSnippet = []
    while (!execManager.shouldStop && !(searchResult = await normalSearchGen.next()).done) {
      console.log('Normal Search loop :::::::::::::::::')

      if (!execManager.shouldStop && searchResult.value.length) {
        console.log('OK result of search ======')
        console.log(searchResult.value)
        allMatchingSnippet = [
          ...allMatchingSnippet,
          ...searchResult.value
        ]
        console.log(allMatchingSnippet)
        runInAction(() => {
          this.mainSearchSnippets = allMatchingSnippet
        })
      }
    }

    console.log('Normal search final result =================================================================')
    console.log(allMatchingSnippet)

    if (!allMatchingSnippet.length) {
      console.log('===============================Normal search: None =============================')
      this.mainSearchSnippets = allMatchingSnippet
    }

    execManager.declareFinished()
  }

  async _computeAndRenderTagSearch (runInBackground) {
    const execManager = new ExecManager({ processName: 'computeSnippets' }).declareRun()

    if (this.filter !== '' && !this.filter.includes('#')) {
      // timeout to let the event loop process and move the action to the end. In order to see the first search result immediately
      const searchGen = searchEngine.getSearchByMultipleWordsAsTagsGenerator(this.rawSnippets, this.filter, runInBackground)

      let result
      let cumulatedSnippets = []

      while (!execManager.shouldStop && !(result = await searchGen.next()).done) {
        if (!execManager.shouldStop && result.value.length) {
          cumulatedSnippets = [
            ...cumulatedSnippets,
            ...result.value
          ]

          runInAction(() => {
            this.tagSearchSnippets = cumulatedSnippets
          })
        }
      }

      if (!cumulatedSnippets.length) {
        runInAction(() => {
          this.tagSearchSnippets = cumulatedSnippets
        })
      }
    }

    execManager.declareFinished()
  }

  async _sortAndMergeSnippets (snippets) {
    const execManager = new ExecManager({ processName: 'computeSnippets' }).declareRun()

    console.log('sortAndMergeSnippets =================================')

    console.log({
      mainSearchSnippets: this.mainSearchSnippets,
      tagSearchSnippets: this.tagSearchSnippets
    })

    if (snippets) {
      console.log('s133333333////////')
      await scheduleAsCancelableMacroTask(execManager, () => {
        snippets =  uniqBy(snippets, 'name')
      })
    } else {
      snippets = this.rawSnippets
    }

    // await scheduleAsCancelableMacroTask(execManager, () => {
    //   snippets = sortSnippet(snippets, this.sort)
    // })

    await scheduleAsCancelableMacroTask(execManager, () => {
      runInAction(() => {
        // this.snippets = sortBySearchFullMatch(snippets, this.filter)
        this.snippets = snippets
      })
    })

    execManager.declareFinished()
  }

  computeTagNames () {
    const tags = []
    this.rawSnippets.forEach(snippet => {
      snippet.tags.filter(tag => tag).forEach(tag => {
        if (tags.indexOf(tag) === -1) {
          tags.push(tag)
          let tagMeta = this.tagNamesMetaMap.get(tag)
          if (!tagMeta) {
            tagMeta = {
              tag,
              snippetsCount: 0
            }
            this.tagNamesMetaMap.set(tag, tagMeta)
          }
          tagMeta.snippetsCount++
        }
      })
    })
    this.tagNames = tags
  }

  computeLanguages () {
    const languages = {}
    this.rawSnippets.forEach(snippet => {
      if (snippet.files !== undefined) {
        snippet.files.forEach(file => {
          const ExtensionIndex = file.name.lastIndexOf('.') + 1
          const fileExtension =
            ExtensionIndex >= 2 ? file.name.substring(ExtensionIndex) : ''
          const mode = CodeMirror.findModeByExtension(fileExtension)
          let langName = fileExtension ? fileExtension.toUpperCase() : 'unknown'
          if (mode) {
            langName = mode.name
          }
          if (languages[langName]) {
            languages[langName] += 1
          } else {
            languages[langName] = 1
          }
        })
      } else {
        if (languages[snippet.lang]) {
          languages[snippet.lang] += 1
        } else {
          languages[snippet.lang] = 1
        }
      }
    })
    this.languages = languages
  }

  loadSnippets (snippets) {
    this.rawSnippets = snippets
  }

  createSnippet (snippet) {
    const newSnippet = SnippetAPI.createSnippet(snippet)
    console.log('Update rawSnippets ----------')
    this.rawSnippets.push(newSnippet)
    loadSnippetsLanguagesModes([newSnippet])
  }

  importSnippet (snippetFile) {
    const newSnippetOrSnippetList = SnippetAPI.importSnippet(snippetFile)
    if (Array.isArray(newSnippetOrSnippetList)) {
      const newSnippetList = newSnippetOrSnippetList
      this.rawSnippets = newSnippetList
    } else {
      const newSnippet = newSnippetOrSnippetList
      this.rawSnippets.push(newSnippet)
    }
    toast.success('Snippet imported!')
  }

  exportAllSnippet (folder) {
    const allSnippets = toJS(this.rawSnippets)
    SnippetAPI.exportSnippet(allSnippets, folder)
    toast.success('All snippets exported!')
  }

  updateSnippet (snippet) {
    // update using the snippet API
    const snippetIndex = SnippetAPI.updateSnippet(snippet)
    loadSnippetsLanguagesModes([snippet])
    this.rawSnippets[snippetIndex] = snippet
    this.selectedSnippet = snippet
  }

  increaseCopyTime (snippet) {
    snippet.copy += 1
    this.updateSnippet(snippet)
  }

  deleteSnippet (snippet) {
    // const newRawSnippets = this.rawSnippets.filter((rSnippet) => rSnippet.key !== snippet.key)
    const snippetIndex = this.rawSnippets.findIndex((rSnippet) => rSnippet.key === snippet.key)
    const [removedSnippet] = this.rawSnippets.splice(snippetIndex, 1)

    this.onDeleteSnippet(removedSnippet)

    scheduleAsMacroTask(() => {
      SnippetAPI.setSnippets(this.rawSnippets)
    })
  }

  onDeleteSnippet (snippet) {
    return Promise.allSettled([
      scheduleAsMacroTask(() => this.updateTagNamesOnSnippetDelete(snippet)),
      scheduleAsMacroTask(() => this.updateLanguagesOnSnippetDelete(snippet))
    ])
  }

  updateTagNamesOnSnippetDelete (snippet) {
    const tagsToRemove = snippet.tags.filter((tag) => {
      const tagMeta = this.tagNamesMetaMap.get(tag)
      return tagMeta && tagMeta.snippetsCount === 1
    })
    this.tagNames = this.tagNames.filter((tag) => tagsToRemove.includes(tag))
  }

  updateLanguagesOnSnippetDelete (snippet) {
    function updateLang (lang) {
      if (this.languages[lang]) {
        this.languages[lang] -= 1
        if (this.languages[lang] === 0) {
          delete this.languages[lang]
        }
      }
    }

    if (snippet.files !== undefined) {
      snippet.files.forEach(file => {
        const ExtensionIndex = file.name.lastIndexOf('.') + 1
        const fileExtension =
            ExtensionIndex >= 2 ? file.name.substring(ExtensionIndex) : ''
        const mode = CodeMirror.findModeByExtension(fileExtension)
        let langName = fileExtension ? fileExtension.toUpperCase() : 'unknown'
        if (mode) {
          langName = mode.name
        }
        updateLang(langName)
      })
    } else {
      updateLang(snippet.lang)
    }
  }
}

const store = (window.store = new SnippetStore())

export default store
