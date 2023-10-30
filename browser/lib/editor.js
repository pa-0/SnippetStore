import CodeMirror from 'codemirror'
import { getPropertyComputedValue } from './util'

export function getEditorStylingPropertiesForFP (editorRef) {
  editorRef.dom.style.visibility = 'hidden'
  document.body.appendChild(editorRef.dom)
  const codeMirrorEl = editorRef.dom.getElementsByClassName('CodeMirror')[0]
  const codeMirrorLineEl = editorRef.dom.getElementsByClassName('CodeMirror-line')[0]

  const backgroundColor = getPropertyComputedValue(codeMirrorEl, 'background-color')
  const fontFamily = getPropertyComputedValue(codeMirrorLineEl, 'font-family')
  const fontSize = getPropertyComputedValue(codeMirrorLineEl, 'font-size')
  const fontVariantLigatures = getPropertyComputedValue(codeMirrorLineEl, 'font-variant-ligatures')
  const color = getPropertyComputedValue(codeMirrorLineEl, 'color')
  const lineHeight = getPropertyComputedValue(codeMirrorLineEl, 'line-height')

  console.log('Default font family ===/////////////////////////////////')
  console.log({
    fontFamily,
    backgroundColor,
    color,
    fontSize,
    fontVariantLigatures,
    lineHeight
  })

  editorRef.dom.parentElement.removeChild(editorRef.dom)
  editorRef.dom.style.visibility = 'visible'

  return {
    backgroundColor,
    color,
    fontFamily,
    fontSize,
    fontVariantLigatures,
    lineHeight
  }
}

const languagesModesLoadedMap = new Map()
export async function loadSnippetsLanguagesModes (snippets, forceLoad = false) {
  const promises = []
  console.error('Load snippets modes =================================================================')
  console.log(typeof snippets)
  snippets.forEach((snippet) => {
    // console.error('////' + snippet.lang)
    const snippetMode = CodeMirror.findModeByName(snippet.lang).mode
    if (
      (!languagesModesLoadedMap.has(snippetMode) || forceLoad) &&
      snippetMode &&
      snippetMode !== 'null'
    ) {
      languagesModesLoadedMap.set(snippetMode, true)
      console.error('Load : ' + `codemirror/mode/${snippetMode}/${snippetMode}`)
      promises.push(import(`codemirror/mode/${snippetMode}/${snippetMode}`))
    }
  })
  console.log('done all /////')
  await Promise.all(promises)
  return { languagesModesLoadedMap }
}

/**
 * EditorsPools
 */
export class EditorsPools {
  pool = new Map();
  editorsBySnippetKey = new Map();
  props

  constructor (props) {
    this.props = props
  }

  getPool () {
    return this.pool
  }

  getModePool (snippetMode) {
    return this.pool.get(snippetMode)
  }

  initPool (loadedModesMap) {
    const { config } = this.props
    let startOne
    const startAll = Date.now()
    const thisPoolInstance = this

    loadedModesMap.forEach((__, mode) => {
      const modePool = {
        index: 0,
        mode,
        pool: undefined,
        getNextEditor (snippetKey) {
          if (thisPoolInstance.editorsBySnippetKey.has(snippetKey)) {
            const editorRef = thisPoolInstance.editorsBySnippetKey.get(snippetKey)
            editorRef.alreadyActive = true
            return editorRef
          }

          const editorRef = this.pool[this.index]

          if (editorRef.snippetKey) {
            thisPoolInstance.editorsBySnippetKey.delete(editorRef.snippetKey)
          }

          this.index = (this.index + 1) % this.pool.length
          thisPoolInstance.editorsBySnippetKey.set(snippetKey, editorRef)
          editorRef.alreadyActive = false
          editorRef.snippetKey = snippetKey
          return editorRef
        }
      }
      this.pool.set(mode, modePool)

      modePool.pool = Array(20).fill(true).map((_, index) => {
        startOne = Date.now()

        const { theme, highlightCurrentLine } = config.editor

        const editorContainer = document.createElement('div')

        const editor = CodeMirror(editorContainer, {
          // lineNumbers: showLineNumber,
          value: '',
          // foldGutter: showLineNumber,
          // gutters: gutters,
          readOnly: true,
          autoCloseBrackets: true,
          autoRefresh: true,
          mode,
          theme
        })

        if (highlightCurrentLine) {
          editor.setOption('styleActiveLine', { nonEmpty: false })
        } else {
          editor.setOption('styleActiveLine', null)
        }
        editor.setSize('100%', 'auto')
        // this.applyEditorStyleSingleFile()

        const editorRef = {
          editor,
          dom: editorContainer,
          virtualRow: undefined,
          measureEl: { current: undefined }
        }

        this.applySnippetEditorSettings(editorRef)

        console.log('Editor init time: ', (Date.now() - startOne) / 1000)

        editorRef.editor.on('mousedown', () => {
          console.log('mousedown =================================')
          editorRef.editor.setSize('100%', `${editorRef.dom.offsetHeight}px`)
        })

        return editorRef
      })

      // const getStateWithFastPreviewStyles = () => {
      //   const {
      //     backgroundColor,
      //     color,
      //     fontFamily,
      //     fontSize,
      //     fontVariantLigatures,
      //     lineHeight
      //   } = getEditorStylingPropertiesForFP(last(this.editorsRefsPool))

      //   return {
      //     ...this.state,
      //     fastPreviewStyles: {
      //       backgroundColor,
      //       color,
      //       fontFamily,
      //       fontSize,
      //       fontVariantLigatures,
      //       lineHeight
      //     }
      //   }
      // }

      // // eslint-disable-next-line react/no-direct-mutation-state
      // this.state = getStateWithFastPreviewStyles()

      // const timeouts = [1e3, 2e3, 3e3, 4e3, 5e3]
      // timeouts.forEach((timeout) => {
      //   setTimeout(() => {
      //     this.setState(getStateWithFastPreviewStyles())
      //   }, timeout)
      // })
    })

    console.log('FINISH init ALL EDITORS time: ', (Date.now() - startAll) / 1000)
    console.log(this.editorsRefsPools)
  }

  applySnippetEditorSettings (editorRef) {
    const { config, maxHeight } = this.props
    const {
      theme,
      showLineNumber,
      fontFamily,
      fontSize,
      tabSize,
      indentUsingTab,
      highlightCurrentLine
    } = config.editor

    const gutters = showLineNumber
      ? ['CodeMirror-linenumbers', 'CodeMirror-foldgutter']
      : []
    editorRef.editor.getWrapperElement().style.fontSize = `${fontSize}px`
    editorRef.editor.setOption('lineNumbers', showLineNumber)
    editorRef.editor.setOption('foldGutter', showLineNumber)
    editorRef.editor.setOption('theme', theme)
    editorRef.editor.setOption('gutters', gutters)

    editorRef.editor.setOption('indentUnit', tabSize)
    editorRef.editor.setOption('tabSize', tabSize)
    editorRef.editor.setOption('indentWithTabs', indentUsingTab)

    if (highlightCurrentLine) {
      editorRef.editor.setOption('styleActiveLine', { nonEmpty: false })
    } else {
      editorRef.editor.setOption('styleActiveLine', null)
    }

    const wrapperElement = editorRef.editor.getWrapperElement()
    wrapperElement.style.fontFamily = fontFamily
    wrapperElement.style.flex = '1'
    if (maxHeight) {
      const wrapperElement = editorRef.editor.getWrapperElement()
      wrapperElement.querySelector(
        '.CodeMirror-scroll'
      ).style.maxHeight = maxHeight
    }
    editorRef.editor.refresh()
  }
}
