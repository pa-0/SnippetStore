const path = window.require('path')
const sander = window.require('sander')
const remote = window.require('@electron/remote')
const { app } = remote

const themePath =
  process.env.NODE_ENV === 'production'
    ? path.join(app.getAppPath(), './node_modules/codemirror/theme')
    : window.require('path').resolve('./node_modules/codemirror/theme')
const themes = sander.readdirSync(themePath).map(themePath => {
  return themePath.substring(0, themePath.lastIndexOf('.'))
})

export default {
  EDITOR_THEMES: themes
}
