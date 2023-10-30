import React from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { observeElementRect, observeElementOffset, elementScroll } from '@tanstack/virtual-core'

export function getVirtualizerOptions (options) {
  return {
    observeElementRect,
    observeElementOffset,
    scrollToFn: elementScroll,
    ...options,
    onChange: () => {
      this.forceUpdate()
      if (options?.onChange) {
        options.onChange()
      }
    }
  }
}

export const VirtualList = function VirtualList (props) {
  const rowOrColumnVirtualizer = useVirtualizer(props.options)
  return <>{props.children(rowOrColumnVirtualizer)}</>
}

// , (prevProps, nextProps) => {
//   const isDifferentLength = Object.keys(prevProps.options).length !== Object.keys(nextProps.options).length
//   if (isDifferentLength) {
//     return false
//   }

//   const prevOptionsKeys = Object.keys(prevProps.options).sort()
//   const nextOptionsKeys = Object.keys(nextProps.options).sort()

//   for (let i = 0; i < prevOptionsKeys.length; i++) {
//     if (prevOptionsKeys[i] !== nextOptionsKeys[i]) {
//       return false
//     }
//     if (prevProps.options[prevOptionsKeys[i]] !== nextProps.options[nextOptionsKeys[i]]) {
//       return false
//     }
//   }
//   return true
// })
