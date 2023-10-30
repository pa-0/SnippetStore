import _ from 'lodash'

function searchByName (snippets, name) {
  const filteredSnippets = []
  if (name) {
    const nameRegex = new RegExp(_.escapeRegExp(name), 'i')
    snippets.forEach((snippet) => {
      if (snippet.name.match(nameRegex)) {
        filteredSnippets.push(snippet)
        return
      }

      if (snippet.files) {
        let file
        for (let i = 0; i < snippet.files.length; i++) {
          file = snippet.files[i]
          if (file.name.match(nameRegex)) {
            filteredSnippets.push(snippet)
            return
          }
        }
      }
    })
    return filteredSnippets
  }
  return snippets
}

export default searchByName
