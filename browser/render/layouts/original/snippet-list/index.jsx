import React from 'react'
import { observer } from 'mobx-react'
import CodeMirror from 'codemirror'
import 'codemirror/mode/meta'
import SnippetItem from '../snippet-item'
import SnippetItemMultiFiles from '../snippet-item-multi-files'
import i18n from 'render/lib/i18n'
import './snippet-list'
import { VirtualList } from '../../../../lib/virtualList'
import { getLinesNumber, getTextAreaLinesNumber } from '../../../../lib/util'
import {
  EditorsPools,
  loadSnippetsLanguagesModes
} from '../../../../lib/editor'
// import { Virtuoso } from 'react-virtuoso'
import { VariableSizeList as List } from 'react-window'

@observer
export default class SnippetList extends React.Component {
  snippetsListContainerRef = React.createRef()
  cRef = React.createRef()
  scrollingStartTimeRef = React.createRef()
  snippetsParentContainerRef = React.createRef()
  lastVirtualRows
  editorsRefsPools
  preLoadedSnippetsCentralIndex = 0
  editorsInitialized = false

  constructor (props) {
    super(props)

    this.state = {
      fastPreview: false,
      fastPreviewStyles: {}
    }

    this.editorsRefsPools = new EditorsPools(props)

    this.getVirtualListParent = this.getVirtualListParent.bind(this)
    this.estimateSnippetElSize = this.estimateSnippetElSize.bind(this)
    this.renderVirtualList = this.renderVirtualList.bind(this)
    this.applyEditorMode = this.applyEditorMode.bind(this)
  }

  async componentDidUpdate () {
    const { snippets } = this.props.store
    if (!this.editorsInitialized && snippets.length) {
      this.editorsInitialized = true
      const startTime = Date.now()
      const { languagesModesLoadedMap } = await loadSnippetsLanguagesModes(
        snippets
      )

      console.log(
        'Loading modes ??????????????/ //////////////////////////////////////////////////////////////////'
      )
      console.log(languagesModesLoadedMap)
      console.log((Date.now() - startTime) / 1000)

      this.editorsRefsPools.initPool(languagesModesLoadedMap)
      this.forceUpdate()
    }
  }

  applyEditorMode (editorRef, snippet) {
    const { config } = this.props
    const langConf = config.language
    let snippetMode = CodeMirror.findModeByName(snippet.lang).mode

    // console.error('Snippet mode: ', snippetMode)

    if (snippetMode === 'php') {
      snippetMode = {
        name: 'php',
        startOpen: !langConf.php.requireOpenTag
      }
    }
    editorRef.editor.setOption('mode', snippetMode)
    editorRef.editor.refresh()
  }

  renderMultiFileSnippet (snippet, virtualRow) {
    const { config, store } = this.props
    return (
      <SnippetItemMultiFiles snippet={snippet} config={config} store={store} />
    )
  }

  renderSingleFileSnippet (snippet, editorRef, virtualRow) {
    const { config, store } = this.props
    return (
      <SnippetItem
        snippet={snippet}
        config={config}
        store={store}
        // fastPreview={false && this.state.fastPreview}
        // fastPreviewStyle={this.state.fastPreviewStyles}
        editorRef={editorRef}
        virtualRow={virtualRow}
      />
    )
  }

  renderEmptyMessage () {
    const { config, store } = this.props
    if (store.rawSnippets.length > 0) {
      return <h1 className="emptyMessage">{i18n.__('No snippet found!')}</h1>
    }
    return (
      <h1 className="emptyMessage">
        {i18n.__('Create new snippet using ')}
        {config.keyboard.createSnippet}
      </h1>
    )
  }

  getVirtualListParent () {
    return this.snippetsListContainerRef.current
  }

  estimateSnippetElSize (index) {
    const { snippets } = this.props.store
    const snippet = snippets[index]
    const valueLinesNumber = getLinesNumber(snippet.value)
    const descriptionLinesNumber = getTextAreaLinesNumber(snippet.description)

    // console.log({
    //   valueLinesNumber,
    //   descriptionLinesNumber,
    //   estimation: valueLinesNumber * 15 + descriptionLinesNumber * 15 + 60
    // })

    return (
      valueLinesNumber * 27 /* TODO: make it dynamic (computed line height) */ +
      descriptionLinesNumber * 24 /* description line size */ +
      20 /* description padding */ +
      40 /* title */ +
      40 /* tag */ +
      40 /* footer */ +
      40
    )
  }

  renderVirtualList (rowVirtualizer) {
    console.log('////////////renderVirtualList////////////////////////////////')
    const { snippets } = this.props.store

    if (!this.editorsRefsPools.getPool().size) {
      return null
    }

    const virtualRows = rowVirtualizer.getVirtualItems()
    // this.lastVirtualRows = virtualRows
    console.log('virtualRows ====', virtualRows)

    return (
      <div className="listContainer" ref={this.snippetsListContainerRef}>
        <div
          ref={this.cRef}
          style={{
            height: `${1000000000000}px`,
            width: '100%',
            position: 'relative'
          }}
        >
          {virtualRows.map((virtualRow, index) => {
            const snippet = snippets[virtualRow.index]

            const snippetMode = CodeMirror.findModeByName(snippet.lang).mode
            if (snippetMode === 'markdown') {
              console.log(
                '//////////////////////////////////////////////////////////////// markdown'
              )
            }
            const editorRef = this.editorsRefsPools
              .getModePool(snippetMode)
              .getNextEditor(snippet.key)

            // editorRef.editor.setSize('100%', 'auto')

            console.log({
              start: `translateY(${virtualRow.start}px)`,
              height: `${rowVirtualizer.getTotalSize()}px`,
              test: `${10000000000000000}px`
            })

            return (
              <div
                key={snippet.key}
                ref={virtualRow.measureElement}
                style={{
                  position: 'absolute',
                  top: `${virtualRow.start}px`,
                  // top: 0,
                  left: 0,
                  width: '100%',
                  // transform: `translateY(${virtualRow.start}px)`,
                  height: this.estimateSnippetElSize(virtualRow.index)
                }}
              >
                {snippet.files === undefined
                  ? this.renderSingleFileSnippet(snippet, editorRef, virtualRow)
                  : this.renderMultiFileSnippet(snippet, virtualRow)}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // renderVirtualList (index) {
  //   const { snippets } = this.props.store
  //   const snippet = snippets[index]
  //   const snippetMode = CodeMirror.findModeByName(snippet.lang).mode
  //   const editorRef = this.editorsRefsPools.getModePool(snippetMode).getNextEditor(snippet.key)

  //   return <div
  //     key={snippet.key}
  //     // ref={virtualRow.measureElement}
  //     // style={{
  //     //   position: 'absolute',
  //     //   // top: `${virtualRow.start}px`,
  //     //   top: 0,
  //     //   left: 0,
  //     //   width: '100%',
  //     //   transform: `translateY(${virtualRow.start}px)`,
  //     //   height: this.estimateSnippetElSize(virtualRow.index)
  //     // }}
  //   >
  //     {snippet.files === undefined
  //       ? this.renderSingleFileSnippet(snippet, editorRef)
  //       : this.renderMultiFileSnippet(snippet)}
  //   </div>
  // }

  isScrolling = false
  isScrollingTimeoutHandler

  setScroll (val) {
    this.isScrolling = val
  }

  updateState (newState) {
    return this.setState({
      ...this.state,
      ...newState
    })
  }

  lock
  scrollStartPosition
  isFastPreview

  setFastPreview (val) {
    this.isFastPreview = val
    this.updateState({ fastPreview: val })
  }

  renderReactWindowItem =  ({ index, style }) => {
    console.log('Render element =================================================================')

    const { snippets } = this.props.store
    const snippet = snippets[index]

    const snippetMode = CodeMirror.findModeByName(snippet.lang).mode
    if (snippetMode === 'markdown') {
      console.log(
        '//////////////////////////////////////////////////////////////// markdown'
      )
    }
    const editorRef = this.editorsRefsPools
      .getModePool(snippetMode)
      .getNextEditor(snippet.key)

    return  <div
      key={snippet.key}
      style={style}
    >
      {snippet.files === undefined
        ? this.renderSingleFileSnippet(snippet, editorRef)
        : this.renderMultiFileSnippet(snippet)}
    </div>
  }

  WindowVirtualLists () {
    const { snippets } = this.props.store

    if (!this.editorsRefsPools.getPool().size) {
      return null
    }

    return <List
      height={this.snippetsParentContainerRef.current.offsetHeight}
      itemCount={snippets.length}
      itemSize={this.estimateSnippetElSize}
    >
      {this.renderReactWindowItem}
    </List>
  }

  renderSnippetList () {
    const { snippets } = this.props.store

    console.log('re-render all ==///////////////////////////=')
    console.log(snippets.length)
    console.log(this.snippetsParentContainerRef.current)

    return (
      <div className="snippets original" ref={this.snippetsParentContainerRef}>
        {/* <Virtuoso
          totalCount={snippets.length}
          itemContent={this.renderVirtualList}
        /> */}
        {this.WindowVirtualLists()}
        {/* <VirtualList
          options={{
            count: snippets.length,
            // overscan: 5,
            // enableSmoothScroll: true,
            getScrollElement: this.getVirtualListParent,
            estimateSize: this.estimateSnippetElSize
          }}
        >
          {this.renderVirtualList}
        </VirtualList> */}
      </div>
    )
  }

  render () {
    const { snippets } = this.props.store

    console.error('snippets =================================================')
    console.error(snippets)
    return snippets.length > 0
      ? this.renderSnippetList()
      : this.renderEmptyMessage()
  }
}
