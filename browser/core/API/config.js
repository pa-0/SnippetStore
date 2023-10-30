import path from 'path'
import os from 'os'
import CM from 'lib/config-manager'
const remote = window.require('@electron/remote')

const isTest = process.env.NODE_ENV === 'test'

export const getMainAppDataPath = () => {
  const customStorage = CM.get().storage
  const defaultStorage = path.join(
    remote.app.getPath('appData'),
    'SnippetStore'
  )
  return customStorage || defaultStorage
}

export const getAppDataPath = () => {
  return isTest
    ? path.join(os.tmpdir(), 'SnippetStore', 'test')
    : getMainAppDataPath()
}

export const getSnippetFile = () => path.join(getAppDataPath(), 'snippets.json')
