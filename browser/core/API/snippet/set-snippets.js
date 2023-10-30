import { getSnippetFile } from '../config'
const sander = window.require('sander')

export default function setSnippets (snippets) {
  sander.writeFileSync(getSnippetFile(), JSON.stringify(snippets), {
    encoding: 'utf-8'
  })
}
