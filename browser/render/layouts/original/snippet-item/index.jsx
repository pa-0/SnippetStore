import React from 'react'
import _ from 'lodash'
import FAIcon from '@fortawesome/react-fontawesome'
import ReactTooltip from 'react-tooltip'
import { toast } from 'react-toastify'
import Clipboard from 'core/functions/clipboard'
import formatDate from 'lib/date-format'
import TagItem from 'render/components/tag-item'
import i18n from 'render/lib/i18n'
// import CodeEditor from 'render/components/code-editor'
import TagInput from 'render/components/tag-input'
import eventEmitter from 'lib/event-emitter'
import CodeMirror from 'codemirror'
import 'codemirror/mode/meta'
import './snippet-item'
import { toJS } from 'mobx'
import exportSnippetAPI from 'core/API/snippet/export-snippet'
import getLanguageIcon from 'lib/getLangIcon'
import MarkdownPreview from '../../../components/markdown-preview/markdown-preview'
import { loadSnippetsLanguagesModes } from '../../../../lib/editor'
const remote = window.require('@electron/remote')
const { dialog } = remote

function countChar (arr, char) {
  return arr.reduce((reduceVal, val) => {
    if (val === char) {
      return reduceVal + 1
    }
    return reduceVal
  }, 0)
}

function getLineNumStr (lineNum) {
  if (lineNum >= 10) {
    return `${lineNum}`
  }
  return ` ${lineNum}`
}

function addLinesNumbers (snippetContent) {
  const returnRegex = /\n|\r|\r\n/g
  let execResult
  let lineStartIndex = 0
  let lineNum = 1
  let output = ''

  while ((execResult = returnRegex.exec(snippetContent))) {
    output += `${getLineNumStr(lineNum)}  ${snippetContent.slice(lineStartIndex, execResult.index)}${execResult[0]}`
    lineStartIndex = execResult.index + execResult[0].length
    lineNum++
  }

  if (lineStartIndex <= snippetContent.length - 1) {
    output += `${getLineNumStr(lineNum)}  ${snippetContent.slice(lineStartIndex)}`
  } else {
    output += `${getLineNumStr(lineNum)}`
  }

  return output
}

export default class SnippetItem extends React.Component {
  snippetDomElRef = React.createRef()
  editorContainerRef = React.createRef()

  constructor (props) {
    super(props)
    this.state = {
      isEditing: false,
      isPreview: false
    }
  }

  componentDidMount () {
    const { snippet, editorRef, fastPreview, virtualRow } = this.props
    if (!fastPreview && editorRef) {
      this.editorContainerRef.current.appendChild(editorRef.dom)
      editorRef.editor.setValue(snippet.value)
      // this.applyEditorMode()
      // this.measureParentElementForVirtual(virtualRow)
    }

    // CodeMirror.on(editorRef.editor, 'change', () => {
    //   console.log('//////////////////////////////////////////////////////////////// viepor t change')
    //   alert('123')
    // })
  }

  editorEvent () {
    alert('123')
  }

  componentDidUpdate () {
    // console.error('Component did update =================================////////////////////////////////')
    const { snippet, editorRef, fastPreview, virtualRow } = this.props

    if (!editorRef.alreadyActive) {
      // console.error('Hola lets set the value')
      console.log('already not active')
      this.editorContainerRef.current.replaceChildren(editorRef.dom)
      // this.applyEditorMode()
    }
    console.log('ding dong maon =======')
    console.log(editorRef.editor.getValue())
    if (snippet.value !== editorRef.editor.getValue()) {
      console.log('====value diff============================================')
      editorRef.editor.setValue(snippet.value)
    }
    this.measureParentElementForVirtual(virtualRow)

    return true
  }

  componentWillUnmount () {
    this.unbindEvents()
  }

  applyEditorMode () {
    const { snippet, config, editorRef } = this.props
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
  }

  measureParentElementForVirtual (virtualRow) {
    if (virtualRow && this.snippetDomElRef.current) {
      virtualRow.measureElement(this.snippetDomElRef.current.parentElement)
    }
  }

  handlePreview () {
    this.setState({ isPreview: true })
  }

  handleExitPreview () {
    this.setState({ isPreview: false })
  }

  hasFocus () {
    const { editorRef } = this.props
    const { lang, name, tags, description } = this.refs
    return (
      editorRef.editor.hasFocus() ||
      lang === document.activeElement ||
      name === document.activeElement ||
      tags.hasFocus() ||
      description === document.activeElement
    )
  }

  handleSnippetLangChange () {
    const { editorRef } = this.props
    const snippetMode = CodeMirror.findModeByName(this.refs.lang.value).mode
    loadSnippetsLanguagesModes([{ lang: this.refs.lang.value }])
    editorRef.editor.setOption('mode', snippetMode)
  }

  copySnippet () {
    Clipboard.set(this.props.snippet.value)
    if (this.props.config.ui.showCopyNoti) {
      toast.info(i18n.__('Copied to clipboard'), { autoClose: 2000 })
    }
    const newSnippet = _.clone(this.props.snippet)
    this.props.store.increaseCopyTime(newSnippet)
  }

  handleEditButtonClick () {
    const { editorRef } = this.props
    this.setState({ isEditing: true, isPreview: false })
    editorRef.editor.setOption('readOnly', false)
    this.bindEvents()
    if (this.props.onEditClick) {
      this.props.onEditClick()
    }
  }

  bindEvents () {
    eventEmitter.on('snippets:saveAll', () => {
      if (this.state.isEditing && this.hasFocus()) {
        this.handleSaveChangesClick()
      }
    })
    eventEmitter.on('snippets:unSave', () => {
      if (this.state.isEditing && this.hasFocus()) {
        this.handleDiscardChangesClick()
      }
    })
  }

  unbindEvents () {
    eventEmitter.off('snippets:saveAll', () => {
      if (this.state.isEditing && this.hasFocus()) {
        this.handleSaveChangesClick()
      }
    })
    eventEmitter.off('snippets:unSave', () => {
      if (this.state.isEditing && this.hasFocus()) {
        this.handleDiscardChangesClick()
      }
    })
  }

  handleSaveChangesClick () {
    const { editorRef } = this.props
    const { lang, name, tags, description } = this.refs
    const { snippet } = this.props
    const newSnippetValue = editorRef.editor.getValue()
    const newSnippetLang = lang.value
    const newSnippetName = name.value
    const newSnippetTags = tags.getTags()
    const newSnippetDescription = description.value
    const valueChanged = snippet.value !== newSnippetValue
    const langChanged = snippet.lang !== newSnippetLang
    const nameChanged = snippet.name !== newSnippetName
    const tagChanged = !_.isEqual(snippet.tags, newSnippetTags)
    const descripChanged = snippet.description !== newSnippetDescription
    if (
      valueChanged ||
      langChanged ||
      nameChanged ||
      tagChanged ||
      descripChanged
    ) {
      const newSnippet = _.clone(this.props.snippet)
      newSnippet.value = newSnippetValue
      newSnippet.lang = newSnippetLang
      newSnippet.name = newSnippetName
      newSnippet.tags = newSnippetTags
      newSnippet.description = newSnippetDescription
      if (langChanged) {
        const snippetMode = CodeMirror.findModeByName(newSnippet.lang).mode
        loadSnippetsLanguagesModes([newSnippet])
        editorRef.editor.setOption('mode', snippetMode)
      }
      this.props.store.updateSnippet(newSnippet)
    }

    this.setState({ isEditing: false })
    editorRef.editor.setOption('readOnly', true)
    this.unbindEvents()
  }

  handleDeleteClick () {
    const { snippet, config } = this.props
    if (config.ui.showDeleteConfirmDialog) {
      if (!confirm(i18n.__('Are you sure to delete this snippet?'))) {
        return
      }
    }
    const newSnippet = _.clone(snippet)
    this.props.store.deleteSnippet(newSnippet)
  }

  exportSnippet () {
    const { snippet } = this.props
    const exportSnippet = toJS(snippet)
    dialog.showOpenDialog(
      {
        title: 'Pick export folder',
        buttonLabel: 'Export',
        properties: ['openDirectory']
      },
      paths => {
        if (paths && paths[0]) {
          const folder = paths[0]
          exportSnippetAPI(exportSnippet, folder)
          toast.success('Snippet exported!')
        }
      }
    )
  }

  renderHeader () {
    const { snippet } = this.props
    const { isEditing, isPreview } = this.state
    const languageIcon = getLanguageIcon(snippet.lang)
    const isMarkdown =
      snippet.lang === 'Markdown' || snippet.lang === 'GitHub Flavored Markdown'

    return (
      <div className="header">
        <div className="info">
          {languageIcon}
          &nbsp;&nbsp;&nbsp;
          {isEditing ? (
            <input type="text" ref="name" defaultValue={snippet.name} />
          ) : (
            <p className="snippet-name">{snippet.name}</p>
          )}
        </div>
        <div className="tools">
          {isEditing && (
            <select
              ref="lang"
              onChange={this.handleSnippetLangChange.bind(this)}
              defaultValue={snippet.lang}
            >
              {CodeMirror.modeInfo.map((mode, index) => (
                <option value={mode.name} key={index}>
                  {mode.name}
                </option>
              ))}
            </select>
          )}
          {!isEditing &&
            !isPreview &&
            isMarkdown && (
            <div
              className="preview-btn"
              data-tip={i18n.__('Preview')}
              onClick={this.handlePreview.bind(this)}
            >
              <FAIcon icon="eye" />
            </div>
          )}
          {!isEditing &&
            isPreview &&
            isMarkdown && (
            <div
              className="unpreview-btn"
              data-tip={i18n.__('Exit preview')}
              onClick={this.handleExitPreview.bind(this)}
            >
              <FAIcon icon="eye-slash" />
            </div>
          )}
          {!isEditing && (
            <div
              className="export-btn"
              data-tip={i18n.__('Export JSON')}
              onClick={this.exportSnippet.bind(this)}
            >
              <FAIcon icon="upload" />
            </div>
          )}
          {!isEditing && (
            <div
              className="copy-btn"
              data-tip={i18n.__('copy')}
              onClick={this.copySnippet.bind(this)}
            >
              <FAIcon icon="copy" />
            </div>
          )}
          {isEditing && (
            <div
              className="discard-btn"
              data-tip={i18n.__('discard changes')}
              onClick={this.handleDiscardChangesClick.bind(this)}
            >
              <FAIcon icon="times" />
            </div>
          )}
          {isEditing ? (
            <div
              className="save-btn"
              data-tip={i18n.__('save changes')}
              onClick={this.handleSaveChangesClick.bind(this)}
            >
              <FAIcon icon="check" />
            </div>
          ) : (
            <div
              className="edit-btn"
              data-tip={i18n.__('edit')}
              onClick={this.handleEditButtonClick.bind(this)}
            >
              <FAIcon icon="edit" />
            </div>
          )}
          {!isEditing && (
            <div
              className="delete-btn"
              data-tip={i18n.__('delete snippet')}
              onClick={this.handleDeleteClick.bind(this)}
            >
              <FAIcon icon="trash-alt" />
            </div>
          )}
        </div>
      </div>
    )
  }

  handleDiscardChangesClick () {
    const { editorRef } = this.props
    this.setState({ isEditing: false }, () => {
      editorRef.editor.setOption('readOnly', true)
    })
    this.unbindEvents()
  }

  renderTagList () {
    const { snippet, config } = this.props
    const { isEditing } = this.state
    const tags = snippet.tags.filter(tag => tag)
    return (
      <div
        className="tag-list"
        style={{ overflowY: isEditing ? 'initial' : 'hidden' }}
      >
        <span className="icon">
          <FAIcon icon="tags" />
        </span>
        {isEditing ? (
          <TagInput
            ref="tags"
            color={config.ui.tagColor}
            maxHeight="40px"
            defaultTags={tags}
          />
        ) : tags.length > 0 ? (
          tags.map((tag, index) => (
            <TagItem config={config} tag={tag} key={index} />
          ))
        ) : (
          'No tag'
        )}
      </div>
    )
  }

  renderDescription () {
    const { snippet } = this.props
    const { isEditing } = this.state
    return (
      <div className={`description ${isEditing ? 'editing' : ''}`}>
        {isEditing ? (
          <textarea ref="description" defaultValue={snippet.description} />
        ) : (
          snippet.description
        )}
      </div>
    )
  }

  renderFooter () {
    const { snippet, config } = this.props
    return (
      <div className="footer">
        <div className="info-left">
          {config.ui.showSnippetCreateTime && (
            <span className="createAt">
              {i18n.__('Create at')} : {formatDate(snippet.createAt)}
            </span>
          )}
          {config.ui.showSnippetUpdateTime && (
            <span className="updateAt">
              {i18n.__('Last update')} : {formatDate(snippet.updateAt)}
            </span>
          )}
        </div>
        <div className="info-right">
          {config.ui.showSnippetCopyCount && (
            <span className="copyCount">
              {i18n.__('Copy')} : {snippet.copy} {i18n.__('times')}
            </span>
          )}
        </div>
      </div>
    )
  }

  renderEditor () {
    const { snippet, fastPreview, fastPreviewStyle, config } = this.props

    const {
      showLineNumber
    } = config.editor

    if (fastPreview) {
      return <pre className='fastPreview' style={{
        fontFamily: 'monospace',
        fontSize: '13px',
        fontVariantLigatures: 'contextual',
        padding: '4px',
        paddingBottom: '8px',
        lineHeight: '19.5px',
        minHeight: '32px',
        margin: 0,
        ...fastPreviewStyle
      }}>
        {showLineNumber ? addLinesNumbers(snippet.value) : snippet.value}
      </pre>
    }

    return <div ref={this.editorContainerRef}></div>
  }

  render () {
    const { isPreview } = this.state
    const { config, snippet, fastPreview, fastPreviewStyle } = this.props
    const isMarkdown =
      snippet.lang === 'Markdown' || snippet.lang === 'GitHub Flavored Markdown'

    console.log('config.editor.theme =================================================================')
    console.log(config.editor.theme)

    return (
      <div ref={this.snippetDomElRef} className="snippet-item original">
        <ReactTooltip place="bottom" effect="solid" />
        {this.renderHeader()}
        {this.renderTagList()}
        {this.renderDescription()}
        {isMarkdown && isPreview ? (
          <div style={{ height: '300px' }}>
            <MarkdownPreview markdown={snippet.value} />
          </div>
        ) : this.renderEditor()}
        {this.renderFooter()}
      </div>
    )
  }
}
