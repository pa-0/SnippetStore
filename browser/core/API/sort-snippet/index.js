import sortByCreateTime from './sort-by-create-time'
import sortByUpdateTime from './sort-by-update-time'
import sortByCopyCount from './sort-by-copy-count'

export function sortSnippet (snippets, type) {
  if (type === 'createTimeNewer' || type === 'createTimeOlder') {
    return sortByCreateTime(snippets, type)
  } else if (type === 'updateTimeNewer' || type === 'updateTimeOlder') {
    return sortByUpdateTime(snippets, type)
  } else {
    return sortByCopyCount(snippets, type)
  }
}

export function sortBySearchFullMatch (snippets, filter) {
  const fullMatchSnippets = []
  const noFullMatchSnippets = []

  const filterLowerCase = (filter || '').toLowerCase()

  console.log('sortBySearchFullMatch =================')
  console.log(filterLowerCase)

  snippets.forEach((snippet) => {
    if (snippet.name.toLowerCase().includes(filterLowerCase)) {
      fullMatchSnippets.push(snippet)
    } else {
      noFullMatchSnippets.push(snippet)
    }
  })

  console.log({
    fullMatchSnippets,
    noFullMatchSnippets
  })

  return [...fullMatchSnippets, ...noFullMatchSnippets]
}
