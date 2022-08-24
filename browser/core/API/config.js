import path from 'path'
import os from 'os'
import CM from 'lib/config-manager'
const remote = require('@electron/remote')

const isTest = process.env.NODE_ENV === 'test'

const getMainAppDataPath = () => {
  const customStorage = CM.get().storage
  const defaultStorage = path.join(
    remote.app.getPath('appData'),
    'SnippetStore'
  )
  return customStorage || defaultStorage
}

const getAppDataPath = () => {
  return isTest
    ? path.join(os.tmpdir(), 'SnippetStore', 'test')
    : getMainAppDataPath()
}

const getSnippetFile = () => path.join(getAppDataPath(), 'snippets.json')

module.exports = {
  getAppDataPath,
  getSnippetFile
}
