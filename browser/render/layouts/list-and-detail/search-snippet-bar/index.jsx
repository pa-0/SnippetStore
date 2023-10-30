import React from 'react'
import { debounce } from 'lodash'
import FAIcon from '@fortawesome/react-fontawesome'
import eventEmitter from 'lib/event-emitter'
import './search-snippet-bar'

function ourDebounce (callback, duration) {
  let timeoutHandler
  return function (...args) {
    if (timeoutHandler) clearTimeout(timeoutHandler)
    timeoutHandler = setTimeout(() => {
      callback(...args)
    }, duration)
  }
}

export default class SearchSnippetBar extends React.Component {
  constructor (props) {
    super(props)
    this.handleSearchLanguage = (event, language) => {
      const newKeyword = `lang:${language}`
      if (this.refs.search) {
        this.refs.search.value = newKeyword
      }
      this.handleSearch(newKeyword)
    }
    this.handleSearchTag = (event, tag) => {
      const newKeyword = `#${tag}`
      if (this.refs.search) {
        this.refs.search.value = newKeyword
      }
      this.handleSearch(newKeyword)
    }
    this.debouncedHandleSearch = ourDebounce(this.handleSearch, 500)
  }

  componentDidMount () {
    eventEmitter.on('languageList:pickLang', this.handleSearchLanguage)
    eventEmitter.on('taglist:pickTag', this.handleSearchTag)
    eventEmitter.on('tag:click', this.handleSearchTag)
  }

  componentWillUnmount () {
    eventEmitter.off('languageList:pickLang', this.handleSearchLanguage)
    eventEmitter.off('taglist:pickTag', this.handleSearchTag)
    eventEmitter.off('tag:click', this.handleSearchTag)
  }

  handleCreateSnippetClick () {
    eventEmitter.emit('modal:open', 'pickSnippetTypeModal')
  }

  handleSearch (keyword) {
    this.props.store.filter = keyword
  }

  render () {
    return (
      <div className="search-snippet-bar">
        <input
          type="text"
          id="search"
          placeholder="Search"
          ref="search"
          onChange={(e) => { this.debouncedHandleSearch(e.target.value) }}
        />
        <span className="new-snippet" onClick={this.handleCreateSnippetClick}>
          <FAIcon icon="plus" />
        </span>
      </div>
    )
  }
}
