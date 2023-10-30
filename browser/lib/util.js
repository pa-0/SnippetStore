import crypto from 'crypto'
import { last } from 'lodash'

export function generateKey () {
  return crypto.randomBytes(20).toString('hex')
}

export function findObject (array, property, value) {
  for (let i = 0; i < array.length; i++) {
    if (array[i][property] === value) {
      return array[i]
    }
  }

  return null
}

export function findIndexObject (array, property, value) {
  for (let i = 0; i < array.length; i++) {
    if (array[i][property] === value) {
      return i
    }
  }

  return -1
}

export function getExtension (name) {
  const indexOfExtension = name.lastIndexOf('.')
  if (indexOfExtension !== -1) {
    return name.substring(indexOfExtension + 1)
  } else {
    return 'txt'
  }
}

export function getLinesNumber (str) {
  const split = str.split(/\n|\r\n|\r/g)
  return split.length
}

export function getTextAreaLinesNumber (str) {
  const split = str.split(/\n|\r\n|\r/g)
  if (split.length === 1) {
    return 1
  }
  if (last(split) !== '') {
    return split.length
  }
  return split.length - 1
}

export function getPropertyComputedValue (domEl, property) {
  return window.getComputedStyle(domEl, null).getPropertyValue(property)
}
