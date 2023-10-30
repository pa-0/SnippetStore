import React from 'react'
import { observer } from 'mobx-react'
import { Virtualizer } from '@tanstack/virtual-core'
import SnippetItem from '../snippet-item'
import { getVirtualizerOptions } from '../../../../lib/virtualList'
import SearchSnippetBar from '../search-snippet-bar'
import SortSnippetTool from '../sort-snippet-tool'
import eventEmitter from 'lib/event-emitter'
import './snippet-list'

@observer
export default class SnippetList extends React.Component {
  state = {
    isEditingOn: false,
    virtualizerOptions: getVirtualizerOptions.call(this, {
      count: this.props.state.snippets.length,
      getScrollElement: () => this.snippetsListContainerRef.current,
      estimateSize: (index) => {
        // const snippet = this.props.store.snippets[index]
        // return snippet.value.length / 20 + snippet.description.length / 20
        return 500
      }
    })
  }

  // virtualizer
  snippetsListContainerRef = React.createRef()

  // constructor (props) {
  //   super(props)
  //   // this.virtualizer = new Virtualizer(this.state.virtualizerOptions)
  // }

  //  instance.setOptions(resolvedOptions)

  componentDidMount () {
    eventEmitter.on('snippet-detail:edit-start', this.toggleEditOn)
    eventEmitter.on('snippet-detail:edit-end', this.toggleEditOff)
    eventEmitter.on('snippet-list:previous', this.goToPreviousSnippet)
    eventEmitter.on('snippet-list:next', this.goToNextSnippet)

    console.log('SnippetList: Component mount')

    // this.virtualizer._didMount()
  }

  // shouldComponentUpdate (nextProps, nextState) {
  //   console.log('SnippetList: should componet update')
  //   const start = Date.now()
  //   this.virtualizer.setOptions(getVirtualizerOptions.call(this, {
  //     ...nextState.virtualizerOptions,
  //     count: nextProps.snippets.length
  //   }))
  //   console.log((Date.now() - start) / 1000)
  //   this.virtualizer._willUpdate()
  //   console.log((Date.now() - start) / 1000)
  //   return true
  // }

  componentWillUnmount () {
    eventEmitter.off('snippet-detail:edit-start', this.toggleEditOn)
    eventEmitter.off('snippet-detail:edit-end', this.toggleEditOff)
    eventEmitter.off('snippet-list:previous', this.goToPreviousSnippet)
    eventEmitter.off('snippet-list:next', this.goToNextSnippet)
    console.log('SnippetList: component will unmount')
  }

  toggleEditOn = () => {
    this.setState({ isEditingOn: true })
  }

  toggleEditOff = () => {
    this.setState({ isEditingOn: false })
  }

  goToNextSnippet = () => {
    const { snippets, selectedSnippet } = this.props.store
    if (selectedSnippet) {
      for (let i = 0; i < snippets.length; i++) {
        if (snippets[i].key === selectedSnippet.key) {
          // the next snippet of the i-th snippet is i + 1
          let nextIndex = i + 1
          if (nextIndex > snippets.length - 1) {
            nextIndex = 0
          }
          this.props.store.selectedSnippet = snippets[nextIndex]
          break
        }
      }
    } else {
      this.props.store.selectedSnippet = snippets[0]
    }
  }

  goToPreviousSnippet = () => {
    const { snippets, selectedSnippet } = this.props.store
    if (selectedSnippet) {
      for (let i = 0; i < snippets.length; i++) {
        if (snippets[i].key === selectedSnippet.key) {
          // previous of the i-th snippet is i - 1
          let previousIndex = i - 1
          if (previousIndex < 0) {
            previousIndex = snippets.length - 1
          }
          this.props.store.selectedSnippet = snippets[previousIndex]
          break
        }
      }
    } else {
      this.props.store.selectedSnippet = snippets[0]
    }
  }

  render () {
    const { isEditingOn } = this.state
    const { store, config } = this.props
    const { snippets, selectedSnippet } = store
    console.log('SnippetList: render =================================================================')
    console.log(snippets.length)
    console.log('virtual items:')
    // console.log(this.virtualizer.getVirtualItems().length)
    return (
      <div className="snippets list-and-detail">
        <div
          className="wall"
          style={{ display: `${isEditingOn ? 'block' : 'none'}` }}
        />
        <SearchSnippetBar store={store} />
        <SortSnippetTool store={store} />
        <ul ref={this.snippetsListContainerRef}>
          {/* {this.virtualizer.getVirtualItems().map(virtualRow => {
            const snippet = snippets[virtualRow.index]
            return (
              <li
                key={snippet.key}
                ref={virtualRow.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  // width: '100%',
                  transform: `translateY(${virtualRow.start}px)`
                }}
              >
                <SnippetItem
                  selected={
                    selectedSnippet && selectedSnippet.key === snippet.key
                  }
                  store={store}
                  config={config}
                  snippet={snippet}
                />
              </li>
            )
          })} */}
        </ul>
      </div>
    )
  }
}
